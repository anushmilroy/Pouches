import { sql, eq, desc } from "drizzle-orm";
import { db } from "./db";
import { 
  users as usersTable, 
  orders as ordersTable, 
  commissionTransactions as commissionsTable,
  distributorInventory as distributorInventoryTable,
  distributorCommissions as distributorCommissionsTable,
  products as productsTable
} from "@shared/schema";
import type { 
  User, 
  InsertUser, 
  CommissionTransaction, 
  Order, 
  DistributorInventory,
  DistributorCommission,
  InsertDistributorInventory,
  InsertDistributorCommission
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { UserRole, WholesaleStatus, DistributorCommissionStatus } from "@shared/schema";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User management
  getUserByUsername(username: string): Promise<User | undefined>;
  getUser(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserOrders(userId: number): Promise<Order[]>;
  getConsignmentOrders(): Promise<Order[]>;
  updateCustomPricing(userId: number, customPricing: Record<string, number>): Promise<User>;
  getWholesaleUsers(): Promise<User[]>;
  
  // Referral management
  getUsersWithReferrals(): Promise<User[]>;
  getReferralsByUserId(userId: number): Promise<Order[]>;
  getCommissionTransactions(userId: number): Promise<CommissionTransaction[]>;
  getAllCommissionTransactions(): Promise<CommissionTransaction[]>;
  getActiveReferrersCount(): Promise<number>;
  getPromotions(): Promise<any[]>;
  getDistributors(): Promise<User[]>;
  updateWholesaleStatus(userId: number, status: keyof typeof WholesaleStatus): Promise<User>;
  sessionStore: session.Store;

  // Add new interface methods for distributor management
  getDistributorInventory(distributorId: number): Promise<DistributorInventory[]>;
  updateDistributorInventory(data: InsertDistributorInventory): Promise<DistributorInventory>;
  allocateOrderToDistributor(orderId: number, distributorId: number): Promise<Order>;
  getDistributorCommissions(distributorId: number): Promise<DistributorCommission[]>;
  createDistributorCommission(data: InsertDistributorCommission): Promise<DistributorCommission>;
  getAllDistributorCommissions(): Promise<DistributorCommission[]>;
  getUnassignedOrders(): Promise<Order[]>;
  createDistributor(data: InsertUser): Promise<User>;
  getDistributorOrders(distributorId: number): Promise<Order[]>;
  getProducts(): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async updateWholesaleStatus(userId: number, status: keyof typeof WholesaleStatus): Promise<User> {
    try {
      console.log(`Updating wholesale status for user ${userId} to ${status}`);
      const [updatedUser] = await db
        .update(usersTable)
        .set({ wholesaleStatus: status })
        .where(eq(usersTable.id, userId))
        .returning();

      if (!updatedUser) {
        throw new Error(`User ${userId} not found`);
      }

      console.log(`Successfully updated wholesale status for user ${userId}:`, {
        ...updatedUser,
        password: '***'
      });

      return updatedUser;
    } catch (error) {
      console.error(`Error updating wholesale status for user ${userId}:`, error);
      throw new Error(`Failed to update wholesale status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getWholesaleUsers(): Promise<User[]> {
    try {
      console.log("Fetching wholesale users...");
      // Explicitly select all fields to ensure we get complete user data
      const users = await db
        .select({
          id: usersTable.id,
          username: usersTable.username,
          password: usersTable.password,
          role: usersTable.role,
          wholesaleStatus: usersTable.wholesaleStatus,
          companyName: usersTable.companyName,
          companyAddress: usersTable.companyAddress,
          companyWebsite: usersTable.companyWebsite,
          bankDetails: usersTable.bankDetails,
          referrerId: usersTable.referrerId,
          referralCode: usersTable.referralCode,
          commission: usersTable.commission,
          commissionTier: usersTable.commissionTier,
          totalReferrals: usersTable.totalReferrals,
          createdAt: usersTable.createdAt,
          customPricing: usersTable.customPricing
        })
        .from(usersTable)
        .where(eq(usersTable.role, UserRole.WHOLESALE))
        .orderBy(desc(usersTable.createdAt));

      // Log each user's details (excluding sensitive info)
      users.forEach(user => {
        console.log("Wholesale user details:", {
          id: user.id,
          username: user.username,
          companyName: user.companyName || 'Not provided',
          companyAddress: user.companyAddress || 'Not provided',
          companyWebsite: user.companyWebsite || 'Not provided',
          referralCode: user.referralCode || 'None',
          wholesaleStatus: user.wholesaleStatus,
          createdAt: user.createdAt
        });
      });

      // Return the complete user objects
      return users;
    } catch (error) {
      console.error("Error fetching wholesale users:", error);
      throw new Error("Failed to fetch wholesale users");
    }
  }

  async createUser(userData: InsertUser): Promise<User> {
    try {
      console.log("Creating new user:", { 
        ...userData,
        password: '***',
        role: userData.role,
        wholesaleStatus: userData.wholesaleStatus 
      });

      // Clean up the user data before insertion
      const cleanedData = {
        ...userData,
        commission: userData.commission ?? "0.00",
        commissionTier: userData.commissionTier ?? "STANDARD",
        totalReferrals: userData.totalReferrals ?? 0,
        // Only include referralCode if it's not empty
        referralCode: userData.referralCode?.trim() || null
      };

      // Insert the user with cleaned data
      const [newUser] = await db
        .insert(usersTable)
        .values(cleanedData)
        .returning();

      if (!newUser) {
        console.error("User creation failed: No user returned from insert operation");
        throw new Error("Failed to create user");
      }

      console.log("User created successfully:", { 
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        wholesaleStatus: newUser.wholesaleStatus 
      });

      return newUser;
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof Error && error.message.includes('users_referral_code_key')) {
        throw new Error("Invalid referral code");
      }
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      console.log(`Looking up user by username: ${username}`);
      const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
      return user;
    } catch (error) {
      console.error("Error getting user by username:", error);
      return undefined;
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      console.log(`Looking up user by ID: ${id}`);
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
      return user;
    } catch (error) {
      console.error("Error getting user by ID:", error);
      return undefined;
    }
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    try {
      console.log(`Fetching orders for user ${userId}...`);
      const orders = await db.select()
        .from(ordersTable)
        .where(eq(ordersTable.userId, userId))
        .orderBy(desc(ordersTable.createdAt));
      console.log(`Found ${orders.length} orders for user ${userId}`);
      return orders;
    } catch (error) {
      console.error(`Error getting orders for user ${userId}:`, error);
      return [];
    }
  }

  async getConsignmentOrders(): Promise<Order[]> {
    try {
      console.log('Fetching consignment orders...');
      const orders = await db.select()
        .from(ordersTable)
        .where(sql`${ordersTable.status} = 'PENDING' AND ${ordersTable.paymentMethod} = 'COD'`)
        .orderBy(desc(ordersTable.createdAt));
      console.log(`Found ${orders.length} consignment orders`);
      return orders;
    } catch (error) {
      console.error('Error getting consignment orders:', error);
      return [];
    }
  }

  async getUsersWithReferrals(): Promise<User[]> {
    try {
      console.log("Fetching users with referrals...");
      const userRows = await db.select()
        .from(usersTable)
        .where(sql`${usersTable.totalReferrals} > 0 OR ${usersTable.referralCode} IS NOT NULL`);
      console.log(`Found ${userRows.length} users with referrals`);
      return userRows;
    } catch (error) {
      console.error("Error getting users with referrals:", error);
      return [];
    }
  }

  async getReferralsByUserId(userId: number): Promise<Order[]> {
    try {
      console.log(`Fetching referrals for user ${userId}...`);
      const referralOrders = await db.select()
        .from(ordersTable)
        .where(eq(ordersTable.referrerId, userId))
        .orderBy(desc(ordersTable.createdAt));
      console.log(`Found ${referralOrders.length} referrals for user ${userId}`);
      return referralOrders;
    } catch (error) {
      console.error(`Error getting referrals for user ${userId}:`, error);
      return [];
    }
  }

  async getCommissionTransactions(userId: number): Promise<CommissionTransaction[]> {
    try {
      console.log(`Fetching commission transactions for user ${userId}...`);
      const transactionRows = await db.select()
        .from(commissionsTable)
        .where(eq(commissionsTable.userId, userId))
        .orderBy(desc(commissionsTable.createdAt));
      console.log(`Found ${transactionRows.length} commission transactions for user ${userId}`);
      return transactionRows;
    } catch (error) {
      console.error(`Error getting commission transactions for user ${userId}:`, error);
      return [];
    }
  }

  async getAllCommissionTransactions(): Promise<CommissionTransaction[]> {
    try {
      console.log("Fetching all commission transactions...");
      const allTransactions = await db.select()
        .from(commissionsTable)
        .orderBy(desc(commissionsTable.createdAt));
      console.log(`Found ${allTransactions.length} total commission transactions`);
      return allTransactions;
    } catch (error) {
      console.error("Error getting all commission transactions:", error);
      return [];
    }
  }

  async getActiveReferrersCount(): Promise<number> {
    try {
      console.log("Counting active referrers...");
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(usersTable)
        .where(sql`${usersTable.totalReferrals} > 0`);
      console.log(`Found ${result[0].count} active referrers`);
      return result[0].count;
    } catch (error) {
      console.error("Error getting active referrers count:", error);
      return 0;
    }
  }

  async updateCustomPricing(userId: number, customPricing: Record<string, number>): Promise<User> {
    try {
      console.log(`Updating custom pricing for user ${userId}`);
      const [updatedUser] = await db
        .update(usersTable)
        .set({ customPricing })
        .where(eq(usersTable.id, userId))
        .returning();

      if (!updatedUser) {
        throw new Error(`User ${userId} not found`);
      }

      return updatedUser;
    } catch (error) {
      console.error(`Error updating custom pricing for user ${userId}:`, error);
      throw error;
    }
  }

  async getPromotions(): Promise<any[]> {
    try {
      console.log("Fetching promotions...");
      return [];  // Stub implementation until promotions feature is implemented
    } catch (error) {
      console.error("Error fetching promotions:", error);
      return [];
    }
  }

  async getDistributors(): Promise<User[]> {
    try {
      console.log("Fetching distributors...");
      const distributors = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.role, UserRole.DISTRIBUTOR))
        .orderBy(desc(usersTable.createdAt));
      return distributors;
    } catch (error) {
      console.error("Error fetching distributors:", error);
      return [];
    }
  }

  async getDistributorInventory(distributorId: number): Promise<DistributorInventory[]> {
    try {
      console.log(`Fetching inventory for distributor ${distributorId}...`);
      const result = await db
        .select({
          id: distributorInventoryTable.id,
          distributorId: distributorInventoryTable.distributorId,
          productId: distributorInventoryTable.productId,
          quantity: distributorInventoryTable.quantity,
          createdAt: distributorInventoryTable.createdAt,
          updatedAt: distributorInventoryTable.updatedAt,
          productName: productsTable.name // Add product name to the result
        })
        .from(distributorInventoryTable)
        .innerJoin(
          productsTable,
          eq(distributorInventoryTable.productId, productsTable.id)
        )
        .where(eq(distributorInventoryTable.distributorId, distributorId));

      console.log(`Found ${result.length} inventory items for distributor ${distributorId}`);
      return result;
    } catch (error) {
      console.error(`Error fetching distributor inventory:`, error);
      return [];
    }
  }

  async updateDistributorInventory(data: InsertDistributorInventory): Promise<DistributorInventory> {
    try {
      console.log(`Updating inventory for distributor ${data.distributorId}, product ${data.productId}`);
      const [inventory] = await db
        .insert(distributorInventoryTable)
        .values(data)
        .onConflictDoUpdate({
          target: [
            distributorInventoryTable.distributorId,
            distributorInventoryTable.productId,
          ],
          set: { quantity: data.quantity }
        })
        .returning();

      return inventory;
    } catch (error) {
      console.error(`Error updating distributor inventory:`, error);
      throw error;
    }
  }

  async allocateOrderToDistributor(orderId: number, distributorId: number): Promise<Order> {
    try {
      console.log(`Allocating order ${orderId} to distributor ${distributorId}`);
      const [order] = await db
        .update(ordersTable)
        .set({ distributorId })
        .where(eq(ordersTable.id, orderId))
        .returning();

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      return order;
    } catch (error) {
      console.error(`Error allocating order to distributor:`, error);
      throw error;
    }
  }

  async getDistributorCommissions(distributorId: number): Promise<DistributorCommission[]> {
    try {
      console.log(`Fetching commissions for distributor ${distributorId}...`);
      const commissions = await db.select()
        .from(distributorCommissionsTable)
        .where(eq(distributorCommissionsTable.distributorId, distributorId))
        .orderBy(desc(distributorCommissionsTable.createdAt));

      console.log(`Found ${commissions.length} commissions for distributor ${distributorId}`);
      return commissions;
    } catch (error) {
      console.error(`Error fetching distributor commissions:`, error);
      return [];
    }
  }

  async createDistributorCommission(data: InsertDistributorCommission): Promise<DistributorCommission> {
    try {
      console.log(`Creating commission for distributor ${data.distributorId}, order ${data.orderId}`);
      const [commission] = await db
        .insert(distributorCommissionsTable)
        .values(data)
        .returning();

      return commission;
    } catch (error) {
      console.error(`Error creating distributor commission:`, error);
      throw error;
    }
  }

  async getAllDistributorCommissions(): Promise<DistributorCommission[]> {
    try {
      console.log('Fetching all distributor commissions...');
      const commissions = await db.select()
        .from(distributorCommissionsTable)
        .orderBy(desc(distributorCommissionsTable.createdAt));

      console.log(`Found ${commissions.length} total distributor commissions`);
      return commissions;
    } catch (error) {
      console.error('Error fetching all distributor commissions:', error);
      return [];
    }
  }

  async getUnassignedOrders(): Promise<Order[]> {
    try {
      console.log("Fetching unassigned orders...");
      const orders = await db.select()
        .from(ordersTable)
        .where(sql`${ordersTable.distributorId} IS NULL`)
        .orderBy(desc(ordersTable.createdAt));

      console.log(`Found ${orders.length} unassigned orders`);
      return orders;
    } catch (error) {
      console.error("Error fetching unassigned orders:", error);
      return [];
    }
  }

  async createDistributor(data: InsertUser): Promise<User> {
    try {
      console.log("Creating new distributor account:", {
        ...data,
        password: '***'
      });

      const [distributor] = await db
        .insert(usersTable)
        .values({
          ...data,
          role: UserRole.DISTRIBUTOR
        })
        .returning();

      if (!distributor) {
        throw new Error("Failed to create distributor account");
      }

      console.log("Successfully created distributor account:", {
        id: distributor.id,
        username: distributor.username,
        role: distributor.role
      });

      return distributor;
    } catch (error) {
      console.error("Error creating distributor:", error);
      throw new Error(`Failed to create distributor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
    async getDistributorOrders(distributorId: number): Promise<Order[]> {
    try {
      console.log(`Fetching orders for distributor ${distributorId}...`);
      const orders = await db.select()
        .from(ordersTable)
        .where(eq(ordersTable.distributorId, distributorId))
        .orderBy(desc(ordersTable.createdAt));

      console.log(`Found ${orders.length} orders for distributor ${distributorId}`);
      return orders;
    } catch (error) {
      console.error(`Error getting orders for distributor ${distributorId}:`, error);
      return [];
    }
  }

  async getProducts(): Promise<any[]> {
    try {
      console.log('Fetching products...');
      const products = await db.select().from(productsTable);
      console.log(`Found ${products.length} products`);
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();
import { sql, eq, desc } from "drizzle-orm";
import { db } from "./db";
import { 
  users as usersTable, 
  orders as ordersTable, 
  commissionTransactions as commissionsTable,
  distributorInventory as distributorInventoryTable,
  distributorCommissions as distributorCommissionsTable,
  products as productsTable,
  wholesaleLoans,
  loanRepayments,
  orders,
  users
} from "@shared/schema";
import type { 
  User, 
  InsertUser, 
  CommissionTransaction, 
  Order, 
  DistributorInventory,
  DistributorCommission,
  InsertDistributorInventory,
  InsertDistributorCommission,
  WholesaleLoan,
  InsertWholesaleLoan,
  LoanRepayment,
  InsertLoanRepayment,
  InsertOrder
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { UserRole, WholesaleStatus, DistributorCommissionStatus, LoanStatus } from "@shared/schema";

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
  // Add updateUser to the interface
  updateUser(id: number, data: Partial<InsertUser>): Promise<User>;

  // Wholesale loan methods
  createWholesaleLoan(data: InsertWholesaleLoan): Promise<WholesaleLoan>;
  getWholesaleLoanById(id: number): Promise<WholesaleLoan | undefined>;
  getWholesaleLoansForUser(wholesalerId: number): Promise<WholesaleLoan[]>;
  updateWholesaleLoanStatus(id: number, status: keyof typeof LoanStatus): Promise<WholesaleLoan>;
  createLoanRepayment(data: InsertLoanRepayment): Promise<LoanRepayment>;
  getLoanRepayments(loanId: number): Promise<LoanRepayment[]>;

  // Order management
  createOrder(order: InsertOrder): Promise<Order>;
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
  async updateUser(id: number, data: Partial<InsertUser>): Promise<User> {
    try {
      console.log(`Updating user ${id} with data:`, { ...data, password: data.password ? '***' : undefined });
      const [updatedUser] = await db
        .update(usersTable)
        .set(data)
        .where(eq(usersTable.id, id))
        .returning();

      if (!updatedUser) {
        throw new Error(`User ${id} not found`);
      }

      console.log(`Successfully updated user ${id}`);
      return updatedUser;
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createWholesaleLoan(data: InsertWholesaleLoan): Promise<WholesaleLoan> {
    try {
      console.log(`Creating wholesale loan for user ${data.wholesalerId}`);
      const [loan] = await db
        .insert(wholesaleLoans)
        .values(data)
        .returning();

      if (!loan) {
        throw new Error("Failed to create wholesale loan");
      }

      return loan;
    } catch (error) {
      console.error("Error creating wholesale loan:", error);
      throw new Error(`Failed to create wholesale loan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getWholesaleLoanById(id: number): Promise<WholesaleLoan | undefined> {
    try {
      console.log(`Fetching wholesale loan ${id}`);
      const [loan] = await db
        .select()
        .from(wholesaleLoans)
        .where(eq(wholesaleLoans.id, id));
      return loan;
    } catch (error) {
      console.error(`Error fetching wholesale loan ${id}:`, error);
      return undefined;
    }
  }

  async getWholesaleLoansForUser(wholesalerId: number): Promise<WholesaleLoan[]> {
    try {
      console.log(`Fetching wholesale loans for user ${wholesalerId}`);
      const loans = await db
        .select()
        .from(wholesaleLoans)
        .where(eq(wholesaleLoans.wholesalerId, wholesalerId))
        .orderBy(desc(wholesaleLoans.createdAt));
      return loans;
    } catch (error) {
      console.error(`Error fetching wholesale loans for user ${wholesalerId}:`, error);
      return [];
    }
  }

  async updateWholesaleLoanStatus(id: number, status: keyof typeof LoanStatus): Promise<WholesaleLoan> {
    try {
      console.log(`Updating wholesale loan ${id} status to ${status}`);
      const [loan] = await db
        .update(wholesaleLoans)
        .set({
          status,
          ...(status === 'APPROVED' ? { approvedAt: new Date() } : {}),
          ...(status === 'PAID' ? { paidAt: new Date() } : {})
        })
        .where(eq(wholesaleLoans.id, id))
        .returning();

      if (!loan) {
        throw new Error(`Wholesale loan ${id} not found`);
      }

      return loan;
    } catch (error) {
      console.error(`Error updating wholesale loan ${id} status:`, error);
      throw error;
    }
  }

  async createLoanRepayment(data: InsertLoanRepayment): Promise<LoanRepayment> {
    try {
      console.log(`Creating loan repayment for loan ${data.loanId}`);
      const [repayment] = await db
        .insert(loanRepayments)
        .values(data)
        .returning();

      if (!repayment) {
        throw new Error("Failed to create loan repayment");
      }

      // Update the remaining amount on the loan
      await db
        .update(wholesaleLoans)
        .set({
          remainingAmount: sql`remaining_amount - ${data.amount}`
        })
        .where(eq(wholesaleLoans.id, data.loanId));

      return repayment;
    } catch (error) {
      console.error("Error creating loan repayment:", error);
      throw error;
    }
  }

  async getLoanRepayments(loanId: number): Promise<LoanRepayment[]> {
    try {
      console.log(`Fetching repayments for loan ${loanId}`);
      const repayments = await db
        .select()
        .from(loanRepayments)
        .where(eq(loanRepayments.loanId, loanId))
        .orderBy(desc(loanRepayments.createdAt));
      return repayments;
    } catch (error) {
      console.error(`Error fetching loan repayments for loan ${loanId}:`, error);
      return [];
    }
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    try {
      // Log the incoming order data
      console.log("Creating new order:", {
        userId: orderData.userId,
        total: orderData.total,
        shippingMethod: orderData.shippingMethod,
        paymentMethod: orderData.paymentMethod
      });

      if (!orderData.shippingMethod) {
        throw new Error("Shipping method is required");
      }

      // Ensure proper mapping of fields
      const orderValues = {
        user_id: orderData.userId,
        status: orderData.status || "PENDING",
        total: orderData.total,
        subtotal: orderData.subtotal,
        shipping_method: orderData.shippingMethod,
        shipping_cost: orderData.shippingCost,
        payment_method: orderData.paymentMethod,
        referrer_id: orderData.referrerId,
        referral_code: orderData.referralCode,
        customer_details: orderData.customerDetails,
        created_at: new Date(),
        items: orderData.items
      };

      // Insert the order
      const [order] = await db
        .insert(orders)
        .values(orderValues)
        .returning();

      if (!order) {
        throw new Error("Failed to create order");
      }

      console.log("Order created successfully:", {
        id: order.id,
        status: order.status,
        total: order.total
      });

      // Handle referral stats if needed
      if (orderData.referrerId) {
        await this.updateReferralStats(orderData.referrerId, orderData.total);
      }

      return order;
    } catch (error) {
      console.error("Error creating order:", error);
      throw new Error(`Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async updateReferralStats(referrerId: number, orderTotal: number | string) {
    try {
      // Convert orderTotal to number if it's a string
      const total = typeof orderTotal === 'string' ? parseFloat(orderTotal) : orderTotal;

      await db
        .update(users)
        .set({
          totalReferrals: sql`${users.totalReferrals} + 1`
        })
        .where(eq(users.id, referrerId));

      // Create commission transaction
      await db
        .insert(commissionTransactions)
        .values({
          userId: referrerId,
          amount: (total * 0.05).toFixed(2), // 5% commission
          status: 'PENDING',
          type: 'REFERRAL_EARNINGS'
        });

    } catch (error) {
      console.error("Error updating referral stats:", error);
      // Don't throw error here to prevent order creation from failing
    }
  }
}

export const storage = new DatabaseStorage();
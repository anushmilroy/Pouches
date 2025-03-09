import { sql, eq, desc } from "drizzle-orm";
import { db } from "./db";
import { users as usersTable, orders as ordersTable, commissionTransactions as commissionsTable } from "@shared/schema";
import type { User, InsertUser } from "@shared/schema";
import type { CommissionTransaction } from "@shared/schema";
import type { Order } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { UserRole, WholesaleStatus } from "@shared/schema";

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
      const users = await db
        .select()
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
}

export const storage = new DatabaseStorage();
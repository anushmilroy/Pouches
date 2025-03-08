import { sql, eq, desc } from "drizzle-orm";
import { db } from "./db";
import { users as usersTable, orders as ordersTable, commissionTransactions as commissionsTable } from "@shared/schema";
import type { User } from "@shared/schema";
import type { CommissionTransaction } from "@shared/schema";
import type { Order } from "@shared/schema";

export interface IStorage {
  // ... existing methods ...
  getUserByUsername(username: string): Promise<User | undefined>;
  getUser(id: number): Promise<User | undefined>;

  // Referral management
  getUsersWithReferrals(): Promise<User[]>;
  getReferralsByUserId(userId: number): Promise<Order[]>;
  getCommissionTransactions(userId: number): Promise<CommissionTransaction[]>;
  getAllCommissionTransactions(): Promise<CommissionTransaction[]>;
  getActiveReferrersCount(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      console.log(`Looking up user by username: ${username}`);
      const [user] = await db.select()
        .from(usersTable)
        .where(eq(usersTable.username, username));
      return user;
    } catch (error) {
      console.error("Error getting user by username:", error);
      return undefined;
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      console.log(`Looking up user by ID: ${id}`);
      const [user] = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, id));
      return user;
    } catch (error) {
      console.error("Error getting user by ID:", error);
      return undefined;
    }
  }

  // Referral management implementation
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
}

export const storage = new DatabaseStorage();
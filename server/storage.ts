import { sql, eq, desc } from "drizzle-orm";
import { db } from "./db";
import { users as usersTable, orders as ordersTable, commissionTransactions as commissionsTable } from "@shared/schema";
import type { User, InsertUser } from "@shared/schema";
import type { CommissionTransaction } from "@shared/schema";
import type { Order } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { UserRole } from "@shared/schema";

export class DatabaseStorage implements IStorage {
  // ... other methods ...

  async getWholesaleUsers(): Promise<User[]> {
    try {
      console.log("Fetching wholesale users...");
      const users = await db
        .select({
          id: usersTable.id,
          username: usersTable.username,
          role: usersTable.role,
          wholesaleStatus: usersTable.wholesaleStatus,
          companyName: usersTable.companyName,
          companyAddress: usersTable.companyAddress,
          companyWebsite: usersTable.companyWebsite,
          referralCode: usersTable.referralCode,
          commission: usersTable.commission,
          commissionTier: usersTable.commissionTier,
          totalReferrals: usersTable.totalReferrals,
          createdAt: usersTable.createdAt,
          customPricing: usersTable.customPricing,
          bankDetails: usersTable.bankDetails,
          referrerId: usersTable.referrerId
        })
        .from(usersTable)
        .where(eq(usersTable.role, UserRole.WHOLESALE))
        .orderBy(desc(usersTable.createdAt));

      console.log("Found wholesale users:", users.map(u => ({
        ...u,
        id: u.id,
        username: u.username,
        companyName: u.companyName,
        companyAddress: u.companyAddress,
        companyWebsite: u.companyWebsite,
        referralCode: u.referralCode,
        wholesaleStatus: u.wholesaleStatus,
        createdAt: u.createdAt
      })));

      return users;
    } catch (error) {
      console.error("Error fetching wholesale users:", error);
      throw new Error("Failed to fetch wholesale users");
    }
  }

  // ... rest of the class implementation ...
}

export const storage = new DatabaseStorage();
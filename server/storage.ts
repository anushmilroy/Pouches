import { InsertUser, User, Product, Order, OrderItem, OrderStatus, PouchCategory, PouchFlavor, NicotineStrength, WholesaleStatus, UserRole, InsertCommissionTransaction, CommissionTransaction, InsertCommissionPayout, CommissionPayout, CommissionTier, PayoutStatus, users, products, orders, orderItems, promotions, commissionPayouts, commissionTransactions } from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCommission(id: number, commission: number): Promise<User>;

  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;

  // Order operations
  createOrder(order: Order): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getUserOrders(userId: number): Promise<Order[]>;
  getDistributorOrders(distributorId: number): Promise<Order[]>;
  updateOrderStatus(id: number, status: keyof typeof OrderStatus): Promise<Order>;

  // Order items
  createOrderItem(item: OrderItem): Promise<OrderItem>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;

  // Referral operations
  getUserByReferralCode(code: string): Promise<User | undefined>;
  getUserEarnings(userId: number): Promise<{ total: string; orders: Order[] }>;
  generateReferralCode(userId: number): Promise<string>;

  // Promotion operations
  getPromotions(): Promise<Promotion[]>;
  createPromotion(promotion: Omit<Promotion, "id">): Promise<Promotion>;
  updatePromotion(id: number, data: Partial<Promotion>): Promise<Promotion>;

  // Wholesale management
  getWholesaleUsers(): Promise<User[]>;
  updateWholesaleStatus(id: number, status: keyof typeof WholesaleStatus): Promise<User>;
  updateCustomPricing(id: number, customPricing: Record<string, number>): Promise<User>;
  blockWholesaleUser(id: number): Promise<User>;
  unblockWholesaleUser(id: number): Promise<User>;

  // Commission management
  createCommissionTransaction(transaction: InsertCommissionTransaction): Promise<CommissionTransaction>;
  getUserCommissionTransactions(userId: number): Promise<CommissionTransaction[]>;
  createCommissionPayout(payout: InsertCommissionPayout): Promise<CommissionPayout>;
  getUserCommissionPayouts(userId: number): Promise<CommissionPayout[]>;
  updateUserCommissionTier(userId: number, tier: keyof typeof CommissionTier): Promise<User>;
  calculateUserCommissionRate(userId: number): Promise<number>;
  getPendingCommissionTotal(userId: number): Promise<string>;
  updatePaymentMethod(userId: number, paymentMethod: any): Promise<User>;

  // Distributor management
  getDistributors(): Promise<User[]>;
  createDistributor(distributor: InsertUser): Promise<User>;
  updateDistributorStatus(id: number, active: boolean): Promise<User>;
  assignOrderToDistributor(orderId: number, distributorId: number): Promise<Order>;

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

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    console.log("Creating user:", { ...insertUser, password: '***' });
    const [user] = await db.insert(users).values(insertUser).returning();
    console.log("User created:", { ...user, password: '***' });
    return user;
  }

  async updateUserCommission(id: number, commission: number): Promise<User> {
    const [user] = await db.update(users).set({ commission: commission.toString() }).where(eq(users.id, id)).returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  // Order operations
  async createOrder(order: Order): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.userId, userId));
  }

  async getDistributorOrders(distributorId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.distributorId, distributorId));
  }

  async updateOrderStatus(id: number, status: keyof typeof OrderStatus): Promise<Order> {
    const [updatedOrder] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    if (!updatedOrder) throw new Error("Order not found");
    return updatedOrder;
  }

  // Order items
  async createOrderItem(item: OrderItem): Promise<OrderItem> {
    const [newItem] = await db.insert(orderItems).values(item).returning();
    return newItem;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  // Referral operations
  async getUserByReferralCode(code: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.referralCode, code));
    return user;
  }

  async getUserEarnings(userId: number): Promise<{ total: string; orders: Order[] }> {
    const orders = await db.select().from(orders).where(eq(orders.referrerId, userId));
    const total = orders.reduce((sum, order) => {
      return sum + parseFloat(order.commissionAmount?.toString() || "0");
    }, 0);
    return {
      total: total.toFixed(2),
      orders
    };
  }

  async generateReferralCode(userId: number): Promise<string> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error("User not found");

    if (user.referralCode) {
      return user.referralCode;
    }

    // Generate a unique referral code based on username and random string
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const referralCode = `${user.username.substring(0, 4).toUpperCase()}-${randomStr}`;

    // Update user with new referral code
    await db.update(users).set({ referralCode }).where(eq(users.id, userId));

    return referralCode;
  }

  // Promotion operations
  async getPromotions(): Promise<Promotion[]> {
    return await db.select().from(promotions);
  }

  async createPromotion(promotion: Omit<Promotion, "id">): Promise<Promotion> {
    const [newPromotion] = await db.insert(promotions).values(promotion).returning();
    return newPromotion;
  }

  async updatePromotion(id: number, data: Partial<Promotion>): Promise<Promotion> {
    const [updatedPromotion] = await db.update(promotions).set(data).where(eq(promotions.id, id)).returning();
    if (!updatedPromotion) throw new Error("Promotion not found");
    return updatedPromotion;
  }

  // Wholesale management
  async getWholesaleUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, 'WHOLESALE'));
  }

  async updateWholesaleStatus(id: number, status: keyof typeof WholesaleStatus): Promise<User> {
    const [user] = await db.update(users).set({ wholesaleStatus: status }).where(eq(users.id, id)).returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  async updateCustomPricing(id: number, customPricing: Record<string, number>): Promise<User> {
    const [user] = await db.update(users).set({ customPricing }).where(eq(users.id, id)).returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  async blockWholesaleUser(id: number): Promise<User> {
    const [user] = await db.update(users).set({ wholesaleStatus: "BLOCKED" }).where(eq(users.id, id)).returning();
    if (!user) throw new Error("User not found");
    if (user.role !== "WHOLESALE") throw new Error("User is not a wholesale account");
    return user;
  }

  async unblockWholesaleUser(id: number): Promise<User> {
    const [user] = await db.update(users).set({ wholesaleStatus: "APPROVED" }).where(eq(users.id, id)).returning();
    if (!user) throw new Error("User not found");
    if (user.role !== "WHOLESALE") throw new Error("User is not a wholesale account");
    return user;
  }

  // Commission management
  async createCommissionTransaction(transaction: InsertCommissionTransaction): Promise<CommissionTransaction> {
    const [newTransaction] = await db
      .insert(commissionTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getUserCommissionTransactions(userId: number): Promise<CommissionTransaction[]> {
    return await db
      .select()
      .from(commissionTransactions)
      .where(eq(commissionTransactions.userId, userId));
  }

  async createCommissionPayout(payout: InsertCommissionPayout): Promise<CommissionPayout> {
    const [newPayout] = await db
      .insert(commissionPayouts)
      .values(payout)
      .returning();
    return newPayout;
  }

  async getUserCommissionPayouts(userId: number): Promise<CommissionPayout[]> {
    return await db
      .select()
      .from(commissionPayouts)
      .where(eq(commissionPayouts.userId, userId));
  }

  async updateUserCommissionTier(userId: number, tier: keyof typeof CommissionTier): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ commissionTier: tier })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async calculateUserCommissionRate(userId: number): Promise<number> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    if (!user) throw new Error("User not found");
    return CommissionTier[user.commissionTier || 'STANDARD'].rate;
  }

  async getPendingCommissionTotal(userId: number): Promise<string> {
    const transactions = await db
      .select()
      .from(commissionTransactions)
      .where(
        and(
          eq(commissionTransactions.userId, userId),
          eq(commissionTransactions.status, PayoutStatus.PENDING)
        )
      );

    const pendingTotal = transactions.reduce(
      (sum, t) => sum + parseFloat(t.amount.toString()),
      0
    );
    return pendingTotal.toFixed(2);
  }

  async updatePaymentMethod(userId: number, paymentMethod: any): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ paymentMethod })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Distributor management implementation
  async getDistributors(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, UserRole.DISTRIBUTOR));
  }

  async createDistributor(distributor: InsertUser): Promise<User> {
    const [newDistributor] = await db
      .insert(users)
      .values({ ...distributor, role: UserRole.DISTRIBUTOR })
      .returning();
    return newDistributor;
  }

  async updateDistributorStatus(id: number, active: boolean): Promise<User> {
    const [distributor] = await db
      .update(users)
      .set({ active })
      .where(and(eq(users.id, id), eq(users.role, UserRole.DISTRIBUTOR)))
      .returning();
    return distributor;
  }

  async assignOrderToDistributor(orderId: number, distributorId: number): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({ distributorId })
      .where(eq(orders.id, orderId))
      .returning();
    return order;
  }
}

export const storage = new DatabaseStorage();
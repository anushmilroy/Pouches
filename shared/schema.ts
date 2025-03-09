import { pgTable, text, serial, integer, numeric, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export type UserRole = keyof typeof UserRole;
export type PayoutStatus = keyof typeof PayoutStatus;
export type CommissionType = keyof typeof CommissionType;

export const UserRole = {
  ADMIN: 'ADMIN',
  RETAIL: 'RETAIL',
  WHOLESALE: 'WHOLESALE',
  DISTRIBUTOR: 'DISTRIBUTOR'
} as const;

export const WholesaleStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  BLOCKED: 'BLOCKED'
} as const;

export const PaymentMethod = {
  CRYPTO: 'CRYPTO',
  BANK_TRANSFER: 'BANK_TRANSFER',
  COD: 'COD'
} as const;

export const OrderStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED'
} as const;

export const ShippingMethod = {
  STANDARD: {
    name: 'Standard Shipping',
    price: 10.00,
    description: 'Standard delivery (5-7 business days)'
  },
  EXPRESS: {
    name: 'Express Shipping',
    price: 20.00,
    description: 'Express delivery (2-3 business days)'
  },
  WHOLESALE: {
    name: 'Wholesale Shipping',
    price: 50.00,
    description: 'Wholesale bulk shipping'
  }
} as const;

export const PouchCategory = {
  DRY: 'DRY',
  WET: 'WET'
} as const;

export const PouchFlavor = {
  APPLE_MINT: 'Apple Mint',
  COOL_MINT: 'Cool Mint',
  PEPPERMINT: 'Peppermint',
  COLA: 'Cola',
  SPEARMINT: 'Spearmint',
  WATERMELON: 'Watermelon',
  CHERRY: 'Cherry'
} as const;

export const NicotineStrength = {
  MG_6: '6mg',
  MG_8: '8mg',
  MG_12: '12mg',
  MG_16: '16mg',
  MG_22: '22mg'
} as const;

export const WholesalePricingTier = {
  TIER_1: { min: 100, max: 249, price: 8.00 },
  TIER_2: { min: 250, max: 499, price: 7.50 },
  TIER_3: { min: 500, max: 999, price: 7.00 },
  TIER_4: { min: 1000, max: 4999, price: 6.50 },
  TIER_5: { min: 5000, max: 9999, price: 6.00 },
  TIER_6: { min: 10000, max: 24999, price: 5.50 },
  TIER_7: { min: 25000, max: null, price: 5.00 }
} as const;

export const PayoutStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  PAID: 'PAID',
  FAILED: 'FAILED'
} as const;

export const CommissionTier = {
  STANDARD: { rate: 0.05, minOrders: 0 },
  SILVER: { rate: 0.07, minOrders: 10 },
  GOLD: { rate: 0.10, minOrders: 25 },
  PLATINUM: { rate: 0.12, minOrders: 50 }
} as const;

export const ConsignmentStatus = {
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
} as const;

export const CommissionType = {
  RETAIL_REFERRAL: 'RETAIL_REFERRAL',
  WHOLESALE_REFERRAL: 'WHOLESALE_REFERRAL'
} as const;

export const DistributorCommissionStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID'
} as const;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().$type<UserRole>(),
  wholesaleStatus: text("wholesale_status").$type<keyof typeof WholesaleStatus>(),
  companyName: text("company_name"),
  companyAddress: text("company_address"),
  companyWebsite: text("company_website"),
  bankDetails: jsonb("bank_details"),
  referrerId: integer("referrer_id").references(() => users.id),
  referralCode: text("referral_code").unique(),
  commission: numeric("commission").default("0.00"),
  commissionTier: text("commission_tier").$type<keyof typeof CommissionTier>().default("STANDARD"),
  totalReferrals: integer("total_referrals").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  customPricing: jsonb("custom_pricing").$type<Record<string, number>>()
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().$type<keyof typeof PouchCategory>(),
  flavor: text("flavor").notNull().$type<keyof typeof PouchFlavor>(),
  strength: text("strength").notNull().$type<keyof typeof NicotineStrength>(),
  price: numeric("price").notNull(),
  wholesalePrice: numeric("wholesale_price").notNull(),
  stock: integer("stock").notNull(),
  minRetailOrder: integer("min_retail_order").notNull().default(5),
  minWholesaleOrder: integer("min_wholesale_order").notNull().default(100),
  imagePath: text("image_path"),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  distributorId: integer("distributor_id").references(() => users.id),
  status: text("status").notNull().$type<keyof typeof OrderStatus>(),
  total: numeric("total").notNull(),
  subtotal: numeric("subtotal").notNull(),
  referrerId: integer("referrer_id").references(() => users.id),
  referralCode: text("referral_code"),
  commissionAmount: numeric("commission_amount"),
  commissionType: text("commission_type").$type<keyof typeof CommissionType>(),
  commissionPaid: boolean("commission_paid").default(false),
  paymentMethod: text("payment_method").notNull().$type<keyof typeof PaymentMethod>(),
  paymentDetails: jsonb("payment_details"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description").notNull(),
  discountType: text("discount_type").notNull().$type<'PERCENTAGE' | 'FIXED'>(),
  discountValue: numeric("discount_value").notNull(),
  minOrderAmount: numeric("min_order_amount"),
  maxDiscount: numeric("max_discount"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: numeric("price").notNull()
});

export const commissionPayouts = pgTable("commission_payouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: numeric("amount").notNull(),
  status: text("status").notNull().$type<keyof typeof PayoutStatus>(),
  paymentDetails: jsonb("payment_details"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const commissionTransactions = pgTable("commission_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  orderId: integer("order_id").notNull().references(() => orders.id),
  amount: numeric("amount").notNull(),
  type: text("type").notNull().$type<CommissionType>(),
  status: text("status").notNull().$type<PayoutStatus>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const distributorInventory = pgTable("distributor_inventory", {
  id: serial("id").primaryKey(),
  distributorId: integer("distributor_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const distributorCommissions = pgTable("distributor_commissions", {
  id: serial("id").primaryKey(),
  distributorId: integer("distributor_id").notNull().references(() => users.id),
  orderId: integer("order_id").notNull().references(() => orders.id),
  amount: numeric("amount").notNull(),
  status: text("status").notNull().$type<keyof typeof DistributorCommissionStatus>(),
  createdAt: timestamp("created_at").defaultNow(),
  paidAt: timestamp("paid_at"),
});

export const insertUserSchema = createInsertSchema(users);
export const insertProductSchema = createInsertSchema(products);
export const insertOrderSchema = createInsertSchema(orders);
export const insertOrderItemSchema = createInsertSchema(orderItems);
export const insertPromotionSchema = createInsertSchema(promotions);
export const insertCommissionPayoutSchema = createInsertSchema(commissionPayouts);
export const insertCommissionTransactionSchema = createInsertSchema(commissionTransactions);
export const insertDistributorInventorySchema = createInsertSchema(distributorInventory);
export const insertDistributorCommissionSchema = createInsertSchema(distributorCommissions);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Promotion = typeof promotions.$inferSelect;
export type CommissionPayout = typeof commissionPayouts.$inferSelect;
export type CommissionTransaction = typeof commissionTransactions.$inferSelect;
export type InsertCommissionPayout = z.infer<typeof insertCommissionPayoutSchema>;
export type InsertCommissionTransaction = z.infer<typeof insertCommissionTransactionSchema>;
export type InsertDistributorInventory = z.infer<typeof insertDistributorInventorySchema>;
export type InsertDistributorCommission = z.infer<typeof insertDistributorCommissionSchema>;
export type DistributorInventory = typeof distributorInventory.$inferSelect;
export type DistributorCommission = typeof distributorCommissions.$inferSelect;
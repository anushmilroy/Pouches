import { pgTable, text, serial, integer, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const UserRole = {
  ADMIN: 'ADMIN',
  RETAIL: 'RETAIL',
  WHOLESALE: 'WHOLESALE',
  DISTRIBUTOR: 'DISTRIBUTOR'
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

export const PouchCategory = {
  DRY: 'DRY',
  WET: 'WET'
} as const;

export const PouchFlavor = {
  APPLE_MINT: 'APPLE_MINT',
  COOL_MINT: 'COOL_MINT',
  PEPPERMINT: 'PEPPERMINT',
  COLA: 'COLA',
  SPEARMINT: 'SPEARMINT',
  WATERMELON: 'WATERMELON',
  CHERRY: 'CHERRY'
} as const;

export const NicotineStrength = {
  MG_6: 'MG_6',
  MG_8: 'MG_8',
  MG_12: 'MG_12',
  MG_16: 'MG_16',
  MG_22: 'MG_22'
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

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().$type<keyof typeof UserRole>(),
  referrerId: integer("referrer_id").references(() => users.id),
  commission: numeric("commission"),
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
  paymentMethod: text("payment_method").notNull().$type<keyof typeof PaymentMethod>(),
  paymentDetails: jsonb("payment_details"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: numeric("price").notNull()
});

export const insertUserSchema = createInsertSchema(users);
export const insertProductSchema = createInsertSchema(products);
export const insertOrderSchema = createInsertSchema(orders);
export const insertOrderItemSchema = createInsertSchema(orderItems);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
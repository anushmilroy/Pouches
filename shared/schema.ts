import { pgTable, text, serial, integer, boolean, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const UserRole = {
  ADMIN: 'admin',
  RETAIL: 'retail',
  WHOLESALE: 'wholesale',
  DISTRIBUTOR: 'distributor'
} as const;

export const PaymentMethod = {
  CRYPTO: 'crypto',
  BANK_TRANSFER: 'bank_transfer',
  COD: 'cod'
} as const;

export const OrderStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
} as const;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().$type<keyof typeof UserRole>(),
  referrerId: integer("referrer_id").references(() => users.id),
  commission: numeric("commission").default("0"),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: numeric("price").notNull(),
  wholesalePrice: numeric("wholesale_price").notNull(),
  stock: integer("stock").notNull()
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  referrerId: true
});

export const insertProductSchema = createInsertSchema(products);
export const insertOrderSchema = createInsertSchema(orders);
export const insertOrderItemSchema = createInsertSchema(orderItems);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;

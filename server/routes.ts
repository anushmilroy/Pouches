import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { OrderStatus, PaymentMethod } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Products
  app.get("/api/products", async (_req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  // Orders
  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const order = await storage.createOrder({
      ...req.body,
      userId: req.user.id,
      status: OrderStatus.PENDING
    });
    
    res.status(201).json(order);
  });

  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const orders = await storage.getUserOrders(req.user.id);
    res.json(orders);
  });

  app.get("/api/orders/distributor", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'distributor') {
      return res.sendStatus(401);
    }
    
    const orders = await storage.getDistributorOrders(req.user.id);
    res.json(orders);
  });

  // Commission management
  app.patch("/api/users/:id/commission", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.sendStatus(401);
    }

    const { commission } = req.body;
    const user = await storage.updateUserCommission(parseInt(req.params.id), commission);
    res.json(user);
  });

  // Order status updates
  app.patch("/api/orders/:id/status", async (req, res) => {
    if (!req.isAuthenticated() || !['admin', 'distributor'].includes(req.user.role)) {
      return res.sendStatus(401);
    }

    const { status } = req.body;
    const order = await storage.updateOrderStatus(parseInt(req.params.id), status);
    res.json(order);
  });

  const httpServer = createServer(app);
  return httpServer;
}

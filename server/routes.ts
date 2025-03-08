import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { OrderStatus, UserRole, PaymentMethod } from "@shared/schema";
import path from "path";
import express from "express";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Serve static files from attached_assets
  app.use('/attached_assets', express.static(path.join(process.cwd(), 'attached_assets')));

  // Products
  app.get("/api/products", async (_req, res) => {
    console.log("GET /api/products request received");
    const products = await storage.getProducts();
    console.log("Sending products:", products);
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
    if (!req.isAuthenticated() || req.user.role !== UserRole.DISTRIBUTOR) {
      return res.sendStatus(401);
    }

    const orders = await storage.getDistributorOrders(req.user.id);
    res.json(orders);
  });

  // Commission management
  app.patch("/api/users/:id/commission", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.ADMIN) {
      return res.sendStatus(401);
    }

    const { commission } = req.body;
    const user = await storage.updateUserCommission(parseInt(req.params.id), commission);
    res.json(user);
  });

  // Order status updates
  app.patch("/api/orders/:id/status", async (req, res) => {
    if (!req.isAuthenticated() || ![UserRole.ADMIN, UserRole.DISTRIBUTOR].includes(req.user.role)) {
      return res.sendStatus(401);
    }

    const { status } = req.body;
    const order = await storage.updateOrderStatus(parseInt(req.params.id), status);
    res.json(order);
  });

  const httpServer = createServer(app);
  return httpServer;
}
import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import { OrderStatus, UserRole, PaymentMethod, ProductAllocation, products, users, orders as ordersTable, ShippingMethod } from "@shared/schema";
import path from "path";
import express from "express";
import Stripe from "stripe";
import { PayoutStatus } from "@shared/schema";
import fs from 'fs';
import { ReferralGuideService } from "./services/referral-guide";
import { db, eq, or, desc } from "./db";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  setupAuth(app);

  // Add wholesale products endpoint
  app.get("/api/products/wholesale", async (_req, res) => {
    try {
      console.log("Fetching wholesale products...");
      // Fetch all products to allow wholesalers access to all variations
      const wholesaleProducts = await db
        .select()
        .from(products);
      console.log(`Found ${wholesaleProducts.length} wholesale products`);
      res.json(wholesaleProducts);
    } catch (error) {
      console.error("Error fetching wholesale products:", error);
      res.status(500).json({ error: "Failed to fetch wholesale products" });
    }
  });

  // Update existing products endpoint
  app.get("/api/products", async (req, res) => {
    try {
      console.log("Fetching products with filters:", req.query);
      let query = db.select().from(products);

      // Filter by allocation if specified
      if (req.query.allocation) {
        query = query.where(eq(products.allocation, req.query.allocation as string));
      }

      const allProducts = await query;
      console.log(`Found ${allProducts.length} products`);
      res.json(allProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Serve static files from attached_assets
  app.use('/attached_assets', (req, res, next) => {
    console.log('Static file request:', {
      url: req.url,
      path: path.join(process.cwd(), 'attached_assets', req.url),
      method: req.method
    });

    // Check if file exists before serving
    const filePath = path.join(process.cwd(), 'attached_assets', req.url);
    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      return res.status(404).send('File not found');
    }

    express.static(path.join(process.cwd(), 'attached_assets'))(req, res, next);
  });

  // Payment Intent
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        console.error('Invalid amount received:', amount);
        return res.status(400).json({ error: 'Invalid amount' });
      }

      console.log('Creating payment intent for amount:', amount);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        payment_method_types: ['card'],
        metadata: {
          integration_check: 'accept_a_payment',
        },
      });

      console.log('Payment intent created successfully:', paymentIntent.id);
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({
        error: 'Failed to create payment intent',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Order creation endpoint
  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = req.body;
      console.log("Creating new order with data:", {
        userId: req.user?.id || 'guest',
        userRole: req.user?.role || 'guest',
        orderTotal: orderData.total,
        paymentMethod: orderData.paymentMethod,
        shippingMethod: orderData.shippingMethod,
        timestamp: new Date().toISOString()
      });

      // Validate required fields
      if (!orderData.total || !orderData.subtotal || !orderData.paymentMethod || !orderData.shippingMethod || !orderData.shippingCost) {
        console.error("Missing required fields in order data:", {
          hasTotal: !!orderData.total,
          hasSubtotal: !!orderData.subtotal,
          hasPaymentMethod: !!orderData.paymentMethod,
          hasShippingMethod: !!orderData.shippingMethod,
          hasShippingCost: !!orderData.shippingCost
        });
        return res.status(400).json({ error: "Missing required order fields" });
      }

      // Create the order with the correct schema fields
      const [newOrder] = await db
        .insert(ordersTable)
        .values({
          userId: req.user?.id || null,
          status: OrderStatus.PENDING,
          total: parseFloat(orderData.total),
          subtotal: parseFloat(orderData.subtotal),
          paymentMethod: orderData.paymentMethod,
          shippingMethod: orderData.shippingMethod,
          shippingCost: parseFloat(orderData.shippingCost),
          paymentDetails: orderData.paymentDetails || {},
          createdAt: new Date(),
        })
        .returning();

      console.log("Order created successfully:", {
        orderId: newOrder.id,
        status: newOrder.status,
        userId: newOrder.userId,
        total: newOrder.total
      });

      res.status(201).json(newOrder);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });


  // Update wholesale orders endpoint
  app.get("/api/orders/wholesale", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.WHOLESALE) {
      console.log("Unauthorized attempt to fetch wholesale orders:", {
        isAuthenticated: req.isAuthenticated(),
        userRole: req.user?.role
      });
      return res.sendStatus(401);
    }

    try {
      console.log(`Fetching orders for wholesaler ${req.user.id}...`);
      const userOrders = await db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.userId, req.user.id))
        .orderBy(desc(ordersTable.createdAt));

      console.log("Wholesale orders fetch result:", {
        userId: req.user.id,
        orderCount: userOrders.length,
        orderIds: userOrders.map(o => o.id)
      });
      res.json(userOrders);
    } catch (error) {
      console.error("Error fetching wholesale orders:", error);
      res.status(500).json({ error: "Failed to fetch wholesale orders" });
    }
  });

  //removed old order get route


  // Update getDistributorOrders endpoint with better error handling
  app.get("/api/orders/distributor", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.DISTRIBUTOR) {
      return res.sendStatus(401);
    }

    try {
      console.log(`Fetching orders for distributor ${req.user.id}...`);
      const orders = await storage.getDistributorOrders(req.user.id);
      console.log(`Found ${orders.length} orders for distributor ${req.user.id}`);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching distributor orders:", error);
      res.status(500).json({ error: "Failed to fetch distributor orders" });
    }
  });

  // Add new distributor stats endpoint
  app.get("/api/distributor/stats", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.DISTRIBUTOR) {
      return res.sendStatus(401);
    }

    try {
      console.log(`Fetching stats for distributor ${req.user.id}`);
      const orders = await storage.getDistributorOrders(req.user.id);
      const commissions = await storage.getDistributorCommissions(req.user.id);

      const total = commissions
        .filter(c => c.status === 'PAID')
        .reduce((sum, c) => sum + parseFloat(c.amount.toString()), 0);

      const thisMonth = commissions
        .filter(c => {
          const date = new Date(c.createdAt);
          const now = new Date();
          return date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear() &&
            c.status === 'PAID';
        })
        .reduce((sum, c) => sum + parseFloat(c.amount.toString()), 0);

      const pendingDeliveries = orders.filter(
        o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED
      ).length;

      res.json({
        total: total.toFixed(2),
        thisMonth: thisMonth.toFixed(2),
        pendingDeliveries
      });
    } catch (error) {
      console.error("Error fetching distributor stats:", error);
      res.status(500).json({ error: "Failed to fetch distributor statistics" });
    }
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

  // Add route to get user's commission earnings (from edited snippet)
  app.get("/api/users/earnings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const earnings = await storage.getUserEarnings(req.user.id);
      res.json(earnings);
    } catch (error) {
      console.error("Error fetching earnings:", error);
      res.status(500).json({ error: "Failed to fetch earnings" });
    }
  });

  // Add route to generate referral code for user (from edited snippet)
  app.post("/api/generate-referral-code", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      // Generate a random alphanumeric code
      const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Update the user's referral code in the database
      await db
        .update(users)
        .set({ referralCode })
        .where(eq(users.id, req.user.id));

      // Return the new referral code
      res.json({ referralCode });
    } catch (error) {
      console.error("Error generating referral code:", error);
      res.status(500).json({ error: "Failed to generate referral code" });
    }
  });

  // Add new route for updating bank details (from edited snippet)
  app.patch("/api/users/:id/bank-details", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const user = await storage.updateUser(parseInt(req.params.id), {
        bankDetails: req.body.bankDetails,
      });
      res.json(user);
    } catch (error) {
      console.error("Error updating bank details:", error);
      res.status(500).json({ error: "Failed to update bank details" });
    }
  });

  // Promotions Management
  app.get("/api/promotions", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.ADMIN) {
      return res.sendStatus(401);
    }

    try {
      const promotions = await storage.getPromotions();
      res.json(promotions);
    } catch (error) {
      console.error("Error fetching promotions:", error);
      res.status(500).json({ error: "Failed to fetch promotions" });
    }
  });

  app.post("/api/promotions", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.ADMIN) {
      return res.sendStatus(401);
    }

    try {
      const promotion = await storage.createPromotion({
        ...req.body,
        createdBy: req.user.id
      });
      res.status(201).json(promotion);
    } catch (error) {
      console.error("Error creating promotion:", error);
      res.status(500).json({ error: "Failed to create promotion" });
    }
  });

  app.patch("/api/promotions/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.ADMIN) {
      return res.sendStatus(401);
    }

    try {
      const promotion = await storage.updatePromotion(parseInt(req.params.id), req.body);
      res.json(promotion);
    } catch (error) {
      console.error("Error updating promotion:", error);
      res.status(500).json({ error: "Failed to update promotion" });
    }
  });

  // Wholesale Account Management
  app.get("/api/users/wholesale", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.ADMIN) {
      return res.sendStatus(401);
    }

    try {
      console.log("Admin requesting wholesale users");
      const users = await storage.getWholesaleUsers();

      // Add detailed logging of each wholesale user
      users.forEach(user => {
        console.log("Wholesale user details:", {
          id: user.id,
          username: user.username,
          password: '***',
          companyName: user.companyName,
          companyAddress: user.companyAddress,
          companyWebsite: user.companyWebsite,
          referralCode: user.referralCode,
          wholesaleStatus: user.wholesaleStatus,
          createdAt: user.createdAt
        });
      });

      // Send complete user objects to frontend
      res.json(users);
    } catch (error) {
      console.error("Error fetching wholesale users:", error);
      res.status(500).json({ error: "Failed to fetch wholesale users" });
    }
  });

  app.patch("/api/users/:id/wholesale-status", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.ADMIN) {
      return res.sendStatus(401);
    }

    try {
      console.log(`Admin updating wholesale status for user ${req.params.id} to ${req.body.status}`);
      const user = await storage.updateWholesaleStatus(parseInt(req.params.id), req.body.status);

      // Log the updated user details
      console.log("Updated wholesale user:", {
        id: user.id,
        username: user.username,
        companyName: user.companyName,
        companyAddress: user.companyAddress,
        companyWebsite: user.companyWebsite,
        wholesaleStatus: user.wholesaleStatus,
        createdAt: user.createdAt
      });

      res.json(user);
    } catch (error) {
      console.error("Error updating wholesale status:", error);
      res.status(500).json({ error: "Failed to update wholesale status" });
    }
  });

  // Add the custom pricing update endpoint
  app.patch("/api/users/:id/pricing", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.ADMIN) {
      return res.sendStatus(401);
    }

    try {
      const user = await storage.updateCustomPricing(parseInt(req.params.id), req.body.customPricing);
      res.json(user);
    } catch (error) {
      console.error("Error updating custom pricing:", error);
      res.status(500).json({ error: "Failed to update custom pricing" });
    }
  });

  // Block wholesale user
  app.post("/api/users/:id/block", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.ADMIN) {
      return res.sendStatus(401);
    }

    try {
      const user = await storage.blockWholesaleUser(parseInt(req.params.id));
      res.json(user);
    } catch (error) {
      console.error("Error blocking wholesale user:", error);
      res.status(500).json({ error: "Failed to block wholesale user" });
    }
  });

  // Unblock wholesale user
  app.post("/api/users/:id/unblock", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.ADMIN) {
      return res.sendStatus(401);
    }

    try {
      const user = await storage.unblockWholesaleUser(parseInt(req.params.id));
      res.json(user);
    } catch (error) {
      console.error("Error unblocking wholesale user:", error);
      res.status(500).json({ error: "Failed to unblock wholesale user" });
    }
  });

  // Commission Management Routes
  app.get("/api/commission/transactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const transactions = await storage.getUserCommissionTransactions(req.user.id);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching commission transactions:", error);
      res.status(500).json({ error: "Failed to fetch commission transactions" });
    }
  });

  app.get("/api/commission/payouts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const payouts = await storage.getUserCommissionPayouts(req.user.id);
      res.json(payouts);
    } catch (error) {
      console.error("Error fetching commission payouts:", error);
      res.status(500).json({ error: "Failed to fetch commission payouts" });
    }
  });

  app.get("/api/commission/pending-total", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const total = await storage.getPendingCommissionTotal(req.user.id);
      res.json({ total });
    } catch (error) {
      console.error("Error fetching pending commission total:", error);
      res.status(500).json({ error: "Failed to fetch pending commission total" });
    }
  });

  app.post("/api/commission/payment-method", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const user = await storage.updatePaymentMethod(req.user.id, req.body.paymentMethod);
      res.json(user);
    } catch (error) {
      console.error("Error updating payment method:", error);
      res.status(500).json({ error: "Failed to update payment method" });
    }
  });

  // Admin Commission Management Routes
  app.patch("/api/users/:id/commission-tier", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.ADMIN) {
      return res.sendStatus(401);
    }

    try {
      const user = await storage.updateUserCommissionTier(
        parseInt(req.params.id),
        req.body.tier
      );
      res.json(user);
    } catch (error) {
      console.error("Error updating commission tier:", error);
      res.status(500).json({ error: "Failed to update commission tier" });
    }
  });

  app.post("/api/commission/process-payout", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.ADMIN) {
      return res.sendStatus(401);
    }

    try {
      const { userId, amount } = req.body;
      const payout = await storage.createCommissionPayout({
        userId,
        amount,
        status: PayoutStatus.PROCESSING,
        paymentDetails: req.body.paymentDetails,
        processedAt: new Date().toISOString(),
      });
      res.json(payout);
    } catch (error) {
      console.error("Error processing commission payout:", error);
      res.status(500).json({ error: "Failed to process commission payout" });
    }
  });

  // Distributor Management Routes from edited snippet
  app.get("/api/orders/unassigned", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.ADMIN) {
      return res.sendStatus(401);
    }

    try {
      const orders = await storage.getUnassignedOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching unassigned orders:", error);
      res.status(500).json({ error: "Failed to fetch unassigned orders" });
    }
  });

  app.get("/api/users/distributors", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.ADMIN) {
      return res.sendStatus(401);
    }

    try {
      const distributors = await storage.getDistributors();
      res.json(distributors);
    } catch (error) {
      console.error("Error fetching distributors:", error);
      res.status(500).json({ error: "Failed to fetch distributors" });
    }
  });

  app.post("/api/users/distributor", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.ADMIN) {
      return res.sendStatus(401);
    }

    try {
      // Hash the password before creating the distributor
      const hashedPassword = await hashPassword(req.body.password);

      const distributor = await storage.createDistributor({
        ...req.body,
        password: hashedPassword,
        role: UserRole.DISTRIBUTOR
      });

      // Remove password from response
      const { password, ...distributorWithoutPassword } = distributor;
      res.status(201).json(distributorWithoutPassword);
    } catch (error) {
      console.error("Error creating distributor:", error);
      res.status(500).json({ error: "Failed to create distributor" });
    }
  });

  app.patch("/api/users/distributor/:id/status", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.ADMIN) {
      return res.sendStatus(401);
    }

    try {
      const distributor = await storage.updateDistributorStatus(
        parseInt(req.params.id),
        req.body.active
      );
      res.json(distributor);
    } catch (error) {
      console.error("Error updating distributor status:", error);
      res.status(500).json({ error: "Failed to update distributor status" });
    }
  });

  // Distributor Inventory Management
  app.post("/api/distributors/:id/inventory", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.ADMIN) {
      return res.sendStatus(401);
    }

    try {
      const inventory = await storage.updateDistributorInventory({
        distributorId: parseInt(req.params.id),
        productId: req.body.productId,
        quantity: req.body.quantity
      });
      res.json(inventory);
    } catch (error) {
      console.error("Error updating distributor inventory:", error);
      res.status(500).json({ error: "Failed to update distributor inventory" });
    }
  });

  // Update inventory endpoint with better error handling
  app.get("/api/distributors/inventory", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.DISTRIBUTOR) {
      return res.sendStatus(401);
    }

    try {
      console.log(`Fetching inventory for distributor ${req.user.id}...`);
      const inventory = await storage.getDistributorInventory(req.user.id);
      console.log(`Found ${inventory.length} inventory items`);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching distributor inventory:", error);
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  // Order Assignment
  app.post("/api/orders/:id/assign", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.ADMIN) {
      return res.sendStatus(401);
    }

    try {
      const order = await storage.allocateOrderToDistributor(
        parseInt(req.params.id),
        req.body.distributorId
      );
      res.json(order);
    } catch (error) {
      console.error("Error assigning order:", error);
      res.status(500).json({ error: "Failed to assign order" });
    }
  });

  // Distributor Commission Routes
  app.get("/api/distributors/:id/commissions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    // Allow both admin and the distributor themselves to access their commissions
    if (req.user.role !== UserRole.ADMIN && req.user.id !== parseInt(req.params.id)) {
      return res.sendStatus(403);
    }

    try {
      const commissions = await storage.getDistributorCommissions(parseInt(req.params.id));
      res.json(commissions);
    } catch (error) {
      console.error("Error fetching distributor commissions:", error);
      res.status(500).json({ error: "Failed to fetch distributor commissions" });
    }
  });

  // Update commissions endpoint with better error handling
  app.get("/api/distributors/commissions", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.DISTRIBUTOR) {
      return res.sendStatus(401);
    }

    try {
      console.log(`Fetching commissions for distributor ${req.user.id}...`);
      const commissions = await storage.getDistributorCommissions(req.user.id);
      console.log(`Found ${commissions.length} commission records`);
      res.json(commissions);
    } catch (error) {
      console.error("Error fetching distributor commissions:", error);
      res.status(500).json({ error: "Failed to fetch commissions" });
    }
  });

  app.get("/api/admin/distributor-commissions", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.ADMIN) {
      return res.sendStatus(401);
    }

    try {
      const commissions = await storage.getAllDistributorCommissions();
      res.json(commissions);
    } catch (error) {
      console.error("Error fetching all distributor commissions:", error);
      res.status(500).json({ error: "Failed to fetch distributor commissions" });
    }
  });

  app.get("/api/referral-guide", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const guide = await ReferralGuideService.generatePersonalizedGuide(req.user.id);
      res.json(guide);
    } catch (error) {
      console.error("Error generating referral guide:", error);
      res.status(500).json({ error: "Failed to generate referral guide" });
    }
  });

  // Add these new routes after the distributor routes section

  // Distributor Onboarding Routes
  app.post("/api/distributor/onboarding/progress", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.DISTRIBUTOR) {
      return res.sendStatus(401);
    }

    try {
      const { step } = req.body;
      if (typeof step !== 'number' || step < 0) {
        return res.status(400).json({ error: "Invalid step parameter" });
      }

      console.log(`Updating onboarding progress for distributor ${req.user.id} to step ${step}`);
      await storage.updateUser(req.user.id, {
        onboardingStep: step,
        onboardingStatus: 'IN_PROGRESS'
      });

      res.sendStatus(200);
    } catch (error) {
      console.error("Error updating onboarding progress:", error);
      res.status(500).json({ error: "Failed to update onboarding progress" });
    }
  });

  app.post("/api/distributor/onboarding/complete", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.DISTRIBUTOR) {
      return res.sendStatus(401);
    }

    try {
      console.log(`Completing onboarding for distributor ${req.user.id}`);
      await storage.updateUser(req.user.id, {
        onboardingStatus: 'COMPLETED',
        onboardingCompletedAt: new Date()
      });
      res.sendStatus(200);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ error: "Failed to complete onboarding" });
    }
  });

  app.get("/api/admin/referral-stats", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.ADMIN) {
      return res.sendStatus(401);
    }

    try {
      const users = await storage.getUsersWithReferrals();
      console.log('Found users with referrals:', users.length);

      const stats = await Promise.all(users.map(async (user) => {
        try {
          const referralStats = await storage.getReferralsByUserId(user.id);
          console.log(`Found ${referralStats.length} referrals for user ${user.id}`);

          const earnings = await storage.getCommissionTransactions(user.id);
          console.log(`Found ${earnings.length} commission transactions for user ${user.id}`);

          const totalEarnings = earnings
            .filter(e => e.status === 'PAID')
            .reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);

          const pendingEarnings = earnings
            .filter(e => e.status === 'PENDING')
            .reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);

          const lastReferral = referralStats[0]?.createdAt || null;

          return {
            userId: user.id,
            username: user.username,
            role: user.role,
            totalReferrals: user.totalReferrals || 0,
            totalEarnings,
            pendingEarnings,
            lastReferralDate: lastReferral
          };
        } catch (error) {          console.error(`Error processing stats for user ${user.id}:`, error);
          return null;
        }
      }));

      // Filter out any failed stats
      const validStats = stats.filter(stat => stat !== null);
      console.log('Successfully processed stats for', validStats.length, 'users');

      res.json(validStats);
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      res.status(500).json({ error: "Failed to fetch referral statistics" });
    }
  });

  app.get("/api/admin/referral-summary", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.ADMIN) {
      return res.sendStatus(401);
    }try {
      const allTransactions = await storage.getAllCommissionTransactions();
      console.log('Found total commission transactions:', allTransactions.length);

      const totalCommissionPaid = allTransactions
        .filter(t => t.status === 'PAID')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

      const totalCommissionPending = allTransactions
        .filter(t => t.status === 'PENDING')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

      const activeReferrers = await storage.getActiveReferrersCount();
      console.log('Active referrers count:', activeReferrers);

      res.json({
        totalCommissionPaid,
        totalCommissionPending,
        activeReferrers
      });
    } catch (error) {
      console.error("Error fetching referral summary:", error);
      res.status(500).json({ error: "Failed to fetch referral summary" });
    }
  });

  // Add new wholesale loan routes
  app.post("/api/wholesale/loans", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.WHOLESALE) {
      return res.sendStatus(401);
    }

    try {
      const loan = await storage.createWholesaleLoan({
        ...req.body,
        wholesalerId: req.user.id,
        status: "PENDING", // Assuming LoanStatus.PENDING is a string "PENDING"        remainingAmount: req.body.amount
      });
      res.status(201).json(loan);
    } catch (error) {
      console.error("Error creating wholesale loan:", error);
      res.status(500).json({ error: "Failed to create wholesale loan" });
    }
  });

  // Fix the bug in the loan route
  app.get("/api/wholesale/loans", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.WHOLESALE) {
      return res.sendStatus(401);
    }

    try {
      const loans = await storage.getWholesaleLoansForUser(req.user.id);
      res.json(loans);
    } catch (error) {
      console.error("Error fetching wholesale loans:", error);
      res.status(500).json({ error: "Failed to fetch wholesale loans" });
    }
  });

  app.post("/api/wholesale/loans/:id/repayments", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.WHOLESALE) {
      return res.sendStatus(401);
    }

    try {
      const loan = await storage.getWholesaleLoanById(parseInt(req.params.id));
      if (!loan || loan.wholesalerId !== req.user.id) {
        return res.status(404).json({ error: "Loan not found" });
      }

      const repayment = await storage.createLoanRepayment({
        ...req.body,
        loanId: loan.id
      });
      res.status(201).json(repayment);
    } catch (error) {
      console.error("Error creating loan repayment:", error);
      res.status(500).json({ error: "Failed to create loan repayment" });
    }
  });

  // Admin routes for loan management
  app.get("/api/admin/wholesale/loans", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.ADMIN) {
      return res.sendStatus(401);
    }

    try {
      const loans = await storage.getAllWholesaleLoans();
      res.json(loans);
    } catch (error) {
      console.error("Error fetching all wholesale loans:", error);
      res.status(500).json({ error: "Failed to fetch wholesale loans" });
    }
  });

  app.patch("/api/admin/wholesale/loans/:id/status", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.ADMIN) {
      return res.sendStatus(401);
    }

    try {
      const loan = await storage.updateWholesaleLoanStatus(
        parseInt(req.params.id),
        req.body.status
      );
      res.json(loan);
    } catch (error) {
      console.error("Error updating wholesale loan status:", error);
      res.status(500).json({ error: "Failed to update loan status" });
    }
  });

  app.get("/api/wholesale/loans/:id/repayments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const loan = await storage.getWholesaleLoanById(parseInt(req.params.id));
      if (!loan || (req.user.role !== UserRole.ADMIN && loan.wholesalerId !== req.user.id)) {
        return res.status(404).json({ error: "Loan not found" });
      }

      const repayments = await storage.getLoanRepayments(loan.id);
      res.json(repayments);
    } catch (error) {
      console.error("Error fetching loan repayments:", error);
      res.status(500).json({ error: "Failed to fetch loan repayments" });
    }
  });

  // Add the profile update endpoint after other user-related routes
  app.patch("/api/users/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      console.log("Updating user profile:", req.user.id, req.body);

      // Update user in database
      await db
        .update(users)
        .set({
          companyName: req.body.companyName,
          companyWebsite: req.body.companyWebsite,
          contactPhone: req.body.contactPhone,
          contactEmail: req.body.contactEmail,
          businessType: req.body.businessType,
          taxId: req.body.taxId,
          shippingAddress: req.body.shippingAddress,
          billingAddress: req.body.billingAddress,
        })
        .where(eq(users.id, req.user.id));

      // Fetch updated user data
      const [updatedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user.id));

      console.log("Profile updated successfully for user:", updatedUser.id);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
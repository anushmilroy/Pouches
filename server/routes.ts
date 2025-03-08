import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { OrderStatus, UserRole, PaymentMethod } from "@shared/schema";
import path from "path";
import express from "express";
import Stripe from "stripe";
import { PayoutStatus } from "@shared/schema"; // Import PayoutStatus
import fs from 'fs'; //Import fs module
import { ReferralGuideService } from "./services/referral-guide";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
});

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

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

  // Orders
  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = req.body;
      let referrerId = null;

      // If a referral code is provided, look up the referrer
      if (orderData.referralCode) {
        const referrer = await storage.getUserByReferralCode(orderData.referralCode);
        if (referrer) {
          referrerId = referrer.id;
          // Calculate 5% commission
          const commissionAmount = parseFloat(orderData.subtotal) * 0.05;
          orderData.referrerId = referrerId;
          orderData.commissionAmount = commissionAmount.toFixed(2);
        }
      }

      const order = await storage.createOrder({
        ...orderData,
        userId: req.user?.id || null,
        status: OrderStatus.PENDING
      });

      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // Get all products
  app.get("/api/products", async (_req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
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
  app.post("/api/users/referral-code", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const referralCode = await storage.generateReferralCode(req.user.id);
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
      console.log("Found wholesale users:", users.map(u => ({ ...u, password: '***' })));
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
      const user = await storage.updateWholesaleStatus(parseInt(req.params.id), req.body.status);
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

  // Distributor Management Routes
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
      const distributor = await storage.createDistributor(req.body);
      res.status(201).json(distributor);
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

  app.post("/api/orders/:id/assign", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.ADMIN) {
      return res.sendStatus(401);
    }

    try {
      const order = await storage.assignOrderToDistributor(
        parseInt(req.params.id),
        req.body.distributorId
      );
      res.json(order);
    } catch (error) {
      console.error("Error assigning order:", error);
      res.status(500).json({ error: "Failed to assign order" });
    }
  });

  // Add consignment management routes
  app.get("/api/orders/consignment", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.ADMIN) {
      return res.sendStatus(401);
    }

    try {
      const orders = await storage.getConsignmentOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching consignment orders:", error);
      res.status(500).json({ error: "Failed to fetch consignment orders" });
    }
  });

  app.post("/api/orders/consignment", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.WHOLESALE) {
      return res.sendStatus(401);
    }

    try {
      const order = await storage.createConsignmentOrder({
        ...req.body,
        userId: req.user.id,
        status: OrderStatus.PENDING,
      });
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating consignment order:", error);
      res.status(500).json({ error: "Failed to create consignment order" });
    }
  });

  app.patch("/api/orders/:id/consignment-status", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== UserRole.ADMIN) {
      return res.sendStatus(401);
    }

    try {
      const order = await storage.updateConsignmentStatus(
        parseInt(req.params.id),
        req.body.status,
        req.user.id // Admin who approved/rejected
      );
      res.json(order);
    } catch (error) {
      console.error("Error updating consignment status:", error);
      res.status(500).json({ error: "Failed to update consignment status" });
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

  // Add these new routes for admin referral management
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
        } catch (error) {
          console.error(`Error processing stats for user ${user.id}:`, error);
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
    }

    try {
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

  const httpServer = createServer(app);
  return httpServer;
}
import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { OrderStatus, UserRole, PaymentMethod } from "@shared/schema";
import path from "path";
import express from "express";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
});

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Serve static files from attached_assets
  app.use('/attached_assets', express.static(path.join(process.cwd(), 'attached_assets')));

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

  // Add route to get user's commission earnings
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

  // Add route to generate referral code for user
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

  const httpServer = createServer(app);
  return httpServer;
}
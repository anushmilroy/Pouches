import { storage } from "../storage";
import { CommissionType, UserRole } from "@shared/schema";
import { randomBytes } from "crypto";

export class ReferralService {
  static async generateReferralCode(userId: number): Promise<string> {
    const code = randomBytes(4).toString('hex').toUpperCase();
    await storage.updateUser(userId, { referralCode: code });
    return code;
  }

  static async processReferral(orderId: number, referralCode: string): Promise<void> {
    const order = await storage.getOrder(orderId);
    const referrer = await storage.getUserByReferralCode(referralCode);
    
    if (!order || !referrer) return;

    // Calculate 5% commission
    const commissionAmount = parseFloat((order.total * 0.05).toFixed(2));
    
    // Update order with referral information
    await storage.updateOrder(orderId, {
      referrerId: referrer.id,
      referralCode,
      commissionAmount,
      commissionType: order.isWholesale ? CommissionType.WHOLESALE_REFERRAL : CommissionType.RETAIL_REFERRAL
    });

    // Create commission transaction
    await storage.createCommissionTransaction({
      userId: referrer.id,
      orderId: order.id,
      amount: commissionAmount,
      type: order.isWholesale ? CommissionType.WHOLESALE_REFERRAL : CommissionType.RETAIL_REFERRAL,
      status: 'PENDING'
    });

    // Update referrer's total commission
    const currentCommission = referrer.commission || 0;
    await storage.updateUser(referrer.id, {
      commission: currentCommission + commissionAmount,
      totalReferrals: (referrer.totalReferrals || 0) + 1
    });
  }

  static async validateReferralCode(code: string): Promise<boolean> {
    const referrer = await storage.getUserByReferralCode(code);
    return !!referrer;
  }

  static async getReferralStats(userId: number) {
    const user = await storage.getUser(userId);
    const referrals = await storage.getReferralsByUserId(userId);
    const earnings = await storage.getCommissionTransactions(userId);
    
    return {
      totalReferrals: user?.totalReferrals || 0,
      totalEarnings: user?.commission || 0,
      referrals,
      earnings
    };
  }
}

import WholesaleLayout from "@/components/layout/wholesale-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, TrendingUp, Users, Gift, Wallet } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function WholesaleEarnings() {
  const { user } = useAuth();

  // Mock data for now - to be replaced with actual API endpoints
  const earningsData = {
    totalEarnings: 15000,
    monthlyEarnings: 2500,
    totalReferrals: 12,
    activeReferrals: 8,
    commissionRate: 5, // percentage
    nextTierThreshold: 20000,
  };

  return (
    <WholesaleLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${earningsData.totalEarnings.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Lifetime earnings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Earnings</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${earningsData.monthlyEarnings.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {earningsData.totalReferrals}
                </div>
                <p className="text-xs text-muted-foreground">
                  {earningsData.activeReferrals} active referrals
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commission Rate</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {earningsData.commissionRate}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Current commission tier
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Commission Tiers */}
          <Card>
            <CardHeader>
              <CardTitle>Commission Tiers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium">Current Tier</p>
                    <p className="text-sm text-muted-foreground">
                      ${earningsData.totalEarnings.toFixed(2)} / ${earningsData.nextTierThreshold.toFixed(2)}
                    </p>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(earningsData.totalEarnings / earningsData.nextTierThreshold) * 100}%` }}
                    />
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Commission Tiers:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm">Tier 1: 5%</p>
                      <p className="text-xs text-muted-foreground">Up to $20,000</p>
                    </div>
                    <div>
                      <p className="text-sm">Tier 2: 7%</p>
                      <p className="text-xs text-muted-foreground">$20,000 - $50,000</p>
                    </div>
                    <div>
                      <p className="text-sm">Tier 3: 10%</p>
                      <p className="text-xs text-muted-foreground">$50,000 - $100,000</p>
                    </div>
                    <div>
                      <p className="text-sm">Tier 4: 12%</p>
                      <p className="text-xs text-muted-foreground">$100,000+</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Referral Links */}
          <Card>
            <CardHeader>
              <CardTitle>Your Referral Link</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-mono break-all">
                    {`https://pouchesworldwide.com/ref/${user?.referralCode || ''}`}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Share this link with other businesses to earn commissions on their orders.
                  You'll earn a percentage of their order value based on your current commission tier.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </WholesaleLayout>
  );
}

import { useState } from "react";
import WholesaleLayout from "@/components/layout/wholesale-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Users, Gift, Wallet, Copy, ExternalLink, RefreshCw, BrainCircuit } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function WholesaleEarnings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock data for now - to be replaced with actual API endpoints
  const earningsData = {
    totalEarnings: 15000,
    monthlyEarnings: 2500,
    totalReferrals: 12,
    activeReferrals: 8,
    commissionRate: 5, // percentage
    nextTierThreshold: 20000,
  };

  const generateReferralCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/generate-referral-code");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], (oldData: any) => ({
        ...oldData,
        referralCode: data.referralCode,
      }));
      toast({
        title: "Referral Code Generated",
        description: "Your new referral code has been generated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate referral code. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateReferralCode = async () => {
    setIsGenerating(true);
    try {
      await generateReferralCodeMutation.mutateAsync();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyReferralLink = () => {
    const referralLink = `${window.location.origin}/auth?ref=${user?.referralCode || ''}`;
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Referral Link Copied",
      description: "The referral link has been copied to your clipboard.",
    });
  };

  const handleVisitReferralLink = () => {
    const referralLink = `${window.location.origin}/auth?ref=${user?.referralCode || ''}`;
    window.open(referralLink, '_blank');
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
                <div className="text-2xl font-bold">${earningsData.totalEarnings.toFixed(2)}</div>
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
                <div className="text-2xl font-bold">${earningsData.monthlyEarnings.toFixed(2)}</div>
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
                <div className="text-2xl font-bold">{earningsData.totalReferrals}</div>
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
                <div className="text-2xl font-bold">{earningsData.commissionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Current commission tier
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Referral Code Section */}
          <Card>
            <CardHeader>
              <CardTitle>Your Referral Code</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {user?.referralCode ? (
                  <>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-lg font-medium">{user.referralCode}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      This is your unique referral code. Share it with other businesses to earn commissions.
                    </p>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-4">
                      Generate your referral code to start earning commissions from referrals.
                    </p>
                    <Button
                      onClick={handleGenerateReferralCode}
                      disabled={isGenerating}
                      className="flex items-center"
                    >
                      {isGenerating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Generate Referral Code
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Referral Strategy Guide Section */}
          {user?.referralCode && (
            <Card>
              <CardHeader>
                <CardTitle>Referral Strategy Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Get personalized AI-powered insights on how to maximize your referral earnings
                    and grow your network effectively.
                  </p>
                  <Button
                    onClick={() => window.location.href = '/wholesale/referral-guide'}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <BrainCircuit className="h-4 w-4" />
                    View Personalized Strategy
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Referral Link Section */}
          {user?.referralCode && (
            <Card>
              <CardHeader>
                <CardTitle>Your Referral Link</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
                    <code className="text-sm font-mono break-all">
                      {`${window.location.origin}/auth?ref=${user.referralCode}`}
                    </code>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopyReferralLink}
                        title="Copy referral link"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleVisitReferralLink}
                        title="Visit referral link"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Share this link with other businesses to earn commissions on their orders.
                    You'll earn {earningsData.commissionRate}% of their order value.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

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
        </div>
      </div>
    </WholesaleLayout>
  );
}
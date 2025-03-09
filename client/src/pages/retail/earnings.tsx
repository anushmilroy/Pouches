import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2, Gift, Users, Copy, ExternalLink, RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function RetailEarnings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: referralStats } = useQuery({
    queryKey: ["/api/referral-stats"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/referral-stats");
      return response.json();
    },
  });

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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Earnings</h1>

      <div className="grid gap-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${referralStats?.totalEarnings?.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">Lifetime earnings from referrals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{referralStats?.totalReferrals || 0}</div>
              <p className="text-xs text-muted-foreground">People who used your referral code</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Referral Rate</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3%</div>
              <p className="text-xs text-muted-foreground">Commission per referral purchase</p>
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
                    Share your referral code with friends and earn commissions when they make purchases.
                  </p>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">
                    Generate your referral code to start earning from referrals.
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
                  Share this link with friends. When they make a purchase, you'll earn 3% commission.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle>How Referrals Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4">
                  <div className="mb-2">1</div>
                  <h3 className="font-medium mb-2">Share Your Code</h3>
                  <p className="text-sm text-muted-foreground">
                    Share your unique referral code with friends
                  </p>
                </div>
                <div className="text-center p-4">
                  <div className="mb-2">2</div>
                  <h3 className="font-medium mb-2">Friends Make Purchase</h3>
                  <p className="text-sm text-muted-foreground">
                    They use your code when making a purchase
                  </p>
                </div>
                <div className="text-center p-4">
                  <div className="mb-2">3</div>
                  <h3 className="font-medium mb-2">Earn Commission</h3>
                  <p className="text-sm text-muted-foreground">
                    You earn 3% commission on their purchase
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, LightbulbIcon } from "lucide-react";

interface Transaction {
  id: number;
  orderId: number;
  amount: number;
  status: 'PENDING' | 'PAID';
  createdAt: string;
}

interface EarningsData {
  total: number;
  pending: number;
  transactions: Transaction[];
}

interface ReferralGuide {
  insights: string;
  recommendations: string[];
  potentialEarnings: number;
}

export function EarningsSection() {
  const { toast } = useToast();

  const { data: earnings, isLoading: earningsLoading } = useQuery<EarningsData>({
    queryKey: ["/api/users/earnings"],
  });

  const { data: referralCode } = useQuery<string>({
    queryKey: ["/api/users/referral-code"],
  });

  const { data: referralGuide, isLoading: guideLoading } = useQuery<ReferralGuide>({
    queryKey: ["/api/referral-guide"],
  });

  const generateReferralCode = async () => {
    try {
      await apiRequest("POST", "/api/users/referral-code");
      queryClient.invalidateQueries({ queryKey: ["/api/users/referral-code"] });
      toast({
        title: "Success",
        description: "Your referral code has been generated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate referral code",
        variant: "destructive",
      });
    }
  };

  if (earningsLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              ${earnings?.total.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muted-foreground">
              ${earnings?.pending.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Referral Code</CardTitle>
          </CardHeader>
          <CardContent>
            {referralCode ? (
              <div className="text-xl font-mono bg-muted p-2 rounded">
                {referralCode}
              </div>
            ) : (
              <Button onClick={generateReferralCode}>
                Generate Referral Code
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Section */}
      <Card className="bg-primary/5 border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LightbulbIcon className="h-5 w-5" />
            AI-Powered Referral Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          {guideLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : referralGuide ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Analysis</h4>
                <p className="text-muted-foreground">{referralGuide.insights}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Recommendations</h4>
                <ul className="list-disc pl-4 space-y-2">
                  {referralGuide.recommendations.map((rec, index) => (
                    <li key={index} className="text-muted-foreground">{rec}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Potential Monthly Earnings</h4>
                <p className="text-2xl font-bold text-primary">
                  ${referralGuide.potentialEarnings.toFixed(2)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              No insights available at the moment. Start referring users to get personalized recommendations!
            </p>
          )}
        </CardContent>
      </Card>

      <div>
        <h3 className="text-lg font-semibold mb-4">Earnings History</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {earnings?.transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  {format(new Date(transaction.createdAt), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>#{transaction.orderId}</TableCell>
                <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    transaction.status === 'PAID' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {transaction.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {(!earnings?.transactions || earnings.transactions.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No earnings yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
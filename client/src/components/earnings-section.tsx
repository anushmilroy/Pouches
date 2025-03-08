import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

export function EarningsSection() {
  const { toast } = useToast();
  
  const { data: earnings, isLoading: earningsLoading } = useQuery({
    queryKey: ["/api/users/earnings"],
  });

  const { data: referralCode, isLoading: referralLoading } = useQuery({
    queryKey: ["/api/users/referral-code"],
  });

  const generateReferralCode = async () => {
    try {
      const response = await apiRequest("POST", "/api/users/referral-code");
      const data = await response.json();
      toast({
        title: "Referral Code Generated",
        description: `Your referral code is: ${data.referralCode}`,
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
    <Card>
      <CardHeader>
        <CardTitle>Earnings & Referrals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${earnings?.total || "0.00"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Referral Code</CardTitle>
              </CardHeader>
              <CardContent>
                {referralCode ? (
                  <div className="text-xl font-mono">{referralCode}</div>
                ) : (
                  <Button onClick={generateReferralCode}>
                    Generate Referral Code
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

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
                {earnings?.transactions?.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {format(new Date(transaction.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>#{transaction.orderId}</TableCell>
                    <TableCell>${transaction.amount}</TableCell>
                    <TableCell>{transaction.status}</TableCell>
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
      </CardContent>
    </Card>
  );
}

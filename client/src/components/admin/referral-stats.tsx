import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@shared/schema";

interface ReferralStats {
  userId: number;
  username: string;
  role: UserRole;
  totalReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  lastReferralDate: string | null;
}

interface ReferralSummary {
  totalCommissionPaid: number;
  totalCommissionPending: number;
  activeReferrers: number;
}

export function AdminReferralStats() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<ReferralStats[]>({
    queryKey: ["/api/admin/referral-stats"]
  });

  const { data: summary, isLoading: summaryLoading, error: summaryError } = useQuery<ReferralSummary>({
    queryKey: ["/api/admin/referral-summary"]
  });

  if (statsLoading || summaryLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (statsError || summaryError) {
    return (
      <div className="text-center p-4 text-destructive">
        Error loading referral data. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Commission Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              ${(summary?.totalCommissionPaid || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muted-foreground">
              ${(summary?.totalCommissionPending || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Referrers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {summary?.activeReferrers || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Referral Performance by User</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Total Referrals</TableHead>
                <TableHead>Total Earnings</TableHead>
                <TableHead>Pending Earnings</TableHead>
                <TableHead>Last Referral</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.map((stat) => (
                <TableRow key={stat.userId}>
                  <TableCell className="font-medium">{stat.username}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{stat.role}</Badge>
                  </TableCell>
                  <TableCell>{stat.totalReferrals}</TableCell>
                  <TableCell>${stat.totalEarnings.toFixed(2)}</TableCell>
                  <TableCell>${stat.pendingEarnings.toFixed(2)}</TableCell>
                  <TableCell>
                    {stat.lastReferralDate
                      ? format(new Date(stat.lastReferralDate), 'MMM d, yyyy')
                      : 'No referrals yet'}
                  </TableCell>
                </TableRow>
              ))}
              {(!stats || stats.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No referral data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
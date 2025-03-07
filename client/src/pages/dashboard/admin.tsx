import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Order, OrderStatus } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [processingOrder, setProcessingOrder] = useState<number | null>(null);

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: pendingPayments } = useQuery<Order[]>({
    queryKey: ["/api/orders/pending-payments"],
  });

  const handleVerifyPayment = async (orderId: number) => {
    try {
      setProcessingOrder(orderId);
      await apiRequest("POST", `/api/orders/${orderId}/verify`);
      toast({
        title: "Payment Verified",
        description: "Order has been marked as paid",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify payment",
        variant: "destructive",
      });
    } finally {
      setProcessingOrder(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {pendingPayments?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{orders?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>#{order.id}</TableCell>
                    <TableCell>{order.status}</TableCell>
                    <TableCell>${order.total}</TableCell>
                    <TableCell>{order.paymentMethod}</TableCell>
                    <TableCell>
                      {order.status === OrderStatus.PENDING && (
                        <Button
                          size="sm"
                          onClick={() => handleVerifyPayment(order.id)}
                          disabled={processingOrder === order.id}
                        >
                          {processingOrder === order.id && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Verify Payment
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

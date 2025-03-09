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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Order, OrderStatus, DistributorInventory, DistributorCommission } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, TrendingUp, Truck, DollarSign, Package } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Update the type to include productName
type InventoryWithProduct = DistributorInventory & {
  productName: string;
};

export default function DistributorDashboard() {
  const { toast } = useToast();
  const [processingOrder, setProcessingOrder] = useState<number | null>(null);

  const { data: assignedOrders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders/distributor"],
  });

  const { data: commissionStats } = useQuery<{
    total: number;
    thisMonth: number;
    pendingDeliveries: number;
  }>({
    queryKey: ["/api/distributor/stats"],
  });

  const { data: inventory, isLoading: inventoryLoading } = useQuery<InventoryWithProduct[]>({
    queryKey: ["/api/distributors/inventory"],
  });

  const { data: commissions, isLoading: commissionsLoading } = useQuery<DistributorCommission[]>({
    queryKey: ["/api/distributors/commissions"],
  });

  const handleUpdateStatus = async (orderId: number, newStatus: keyof typeof OrderStatus) => {
    try {
      setProcessingOrder(orderId);
      await apiRequest("PATCH", `/api/orders/${orderId}/status`, { status: newStatus });

      queryClient.invalidateQueries({ queryKey: ["/api/orders/distributor"] });
      queryClient.invalidateQueries({ queryKey: ["/api/distributor/stats"] });

      toast({
        title: "Order Updated",
        description: `Order status has been updated to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update order status",
        variant: "destructive",
      });
    } finally {
      setProcessingOrder(null);
    }
  };

  const getStatusColor = (status: keyof typeof OrderStatus) => {
    switch (status) {
      case OrderStatus.PAID:
        return "bg-yellow-100 text-yellow-800";
      case OrderStatus.PROCESSING:
        return "bg-blue-100 text-blue-800";
      case OrderStatus.SHIPPED:
        return "bg-purple-100 text-purple-800";
      case OrderStatus.DELIVERED:
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Pending Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {commissionStats?.pendingDeliveries || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Total Commission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              ${commissionStats?.total || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muted-foreground">
              ${commissionStats?.thisMonth || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Products in Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muted-foreground">
              {inventory?.reduce((acc, item) => acc + item.quantity, 0) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {inventoryLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
                {(!inventory || inventory.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No inventory items found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Orders Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Assigned Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
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
                  <TableHead>Commission</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedOrders?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>#{order.id}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>${order.total}</TableCell>
                    <TableCell>${Number(order.total) * 0.05}</TableCell>
                    <TableCell>
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {order.status === OrderStatus.PAID && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(order.id, OrderStatus.PROCESSING)}
                            disabled={processingOrder === order.id}
                          >
                            {processingOrder === order.id && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Start Processing
                          </Button>
                        )}
                        {order.status === OrderStatus.PROCESSING && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(order.id, OrderStatus.SHIPPED)}
                            disabled={processingOrder === order.id}
                          >
                            {processingOrder === order.id && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Mark Shipped
                          </Button>
                        )}
                        {order.status === OrderStatus.SHIPPED && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(order.id, OrderStatus.DELIVERED)}
                            disabled={processingOrder === order.id}
                          >
                            {processingOrder === order.id && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Mark Delivered
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!assignedOrders || assignedOrders.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No orders assigned yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Commission History Section */}
      <Card>
        <CardHeader>
          <CardTitle>Commission History</CardTitle>
        </CardHeader>
        <CardContent>
          {commissionsLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions?.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>#{commission.orderId}</TableCell>
                    <TableCell>${commission.amount}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={commission.status === 'PAID' ? 'bg-green-100 text-green-800' : ''}>
                        {commission.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {commission.createdAt ? new Date(commission.createdAt).toLocaleDateString() : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
                {(!commissions || commissions.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No commission history found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
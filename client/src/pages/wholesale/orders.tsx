import WholesaleLayout from "@/components/layout/wholesale-layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Order } from "@shared/schema";
import { Loader2, ExternalLink } from "lucide-react";
import { OrderStatusBadge } from "@/components/ui/order-status-badge";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function WholesaleOrders() {
  const { toast } = useToast();
  const { data: orders, isLoading, error } = useQuery<Order[]>({
    queryKey: ["/api/orders/wholesale"],
    onError: (err) => {
      console.error("Error fetching wholesale orders:", err);
      toast({
        title: "Error",
        description: "Failed to fetch your orders. Please try again.",
        variant: "destructive",
      });
    }
  });

  console.log("Fetched wholesale orders:", {
    ordersCount: orders?.length,
    orders: orders,
    error: error
  });

  return (
    <WholesaleLayout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-destructive">
                Error loading orders. Please try again.
              </p>
            </CardContent>
          </Card>
        ) : !orders || orders.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                You haven't placed any orders yet. Visit our <a href="/wholesale" className="text-primary hover:underline">shop</a> to start ordering.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Order #{order.id}</CardTitle>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Order Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Date Placed</h4>
                        <p className="text-lg">
                          {format(new Date(order.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Total Amount</h4>
                        <p className="text-lg">${Number(order.total).toFixed(2)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Payment Method</h4>
                        <p className="text-lg">{order.paymentMethod.replace(/_/g, ' ')}</p>
                      </div>
                      {order.trackingNumber && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Tracking Number</h4>
                          <div className="flex items-center gap-2">
                            <p className="text-lg">{order.trackingNumber}</p>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Status Timeline */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Order Progress</h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className={`h-2 w-2 rounded-full ${order.status !== 'PENDING' ? 'bg-primary' : 'bg-muted'}`} />
                          <p className={order.status !== 'PENDING' ? 'text-primary' : 'text-muted-foreground'}>
                            Order Placed
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`h-2 w-2 rounded-full ${order.status === 'APPROVED' || order.status === 'DISTRIBUTOR_ASSIGNED' || order.status === 'SHIPPED' || order.status === 'DELIVERED' ? 'bg-primary' : 'bg-muted'}`} />
                          <p className={order.status === 'APPROVED' || order.status === 'DISTRIBUTOR_ASSIGNED' || order.status === 'SHIPPED' || order.status === 'DELIVERED' ? 'text-primary' : 'text-muted-foreground'}>
                            Order Approved
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`h-2 w-2 rounded-full ${order.status === 'DISTRIBUTOR_ASSIGNED' || order.status === 'SHIPPED' || order.status === 'DELIVERED' ? 'bg-primary' : 'bg-muted'}`} />
                          <p className={order.status === 'DISTRIBUTOR_ASSIGNED' || order.status === 'SHIPPED' || order.status === 'DELIVERED' ? 'text-primary' : 'text-muted-foreground'}>
                            Distributor Assigned
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`h-2 w-2 rounded-full ${order.status === 'SHIPPED' || order.status === 'DELIVERED' ? 'bg-primary' : 'bg-muted'}`} />
                          <p className={order.status === 'SHIPPED' || order.status === 'DELIVERED' ? 'text-primary' : 'text-muted-foreground'}>
                            Order Shipped {order.shippedAt && `(${format(new Date(order.shippedAt), 'MMM d, yyyy')})`}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`h-2 w-2 rounded-full ${order.status === 'DELIVERED' ? 'bg-primary' : 'bg-muted'}`} />
                          <p className={order.status === 'DELIVERED' ? 'text-primary' : 'text-muted-foreground'}>
                            Order Delivered {order.deliveredAt && `(${format(new Date(order.deliveredAt), 'MMM d, yyyy')})`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </WholesaleLayout>
  );
}
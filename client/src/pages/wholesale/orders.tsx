import WholesaleLayout from "@/components/layout/wholesale-layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Order } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "@/components/ui/status-badge";

export default function WholesaleOrders() {
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders/wholesale"],
  });

  return (
    <WholesaleLayout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-6">
            {!orders || orders.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">
                    You haven't placed any orders yet. Visit our <a href="/wholesale" className="text-primary hover:underline">shop</a> to start ordering.
                  </p>
                </CardContent>
              </Card>
            ) : (
              orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>Order #{order.id}</span>
                      <StatusBadge status={order.status} />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-muted-foreground">Payment Method</span>
                          <p className="font-medium">
                            {order.isWholesaleLoan ? 'Wholesale Loan' : 'Invoice Payment'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Amount</span>
                          <p className="font-medium">${typeof order.total === 'string' ? parseFloat(order.total).toFixed(2) : order.total.toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Order Date</span>
                          <p className="font-medium">
                            {format(new Date(order.createdAt || ''), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Items</span>
                          <p className="font-medium">{order.items?.length || 0} products</p>
                        </div>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div className="mt-4 border-t pt-4">
                          <h4 className="font-medium mb-2">Order Items</h4>
                          <div className="space-y-2">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{item.product.name} ({item.strength})</span>
                                <span>{item.quantity} units @ ${item.unitPrice}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </WholesaleLayout>
  );
}
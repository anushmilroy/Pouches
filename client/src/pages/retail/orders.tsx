import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Order } from "@shared/schema";
import { Loader2, Package } from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";

export default function RetailOrders() {
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Orders</h1>
        <Badge variant="outline" className="text-base">
          Total Orders: {orders?.length || 0}
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6">
          {!orders?.length ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-xl font-medium">No orders yet</p>
                <p className="text-muted-foreground">Your order history will appear here</p>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <span>Order #{order.id}</span>
                    </div>
                    <StatusBadge status={order.status} className="text-sm" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Order Date</h4>
                      <p className="text-lg">{format(new Date(order.createdAt || ''), 'MMM d, yyyy')}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Total Amount</h4>
                      <p className="text-lg font-bold">${order.total.toFixed(2)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Payment Method</h4>
                      <Badge variant="secondary" className="text-sm">
                        {order.paymentMethod}
                      </Badge>
                    </div>
                  </div>

                  {order.items && (
                    <div className="mt-6 border-t pt-6">
                      <h4 className="font-medium mb-3">Order Items</h4>
                      <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <div>
                              <span className="font-medium">{item.product.name}</span>
                              <span className="text-muted-foreground ml-2">({item.strength})</span>
                            </div>
                            <div className="text-right">
                              <span>{item.quantity} units</span>
                              <span className="text-muted-foreground ml-2">@ ${item.unitPrice}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

import WholesaleLayout from "@/components/layout/wholesale-layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Order } from "@shared/schema";
import { Loader2, Package } from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";

export default function WholesaleOrders() {
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders/wholesale"],
  });

  return (
    <WholesaleLayout>
      <div className="container mx-auto px-4 py-6">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Order Date</h4>
                        <p className="text-lg">{format(new Date(order.createdAt || ''), 'MMM d, yyyy')}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Total Amount</h4>
                        <p className="text-lg font-bold">${order.total.toFixed(2)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Items</h4>
                        <p className="text-lg">{order.totalItems || 0} products</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Payment Method</h4>
                        <Badge variant="secondary" className="text-sm">
                          {order.wholesaleLoanId ? 'Wholesale Loan' : 'Invoice Payment'}
                        </Badge>
                      </div>
                    </div>

                    {order.orderDetails && (
                      <div className="mt-6 border-t pt-6">
                        <h4 className="font-medium mb-3">Order Details</h4>
                        <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                          {order.orderDetails.map((detail, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <div>
                                <span className="font-medium">{detail.productName}</span>
                                {detail.strength && (
                                  <span className="text-muted-foreground ml-2">({detail.strength})</span>
                                )}
                              </div>
                              <div className="text-right">
                                <span>{detail.quantity} units</span>
                                <span className="text-muted-foreground ml-2">@ ${detail.unitPrice}</span>
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
    </WholesaleLayout>
  );
}
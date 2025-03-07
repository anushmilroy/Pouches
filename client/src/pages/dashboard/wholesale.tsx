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
import { Product, Order, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Package, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";

export default function WholesaleDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [isOrdering, setIsOrdering] = useState(false);

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: orders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: commission } = useQuery<{ total: number; pending: number }>({
    queryKey: ["/api/wholesale/commission"],
  });

  const handleOrder = async (productId: number) => {
    const quantity = quantities[productId] || 0;
    if (quantity < 1) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsOrdering(true);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity,
          type: "wholesale",
        }),
      });

      if (!res.ok) throw new Error("Failed to create order");

      toast({
        title: "Order Created",
        description: "Your wholesale order has been placed successfully",
      });
      
      setQuantities({ ...quantities, [productId]: 0 });
    } catch (error) {
      toast({
        title: "Order Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{orders?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Earned Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              ${commission?.total || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muted-foreground">
              ${commission?.pending || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wholesale Products</CardTitle>
        </CardHeader>
        <CardContent>
          {productsLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Wholesale Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products?.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 mr-2" />
                        {product.name}
                      </div>
                    </TableCell>
                    <TableCell>{product.description}</TableCell>
                    <TableCell>${product.wholesalePrice}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={quantities[product.id] || ""}
                        onChange={(e) =>
                          setQuantities({
                            ...quantities,
                            [product.id]: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleOrder(product.id)}
                        disabled={isOrdering || product.stock === 0}
                      >
                        {isOrdering && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Order
                      </Button>
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

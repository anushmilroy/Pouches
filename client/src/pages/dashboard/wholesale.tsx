import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Product, Order } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Package } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { EarningsSection } from "@/components/earnings-section";
import { BankDetailsForm } from "@/components/bank-details-form";

export default function WholesaleDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [isOrdering, setIsOrdering] = useState(false);

  // Check if user has bank details
  const needsBankDetails = !user?.bankDetails;

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: orders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
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
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity,
          type: "wholesale",
        }),
      });

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

  if (needsBankDetails) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-8">
          <h2 className="text-2xl font-bold mb-6">Welcome to Your Wholesale Account</h2>
          <p className="text-muted-foreground mb-8">
            To start earning commissions from referrals, please set up your bank account details first.
          </p>
          <BankDetailsForm />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <EarningsSection />

      <div className="mt-8">
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
      </div>
    </DashboardLayout>
  );
}
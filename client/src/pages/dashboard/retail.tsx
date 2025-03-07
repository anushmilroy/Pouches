import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Product, Order, PaymentMethod } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Package, ShoppingCart } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import CryptoForm from "@/components/payment/crypto-form";
import BankTransferForm from "@/components/payment/bank-transfer-form";

export default function RetailDashboard() {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isOrdering, setIsOrdering] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<keyof typeof PaymentMethod | null>(null);

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: orders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const handleOrder = async (product: Product) => {
    setSelectedProduct(product);
  };

  const handlePaymentComplete = () => {
    setSelectedProduct(null);
    setSelectedPaymentMethod(null);
    queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
  };

  const confirmOrder = async () => {
    if (!selectedProduct || !selectedPaymentMethod) return;

    try {
      setIsOrdering(true);
      const res = await apiRequest("POST", "/api/orders", {
        productId: selectedProduct.id,
        quantity: 1,
        paymentMethod: selectedPaymentMethod,
      });

      if (!res.ok) throw new Error("Failed to create order");

      const order = await res.json();
      toast({
        title: "Order Created",
        description: "Your order has been placed successfully",
      });

      if (selectedPaymentMethod === PaymentMethod.COD) {
        handlePaymentComplete();
      }
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome to Pouches Worldwide</h1>
        <p className="text-muted-foreground">Browse and purchase quality pouches at competitive prices</p>
      </div>

      {productsLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products?.map((product) => (
            <Card key={product.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {product.name}
                </CardTitle>
                <CardDescription>{product.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="text-2xl font-bold mb-4">${product.price}</div>
                <div className="text-sm text-muted-foreground mb-4">
                  Stock: {product.stock} available
                </div>
                <Button
                  className="mt-auto"
                  onClick={() => handleOrder(product)}
                  disabled={product.stock === 0}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Order Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Your Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Select Payment Method</h3>
              <RadioGroup
                value={selectedPaymentMethod || ""}
                onValueChange={(value) => setSelectedPaymentMethod(value as keyof typeof PaymentMethod)}
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={PaymentMethod.CRYPTO} id="crypto" />
                    <Label htmlFor="crypto">Cryptocurrency</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={PaymentMethod.BANK_TRANSFER} id="bank" />
                    <Label htmlFor="bank">Bank Transfer</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={PaymentMethod.COD} id="cod" />
                    <Label htmlFor="cod">Cash on Delivery</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {selectedPaymentMethod && selectedProduct && (
              <div>
                {selectedPaymentMethod === PaymentMethod.CRYPTO && (
                  <CryptoForm
                    orderId={selectedProduct.id}
                    amount={selectedProduct.price}
                    onPaymentComplete={handlePaymentComplete}
                  />
                )}
                {selectedPaymentMethod === PaymentMethod.BANK_TRANSFER && (
                  <BankTransferForm
                    orderId={selectedProduct.id}
                    amount={selectedProduct.price}
                    onPaymentComplete={handlePaymentComplete}
                  />
                )}
                {selectedPaymentMethod === PaymentMethod.COD && (
                  <Button
                    className="w-full"
                    onClick={confirmOrder}
                    disabled={isOrdering}
                  >
                    {isOrdering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm Order
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import StoreLayout from "@/components/layout/store-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Product, PouchCategory, PouchFlavor, NicotineStrength } from "@shared/schema";
import { Loader2, Package, ShoppingCart, Plus, Minus } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function ShopPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof PouchCategory | "">("");
  const [selectedFlavor, setSelectedFlavor] = useState<keyof typeof PouchFlavor | "">("");
  const [selectedStrength, setSelectedStrength] = useState<keyof typeof NicotineStrength | "">("");
  const [cart, setCart] = useState<Record<number, number>>({});

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const totalCans = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);

  const filteredProducts = products
    ?.filter((product) => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      const matchesFlavor = !selectedFlavor || product.flavor === selectedFlavor;
      const matchesStrength = !selectedStrength || product.strength === selectedStrength;

      return matchesSearch && matchesCategory && matchesFlavor && matchesStrength;
    });

  const handleAddToCart = (productId: number) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  const handleRemoveFromCart = (productId: number) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[productId] > 1) {
        newCart[productId]--;
      } else {
        delete newCart[productId];
      }
      return newCart;
    });
  };

  const handleCheckout = () => {
    if (totalCans < 5) {
      toast({
        title: "Minimum Order Required",
        description: "Please add at least 5 cans to your cart before checkout",
        variant: "destructive"
      });
      return;
    }
    setLocation("/checkout");
  };

  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Shop Our Products</h1>
          <p className="text-muted-foreground">
            Browse our collection of quality nicotine pouches
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <Select
            value={selectedCategory}
            onValueChange={(value) => setSelectedCategory(value as keyof typeof PouchCategory | "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {Object.entries(PouchCategory).map(([key, value]) => (
                <SelectItem key={key} value={value}>{value} Nicotine Pouches</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedFlavor}
            onValueChange={(value) => setSelectedFlavor(value as keyof typeof PouchFlavor | "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Flavor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Flavors</SelectItem>
              {Object.entries(PouchFlavor).map(([key, value]) => (
                <SelectItem key={key} value={value}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedStrength}
            onValueChange={(value) => setSelectedStrength(value as keyof typeof NicotineStrength | "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Strength" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Strengths</SelectItem>
              {Object.entries(NicotineStrength).map(([key, value]) => (
                <SelectItem key={key} value={value}>{value}mg</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cart Summary */}
        <div className="bg-primary/5 p-4 rounded-lg mb-8 flex items-center justify-between">
          <div>
            <span className="font-medium">Cart Total:</span> {totalCans} cans
            {totalCans > 0 && totalCans < 5 && (
              <p className="text-sm text-muted-foreground">
                Add {5 - totalCans} more can{5 - totalCans !== 1 ? 's' : ''} to reach the minimum order
              </p>
            )}
          </div>
          <Button
            onClick={handleCheckout}
            disabled={totalCans < 5}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Proceed to Checkout
          </Button>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts?.map((product) => (
              <Card key={product.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {product.name}
                  </CardTitle>
                  <CardDescription>{product.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-2 mb-4">
                    <div className="text-2xl font-bold">${product.price}</div>
                    <div className="text-sm">
                      <span className="font-medium">Category:</span> {product.category}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Flavor:</span> {product.flavor}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Strength:</span> {product.strength}mg
                    </div>
                  </div>

                  {cart[product.id] ? (
                    <div className="flex items-center gap-2 mt-auto">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleRemoveFromCart(product.id)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="flex-1 text-center">{cart[product.id]} in cart</span>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleAddToCart(product.id)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="mt-auto"
                      onClick={() => handleAddToCart(product.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
            {(!filteredProducts || filteredProducts.length === 0) && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No products found. Try adjusting your filters.
              </div>
            )}
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
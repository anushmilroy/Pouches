import { useState, useEffect } from "react";
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
import { cn } from "@/lib/utils";

export default function ShopPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof PouchCategory | null>(null);
  const [selectedFlavor, setSelectedFlavor] = useState<keyof typeof PouchFlavor | null>(null);
  const [cart, setCart] = useState<Record<string, { quantity: number, strength: keyof typeof NicotineStrength }>>({});

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const totalCans = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);

  const uniqueProducts = products?.reduce((acc, product) => {
    const key = `${product.flavor}`;
    if (!acc[key]) {
      acc[key] = {
        ...product,
        strengths: [product.strength]
      };
    } else {
      acc[key].strengths.push(product.strength);
    }
    return acc;
  }, {} as Record<string, Product & { strengths: (keyof typeof NicotineStrength)[] }>);

  const filteredProducts = uniqueProducts ?
    Object.values(uniqueProducts).filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      const matchesFlavor = !selectedFlavor || product.flavor === selectedFlavor;

      return matchesSearch && matchesCategory && matchesFlavor;
    }) : [];

  const handleAddToCart = (productId: string, strength: keyof typeof NicotineStrength) => {
    setCart(prev => {
      const newCart = {
        ...prev,
        [`${productId}-${strength}`]: {
          quantity: (prev[`${productId}-${strength}`]?.quantity || 0) + 1,
          strength
        }
      };
      localStorage.setItem('cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const handleRemoveFromCart = (productId: string, strength: keyof typeof NicotineStrength) => {
    setCart(prev => {
      const newCart = { ...prev };
      const key = `${productId}-${strength}`;
      if (newCart[key]?.quantity > 1) {
        newCart[key].quantity--;
      } else {
        delete newCart[key];
      }
      localStorage.setItem('cart', JSON.stringify(newCart));
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <Select
            value={selectedCategory || "all"}
            onValueChange={(value) => setSelectedCategory(value === "all" ? null : value as keyof typeof PouchCategory)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(PouchCategory).map(([key, value]) => (
                <SelectItem key={key} value={key}>{value} Nicotine Pouches</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedFlavor || "all"}
            onValueChange={(value) => setSelectedFlavor(value === "all" ? null : value as keyof typeof PouchFlavor)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Flavor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Flavors</SelectItem>
              {Object.entries(PouchFlavor).map(([key, value]) => (
                <SelectItem key={key} value={key}>{value}</SelectItem>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.flavor} className="flex flex-col overflow-hidden">
                {/* Product Image */}
                {product.imagePath ? (
                  <div className="aspect-square w-full relative bg-background border-b">
                    <img
                      src={product.imagePath}
                      alt={PouchFlavor[product.flavor as keyof typeof PouchFlavor]}
                      className="object-contain w-full h-full p-8"
                    />
                  </div>
                ) : (
                  <div className="aspect-square w-full bg-muted flex items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}

                <CardHeader>
                  <CardTitle>
                    {PouchFlavor[product.flavor as keyof typeof PouchFlavor]}
                  </CardTitle>
                  <CardDescription>{product.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-2 mb-4">
                    <div className="text-2xl font-bold">${product.price}</div>

                    {/* Strength Selection */}
                    <div className="flex flex-wrap gap-1 mt-4">
                      {product.strengths.sort().map((strength) => {
                        const cartKey = `${product.flavor}-${strength}`;
                        const cartItem = cart[cartKey];
                        const isSelected = !!cartItem;

                        return (
                          <div
                            key={strength}
                            className={cn(
                              "flex flex-col items-center flex-1 min-w-[80px]",
                              isSelected && "relative"
                            )}
                          >
                            <Button
                              size="sm"
                              variant={isSelected ? "default" : "outline"}
                              className="w-full mb-1"
                              onClick={() => !isSelected && handleAddToCart(product.flavor, strength)}
                            >
                              {NicotineStrength[strength]}
                            </Button>

                            {isSelected && (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-6 w-6"
                                  onClick={() => handleRemoveFromCart(product.flavor, strength)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="text-center font-medium min-w-[20px]">
                                  {cartItem.quantity}
                                </span>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-6 w-6"
                                  onClick={() => handleAddToCart(product.flavor, strength)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
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
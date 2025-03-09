import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import StoreLayout from "@/components/layout/store-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Product, PouchCategory, PouchFlavor, NicotineStrength, WholesalePricingTier } from "@shared/schema";
import { Loader2, Package, ShoppingCart, Plus, Minus } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Helper function to calculate wholesale price based on quantity
const calculateWholesalePrice = (quantity: number): number => {
  if (quantity < 100) return 0; // Invalid quantity
  
  const tiers = [
    { min: 25000, price: 5.00 }, // TIER_7
    { min: 10000, price: 5.50 }, // TIER_6
    { min: 5000, price: 6.00 },  // TIER_5
    { min: 1000, price: 6.50 },  // TIER_4
    { min: 500, price: 7.00 },   // TIER_3
    { min: 250, price: 7.50 },   // TIER_2
    { min: 100, price: 8.00 },   // TIER_1
  ];

  for (const tier of tiers) {
    if (quantity >= tier.min) {
      return tier.price;
    }
  }

  return 8.00; // Default to TIER_1 pricing
};

export default function WholesaleShopPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof PouchCategory | null>(null);
  const [selectedFlavor, setSelectedFlavor] = useState<keyof typeof PouchFlavor | null>(null);
  const [selectedStrength, setSelectedStrength] = useState<keyof typeof NicotineStrength | null>(null);
  const [cart, setCart] = useState<Record<string, { quantity: number, strength: keyof typeof NicotineStrength }>>({});

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('wholesale_cart');
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
      const matchesStrength = !selectedStrength || product.strengths.includes(selectedStrength);

      return matchesSearch && matchesCategory && matchesFlavor && matchesStrength;
    }) : [];

  const handleAddToCart = (productId: string, strength: keyof typeof NicotineStrength, quantity: number = 100) => {
    setCart(prev => {
      const newCart = {
        ...prev,
        [`${productId}-${strength}`]: {
          quantity: Math.max((prev[`${productId}-${strength}`]?.quantity || 0) + quantity, 100),
          strength
        }
      };
      localStorage.setItem('wholesale_cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const handleRemoveFromCart = (productId: string, strength: keyof typeof NicotineStrength, quantity: number = 100) => {
    setCart(prev => {
      const newCart = { ...prev };
      const key = `${productId}-${strength}`;
      if (newCart[key]?.quantity > quantity) {
        newCart[key].quantity = Math.max(100, newCart[key].quantity - quantity);
      } else {
        delete newCart[key];
      }
      localStorage.setItem('wholesale_cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const handleQuantityChange = (productId: string, strength: keyof typeof NicotineStrength, newQuantity: number) => {
    if (newQuantity < 100) {
      toast({
        title: "Invalid Quantity",
        description: "Minimum order quantity is 100 units",
        variant: "destructive"
      });
      return;
    }

    setCart(prev => {
      const newCart = {
        ...prev,
        [`${productId}-${strength}`]: {
          quantity: newQuantity,
          strength
        }
      };
      localStorage.setItem('wholesale_cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const handleCheckout = () => {
    if (totalCans < 100) {
      toast({
        title: "Minimum Order Required",
        description: "Please add at least 100 cans to your cart before checkout",
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
          <h1 className="text-3xl font-bold mb-4">Wholesale Products</h1>
          <p className="text-muted-foreground">
            Browse our collection of quality nicotine pouches at wholesale prices
          </p>
        </div>

        {/* Pricing Tiers Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Wholesale Pricing Tiers</CardTitle>
            <CardDescription>Order more to save more</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(WholesalePricingTier).map(([tier, { min, max, price }]) => (
                <div key={tier} className="p-4 border rounded-lg">
                  <div className="font-semibold">{tier.replace('_', ' ')}</div>
                  <div className="text-sm text-muted-foreground">
                    {max ? `${min}-${max}` : `${min}+`} units
                  </div>
                  <div className="text-xl font-bold mt-2">${price.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

          <Select
            value={selectedStrength || "all"}
            onValueChange={(value) => setSelectedStrength(value === "all" ? null : value as keyof typeof NicotineStrength)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Strength" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Strengths</SelectItem>
              {Object.entries(NicotineStrength).map(([key, value]) => (
                <SelectItem key={key} value={key}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cart Summary */}
        <div className="bg-primary/5 p-4 rounded-lg mb-8 flex items-center justify-between">
          <div>
            <span className="font-medium">Cart Total:</span> {totalCans} cans
            {totalCans > 0 && totalCans < 100 && (
              <p className="text-sm text-muted-foreground">
                Add {100 - totalCans} more can{100 - totalCans !== 1 ? 's' : ''} to reach the minimum order
              </p>
            )}
          </div>
          <Button
            onClick={handleCheckout}
            disabled={totalCans < 100}
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
                    {/* Strength Selection */}
                    <div className="flex flex-wrap gap-1 mt-4">
                      {product.strengths.sort().map((strength) => {
                        const cartKey = `${product.flavor}-${strength}`;
                        const cartItem = cart[cartKey];
                        const isSelected = !!cartItem;
                        const currentQuantity = cartItem?.quantity || 0;
                        const currentPrice = calculateWholesalePrice(currentQuantity);

                        return (
                          <div
                            key={strength}
                            className={cn(
                              "flex flex-col items-center flex-1 min-w-[120px]",
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
                              <div className="space-y-2">
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-6 w-6"
                                    onClick={() => handleRemoveFromCart(product.flavor, strength)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <Input
                                    type="number"
                                    min="100"
                                    step="50"
                                    value={currentQuantity}
                                    onChange={(e) => handleQuantityChange(product.flavor, strength, parseInt(e.target.value))}
                                    className="w-20 text-center"
                                  />
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-6 w-6"
                                    onClick={() => handleAddToCart(product.flavor, strength)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="text-center">
                                  <div className="font-medium">${currentPrice.toFixed(2)}/unit</div>
                                  <div className="text-sm text-muted-foreground">
                                    Total: ${(currentPrice * currentQuantity).toFixed(2)}
                                  </div>
                                </div>
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

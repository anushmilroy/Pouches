import { useState, useEffect } from "react";
import WholesaleLayout from "@/components/layout/wholesale-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, ShoppingCart, ChevronRight, Minus, Plus, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";

interface CartItem {
  quantity: number;
  unitPrice: number;
  strength: string;
  flavor: string;
}

// Function to calculate wholesale price based on total cart quantity
function calculateWholesalePrice(totalCartQuantity: number): number {
  if (totalCartQuantity >= 25000) return 5.00; // TIER_7
  if (totalCartQuantity >= 10000) return 5.50; // TIER_6
  if (totalCartQuantity >= 5000) return 6.00;  // TIER_5
  if (totalCartQuantity >= 1000) return 6.50;  // TIER_4
  if (totalCartQuantity >= 500) return 7.00;   // TIER_3
  if (totalCartQuantity >= 250) return 7.50;   // TIER_2
  return 8.00; // TIER_1
}

export default function WholesaleShop() {
  const { toast } = useToast();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cartItems, setCartItems] = useState<Record<string, CartItem>>({});
  const [selectedStrength, setSelectedStrength] = useState<string>("");
  const [selectedFlavor, setSelectedFlavor] = useState<string>("");
  const [, setLocation] = useLocation();

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Get unique strengths and flavors
  const strengths = [...new Set(products?.map(p => p.strength) || [])];
  const flavors = [...new Set(products?.map(p => p.flavor) || [])];

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('wholesale_cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  const handleQuantityChange = (productId: string, value: string) => {
    const quantity = parseInt(value) || 0;
    setQuantities({ ...quantities, [productId]: quantity });
  };

  const getTotalCartQuantity = (newCartItems?: Record<string, CartItem>): number => {
    const items = newCartItems || cartItems;
    return Object.values(items).reduce((total, item) => total + item.quantity, 0);
  };

  const addToCart = (product: Product) => {
    if (!selectedStrength || !selectedFlavor) {
      toast({
        title: "Selection Required",
        description: "Please select both strength and flavor",
        variant: "destructive",
      });
      return;
    }

    const quantity = quantities[product.id.toString()] || 0;
    if (quantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    const itemKey = `${product.id}-${selectedStrength}-${selectedFlavor}`;
    try {
      const newCart = {
        ...cartItems,
        [itemKey]: {
          quantity,
          unitPrice: calculateWholesalePrice(getTotalCartQuantity() + quantity),
          strength: selectedStrength,
          flavor: selectedFlavor
        }
      };

      // Update all items to have the same unit price
      const totalQuantity = getTotalCartQuantity(newCart);
      const newPrice = calculateWholesalePrice(totalQuantity);
      Object.keys(newCart).forEach(id => {
        newCart[id].unitPrice = newPrice;
      });

      setCartItems(newCart);
      localStorage.setItem('wholesale_cart', JSON.stringify(newCart));

      toast({
        title: "Added to Cart",
        description: `${quantity} units of ${product.name} (${selectedStrength}, ${selectedFlavor}) added`,
      });

      // Reset inputs
      setQuantities({ ...quantities, [product.id.toString()]: 0 });
      setSelectedStrength("");
      setSelectedFlavor("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  };

  const removeFromCart = (itemKey: string) => {
    const newCart = { ...cartItems };
    delete newCart[itemKey];

    if (getTotalCartQuantity(newCart) < 100) {
      toast({
        title: "Minimum Order Quantity",
        description: "Cannot remove item as total quantity would be below 100 units",
        variant: "destructive",
      });
      return;
    }

    // Update prices for remaining items
    const totalQuantity = getTotalCartQuantity(newCart);
    const newPrice = calculateWholesalePrice(totalQuantity);
    Object.keys(newCart).forEach(id => {
      newCart[id].unitPrice = newPrice;
    });

    setCartItems(newCart);
    localStorage.setItem('wholesale_cart', JSON.stringify(newCart));

    toast({
      title: "Item Removed",
      description: "Item has been removed from your cart",
    });
  };

  const updateCartItem = (itemKey: string, newQuantity: number) => {
    const newCart = { ...cartItems };

    if (newQuantity <= 0) {
      delete newCart[itemKey];
    } else {
      const [productId, strength, flavor] = itemKey.split('-');
      newCart[itemKey] = {
        quantity: newQuantity,
        unitPrice: calculateWholesalePrice(getTotalCartQuantity(newCart)),
        strength,
        flavor
      };
    }

    // Update all items' prices based on new total quantity
    const totalQuantity = getTotalCartQuantity(newCart);
    const newPrice = calculateWholesalePrice(totalQuantity);
    Object.keys(newCart).forEach(id => {
      newCart[id].unitPrice = newPrice;
    });

    setCartItems(newCart);
    localStorage.setItem('wholesale_cart', JSON.stringify(newCart));
  };

  const cartTotal = Object.entries(cartItems).reduce((total, [, item]) => {
    return total + (item.quantity * item.unitPrice);
  }, 0);

  const cartItemCount = getTotalCartQuantity();

  return (
    <WholesaleLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products?.map((product) => (
                      <Card key={product.id} className="flex flex-col">
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <Package className="h-5 w-5 mr-2" />
                            {product.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1">
                          <p className="text-sm text-muted-foreground mb-4">
                            {product.description}
                          </p>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Current Price</label>
                              <p className="text-lg font-bold">${calculateWholesalePrice(cartItemCount).toFixed(2)}/unit</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Strength</label>
                              <select
                                className="w-full mt-1 p-2 border rounded"
                                value={selectedStrength}
                                onChange={(e) => setSelectedStrength(e.target.value)}
                              >
                                <option value="">Select Strength</option>
                                {strengths.map(strength => (
                                  <option key={strength} value={strength}>{strength}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Flavor</label>
                              <select
                                className="w-full mt-1 p-2 border rounded"
                                value={selectedFlavor}
                                onChange={(e) => setSelectedFlavor(e.target.value)}
                              >
                                <option value="">Select Flavor</option>
                                {flavors.map(flavor => (
                                  <option key={flavor} value={flavor}>{flavor}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Quantity</label>
                              <Input
                                type="number"
                                min="1"
                                value={quantities[product.id.toString()] || 0}
                                onChange={(e) => handleQuantityChange(product.id.toString(), e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            <Button
                              className="w-full"
                              onClick={() => addToCart(product)}
                              disabled={!selectedStrength || !selectedFlavor || (quantities[product.id.toString()] || 0) <= 0}
                            >
                              Add to Cart
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Cart ({cartItemCount} items)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(cartItems).map(([itemKey, item]) => {
                    const [productId] = itemKey.split('-');
                    const product = products?.find(p => p.id === parseInt(productId));
                    return (
                      <div key={itemKey} className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{product?.name}</p>
                            <p className="text-sm">{item.strength} - {item.flavor}</p>
                            <p className="text-sm text-muted-foreground">
                              ${item.unitPrice.toFixed(2)}/unit
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(itemKey)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateCartItem(itemKey, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateCartItem(itemKey, parseInt(e.target.value) || 0)}
                            className="w-20 text-center"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateCartItem(itemKey, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <p className="font-medium ml-2">
                            ${(item.quantity * item.unitPrice).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {cartItemCount > 0 ? (
                    <>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <p className="font-medium">Total Quantity</p>
                        <p className="text-lg font-bold">{cartItemCount} units</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="font-medium">Total</p>
                        <p className="text-lg font-bold">${cartTotal.toFixed(2)}</p>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => {
                          if (cartItemCount < 100) {
                            toast({
                              title: "Minimum Order Quantity",
                              description: "Total order quantity must be at least 100 units",
                              variant: "destructive",
                            });
                            return;
                          }
                          setLocation("/wholesale/checkout");
                        }}
                      >
                        Checkout
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground">Your cart is empty</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </WholesaleLayout>
  );
}

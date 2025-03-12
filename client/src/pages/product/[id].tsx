import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Product, NicotineStrength, PouchFlavor } from "@shared/schema";
import StoreLayout from "@/components/layout/store-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Loader2, Package, ShoppingCart, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function ProductDetailPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedStrength, setSelectedStrength] = useState<string>();
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: [`/api/products/${id}`],
  });

  const { data: relatedProducts } = useQuery<Product[]>({
    queryKey: ["/api/products", { flavor: product?.flavor, exclude: id }],
    enabled: !!product,
  });

  const handleAddToCart = () => {
    if (!selectedStrength) {
      toast({
        title: "Please select strength",
        description: "You must select a nicotine strength before adding to cart",
        variant: "destructive",
      });
      return;
    }

    // Add to cart logic here
    toast({
      title: "Added to cart",
      description: `${quantity} ${quantity === 1 ? 'item' : 'items'} added to cart`,
    });
  };

  if (isLoading) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </StoreLayout>
    );
  }

  if (!product) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Button onClick={() => setLocation("/shop")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shop
          </Button>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => setLocation("/shop")} className="mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Shop
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Product Image */}
          <div className="aspect-square relative bg-background rounded-lg border overflow-hidden">
            {product.imagePath ? (
              <img
                src={product.imagePath}
                alt={product.name}
                className="object-contain w-full h-full p-8"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <p className="text-lg text-muted-foreground">
                {PouchFlavor[product.flavor as keyof typeof PouchFlavor]}
              </p>
            </div>

            <div className="prose prose-sm">
              <p>{product.description}</p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Select Strength</h3>
                <Select onValueChange={setSelectedStrength} value={selectedStrength}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose nicotine strength" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(NicotineStrength).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Quantity</h3>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-3 py-2 border rounded-md"
                />
              </div>

              <Button onClick={handleAddToCart} size="lg" className="w-full">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
            </div>

            {/* Product Features */}
            <div className="border-t pt-6">
              <h3 className="font-medium mb-4">Product Features</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Premium quality nicotine pouches</li>
                <li>Long-lasting flavor release</li>
                <li>Discrete and easy to use</li>
                <li>Available in multiple strengths</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Card key={relatedProduct.id} className="cursor-pointer hover:border-primary" 
                      onClick={() => setLocation(`/product/${relatedProduct.id}`)}>
                  <CardContent className="p-4">
                    <div className="aspect-square relative bg-muted rounded-lg mb-4">
                      {relatedProduct.imagePath ? (
                        <img
                          src={relatedProduct.imagePath}
                          alt={relatedProduct.name}
                          className="object-contain w-full h-full p-4"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium">{relatedProduct.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {PouchFlavor[relatedProduct.flavor as keyof typeof PouchFlavor]}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}

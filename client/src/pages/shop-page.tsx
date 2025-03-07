import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import StoreLayout from "@/components/layout/store-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Product, PouchCategory, PouchFlavor, NicotineStrength } from "@shared/schema";
import { Loader2, Package, ShoppingBag } from "lucide-react";
import { useLocation } from "wouter";

export default function ShopPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedFlavor, setSelectedFlavor] = useState<string>("");
  const [selectedStrength, setSelectedStrength] = useState<string>("");

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

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
            onValueChange={setSelectedCategory}
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
            onValueChange={setSelectedFlavor}
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
            onValueChange={setSelectedStrength}
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

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex justify-center p-12">
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
                    <div className="text-sm text-muted-foreground">
                      Stock: {product.stock} available
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Minimum Order: {product.minRetailOrder} cans
                    </div>
                  </div>
                  <Button
                    className="mt-auto"
                    onClick={() => setLocation("/checkout")}
                    disabled={product.stock === 0}
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
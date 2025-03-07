import StoreLayout from "@/components/layout/store-layout";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Package, Truck, CreditCard } from "lucide-react";

export default function HomePage() {
  const [, setLocation] = useLocation();

  return (
    <StoreLayout>
      {/* Hero Section */}
      <section className="bg-primary/5 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Quality Pouches for Every Need
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Discover our extensive collection of pouches perfect for retail and wholesale customers. Quality materials, competitive prices, worldwide shipping.
            </p>
            <Button
              size="lg"
              onClick={() => setLocation("/shop")}
            >
              Shop Now
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Quality Products</h3>
              <p className="text-muted-foreground">
                Premium materials and expert craftsmanship in every pouch
              </p>
            </div>
            <div className="text-center">
              <Truck className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Global Shipping</h3>
              <p className="text-muted-foreground">
                Fast and reliable worldwide delivery options
              </p>
            </div>
            <div className="text-center">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Secure Payments</h3>
              <p className="text-muted-foreground">
                Multiple payment options including crypto and bank transfer
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Wholesale CTA */}
      <section className="bg-primary/5 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Are You a Wholesale Buyer?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get access to wholesale prices and exclusive benefits. Create a wholesale account today.
          </p>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setLocation("/auth")}
          >
            Create Wholesale Account
          </Button>
        </div>
      </section>
    </StoreLayout>
  );
}

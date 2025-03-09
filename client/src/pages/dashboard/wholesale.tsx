import { useState, useEffect } from "react";
import WholesaleLayout from "@/components/layout/wholesale-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Order } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Loader2, TrendingUp, Package, Coins, ArrowUpRight, ArrowDownRight, ChevronRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function WholesaleDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch orders
  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders/wholesale"],
  });

  // Calculate metrics
  const totalOrders = orders?.length || 0;
  const totalRevenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const recentOrders = orders?.slice(0, 5) || [];

  // Monthly comparison (mock data - to be replaced with actual API data)
  const monthlyGrowth = 15; // percentage
  const monthlyVolume = 2500; // units

  return (
    <WholesaleLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  +{monthlyGrowth}% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Order Volume</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monthlyVolume} units</div>
                <p className="text-xs text-muted-foreground">
                  {totalOrders} orders this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Order</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${averageOrderValue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Per order average
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commissions</CardTitle>
                <Coins className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(totalRevenue * 0.05).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  5% commission rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Orders Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Orders</CardTitle>
                <Button 
                  variant="ghost" 
                  className="text-sm"
                  onClick={() => setLocation("/wholesale/orders")}
                >
                  View All
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Order #{order.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${order.total.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No recent orders found
                </p>
              )}
            </CardContent>
          </Card>

          {/* Growth Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Volume Growth</p>
                      <p className="text-2xl font-bold text-green-600">+{monthlyGrowth}%</p>
                    </div>
                    <ArrowUpRight className="h-8 w-8 text-green-600" />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Revenue Growth</p>
                      <p className="text-2xl font-bold text-green-600">+12%</p>
                    </div>
                    <ArrowUpRight className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Wholesale Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Volume Discount Tier</p>
                    <p className="text-2xl font-bold">Tier 2</p>
                    <p className="text-sm text-muted-foreground">
                      250+ units per order
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium">Next Tier Threshold</p>
                    <p className="text-2xl font-bold">500 units</p>
                    <p className="text-sm text-muted-foreground">
                      Unlock higher discounts
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </WholesaleLayout>
  );
}
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import WholesaleLayout from "@/components/layout/wholesale-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, TrendingUp, BrainCircuit } from "lucide-react";

export default function ReferralGuide() {
  const { data: guide, isLoading, refetch } = useQuery({
    queryKey: ["/api/referral-guide"],
  });

  return (
    <WholesaleLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Personalized Referral Strategy</h1>
            <p className="text-muted-foreground mt-2">
              AI-powered insights to help you grow your referral network
            </p>
          </div>
          <Button 
            onClick={() => refetch()} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh Insights
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : guide ? (
          <div className="grid gap-6">
            {/* Performance Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5" />
                  Performance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed">
                  {guide.insights}
                </p>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Strategic Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {guide.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-muted">
                        {index + 1}
                      </span>
                      <p className="leading-6">{recommendation}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Potential Earnings */}
            <Card>
              <CardHeader>
                <CardTitle>Potential Monthly Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  ${guide.potentialEarnings.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Estimated earnings if recommendations are implemented
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                Failed to load referral strategy guide. Please try again.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </WholesaleLayout>
  );
}

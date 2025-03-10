import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { UserRole, OnboardingStatus } from "@shared/schema";

export function ProtectedRoute({
  path,
  component: Component,
  requireOnboarding = true,
}: {
  path: string;
  component: () => React.JSX.Element;
  requireOnboarding?: boolean;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check if wholesale user needs to complete onboarding
  if (requireOnboarding && 
      user.role === UserRole.WHOLESALE && 
      user.onboardingStatus !== OnboardingStatus.COMPLETED) {
    return (
      <Route path={path}>
        <Redirect to="/wholesale/onboarding" />
      </Route>
    );
  }

  return <Component />;
}
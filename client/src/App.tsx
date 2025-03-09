import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import ShopPage from "@/pages/shop-page";
import CheckoutPage from "@/pages/checkout-page";
import OrderConfirmationPage from "@/pages/order-confirmation";
import AdminDashboard from "@/pages/dashboard/admin";
import RetailSettings from "@/pages/retail/settings";
import RetailOrders from "@/pages/retail/orders";
import RetailEarnings from "@/pages/retail/earnings";
import WholesaleDashboard from "@/pages/dashboard/wholesale";
import WholesaleCheckout from "@/pages/wholesale/checkout";
import WholesaleProfile from "@/pages/wholesale/profile";
import WholesaleOrders from "@/pages/wholesale/orders";
import WholesaleEarnings from "@/pages/wholesale/earnings";
import WholesaleShop from "@/pages/wholesale/shop";
import WholesaleReferralGuide from "@/pages/wholesale/referral-guide";
import WholesaleOrderConfirmation from "@/pages/wholesale/order-confirmation";
import DistributorDashboard from "@/pages/dashboard/distributor";
import RegistrationSuccess from "@/pages/auth/registration-success";
import OnboardingPage from "@/pages/onboarding";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";

function Router() {
  const { user } = useAuth();

  // Admin users should always go to admin dashboard when accessing root
  if (user?.role === UserRole.ADMIN && window.location.pathname === '/') {
    return <Redirect to="/admin" />;
  }

  // For non-admin users who haven't completed onboarding
  if (user && !user.onboardingCompletedAt && user.role !== UserRole.ADMIN && window.location.pathname !== '/onboarding') {
    return <Redirect to="/onboarding" />;
  }

  // Redirect wholesalers to their dashboard
  if (user?.role === UserRole.WHOLESALE && window.location.pathname === '/') {
    return <Redirect to="/wholesale/dashboard" />;
  }

  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/auth/registration-success" component={RegistrationSuccess} />

      {/* Onboarding Route - Not accessible to admins */}
      <Route path="/onboarding">
        {user?.role === UserRole.ADMIN ? <Redirect to="/admin" /> : <OnboardingPage />}
      </Route>

      {/* Admin Routes */}
      <ProtectedRoute path="/admin" component={AdminDashboard} />

      {/* Distributor Routes */}
      <ProtectedRoute path="/distributor" component={DistributorDashboard} />

      {/* Retail Routes */}
      <ProtectedRoute path="/retail/settings" component={RetailSettings} />
      <ProtectedRoute path="/retail/orders" component={RetailOrders} />
      <ProtectedRoute path="/retail/earnings" component={RetailEarnings} />

      {/* Shop Routes - Available to retail users and guests */}
      <Route path="/shop" component={ShopPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/order-confirmation" component={OrderConfirmationPage} />

      {/* Wholesale Routes */}
      {user?.role === UserRole.WHOLESALE ? (
        <>
          <ProtectedRoute path="/wholesale/dashboard" component={WholesaleDashboard} />
          <ProtectedRoute path="/wholesale" component={WholesaleShop} />
          <ProtectedRoute path="/wholesale/orders" component={WholesaleOrders} />
          <ProtectedRoute path="/wholesale/profile" component={WholesaleProfile} />
          <ProtectedRoute path="/wholesale/checkout" component={WholesaleCheckout} />
          <ProtectedRoute path="/wholesale/earnings" component={WholesaleEarnings} />
          <ProtectedRoute path="/wholesale/referral-guide" component={WholesaleReferralGuide} />
          <ProtectedRoute path="/wholesale/order-confirmation" component={WholesaleOrderConfirmation} />
        </>
      ) : null}

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
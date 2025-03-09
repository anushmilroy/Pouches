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
import WholesaleDashboard from "@/pages/dashboard/wholesale";
import WholesaleCheckout from "@/pages/wholesale/checkout";
import WholesaleProfile from "@/pages/wholesale/profile";
import WholesaleOrders from "@/pages/wholesale/orders";
import WholesaleEarnings from "@/pages/wholesale/earnings";
import DistributorDashboard from "@/pages/dashboard/distributor";
import RegistrationSuccess from "@/pages/auth/registration-success";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";

function Router() {
  const { user } = useAuth();

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

      {/* Protected Routes */}
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      <ProtectedRoute path="/distributor" component={DistributorDashboard} />

      {/* Wholesale Routes */}
      {user?.role === UserRole.WHOLESALE ? (
        <>
          <ProtectedRoute path="/wholesale" component={WholesaleDashboard} />
          <ProtectedRoute path="/wholesale/dashboard" component={WholesaleDashboard} />
          <ProtectedRoute path="/wholesale/orders" component={WholesaleOrders} />
          <ProtectedRoute path="/wholesale/profile" component={WholesaleProfile} />
          <ProtectedRoute path="/wholesale/checkout" component={WholesaleCheckout} />
          <ProtectedRoute path="/wholesale/earnings" component={WholesaleEarnings} />
          <Route path="/shop">
            <Redirect to="/wholesale" />
          </Route>
          <Route path="/checkout">
            <Redirect to="/wholesale/checkout" />
          </Route>
        </>
      ) : (
        <>
          <Route path="/shop" component={ShopPage} />
          <Route path="/checkout" component={CheckoutPage} />
        </>
      )}

      <Route path="/order-confirmation" component={OrderConfirmationPage} />
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
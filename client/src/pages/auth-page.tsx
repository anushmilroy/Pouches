import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserRole } from "@shared/schema";
import { Home, ShoppingBag } from "lucide-react";
import { useEffect } from "react";

const authSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["RETAIL", "WHOLESALE", "DISTRIBUTOR"]).optional(),
});

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user?.role) {
      const getRouteForRole = (role: string) => {
        switch (role) {
          case UserRole.ADMIN:
            return "/admin";
          case UserRole.RETAIL:
            return "/retail";
          case UserRole.WHOLESALE:
            return "/wholesale";
          case UserRole.DISTRIBUTOR:
            return "/distributor";
          default:
            return "/";
        }
      };
      console.log("Redirecting user with role:", user.role);
      setLocation(getRouteForRole(user.role));
    }
  }, [user, setLocation]);

  const loginForm = useForm({
    resolver: zodResolver(authSchema.omit({ role: true })),
  });

  const registerForm = useForm({
    resolver: zodResolver(authSchema),
    defaultValues: {
      role: undefined
    }
  });

  const onLogin = loginForm.handleSubmit((data) => {
    loginMutation.mutate(data);
  });

  const onRegister = registerForm.handleSubmit((data) => {
    registerMutation.mutate(data, {
      onSuccess: (response) => {
        if (data.role === UserRole.WHOLESALE) {
          setLocation("/auth/registration-success");
        }
      }
    });
  });

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <h1 className="text-xl font-bold">Pouches Worldwide</h1>
            <nav className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                className="flex items-center"
                onClick={() => setLocation("/")}
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
              <Button 
                variant="ghost"
                className="flex items-center"
                onClick={() => setLocation("/shop")}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Shop
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Pouches Worldwide</CardTitle>
              <CardDescription>Login or create an account to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={onLogin} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                        Login
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form onSubmit={onRegister} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select account type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={UserRole.RETAIL}>Retail Customer</SelectItem>
                                <SelectItem value={UserRole.WHOLESALE}>Wholesale Buyer</SelectItem>
                                <SelectItem value={UserRole.DISTRIBUTOR}>Distributor</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                        Register
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-8">
          <div className="max-w-lg text-white">
            <h1 className="text-4xl font-bold mb-4">Welcome to Pouches Worldwide</h1>
            <p className="text-lg opacity-90">
              Your one-stop destination for quality pouches. Whether you're a retail customer,
              wholesale buyer, or distributor, we've got you covered with the best products and
              competitive prices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
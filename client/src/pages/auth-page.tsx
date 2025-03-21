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
import { UserRole, WholesaleStatus } from "@shared/schema";
import { Home, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import Logo from "@/components/logo";
import { Redirect } from "wouter";

// Separate schemas for login and registration
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registrationSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["RETAIL", "WHOLESALE"]).optional(),
  referralCode: z.string().optional(),
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  companyWebsite: z.string().optional(),
});

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [showCompanyFields, setShowCompanyFields] = useState(false);

  // Redirect if already logged in
  if (user) {
    if (user.role === UserRole.WHOLESALE && user.wholesaleStatus === WholesaleStatus.PENDING) {
      return <Redirect to="/auth/registration-success" />;
    } else if (user.role === UserRole.WHOLESALE) {
      return <Redirect to="/wholesale" />;
    }
    return <Redirect to="/shop" />;
  }

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    }
  });

  const registerForm = useForm({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      role: undefined,
      referralCode: "",
      companyName: "",
      companyAddress: "",
      companyWebsite: "",
    }
  });

  const onLogin = loginForm.handleSubmit((data) => {
    loginMutation.mutate(data);
  });

  const onRegister = registerForm.handleSubmit((data) => {
    registerMutation.mutate({
      ...data,
      wholesaleStatus: data.role === UserRole.WHOLESALE ? WholesaleStatus.PENDING : undefined
    }, {
      onSuccess: () => {
        if (data.role === UserRole.WHOLESALE) {
          setLocation("/auth/registration-success");
        }
      }
    });
  });

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b py-2">
        <div className="container mx-auto px-6">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="cursor-pointer" onClick={() => setLocation("/")}>
                <Logo />
              </div>
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
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} placeholder="Enter your email address" />
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
                              onValueChange={(value) => {
                                field.onChange(value);
                                setShowCompanyFields(value === "WHOLESALE");
                              }}
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
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="referralCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Referral Code (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter referral code if you have one" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {showCompanyFields && (
                        <div className="space-y-4">
                          <FormField
                            control={registerForm.control}
                            name="companyName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="companyAddress"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company Address</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="companyWebsite"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company Website</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Company website" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

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
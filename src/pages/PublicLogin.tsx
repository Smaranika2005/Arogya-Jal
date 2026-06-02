import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, ArrowLeft, Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const PublicLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      const userId = data.user?.id;
      if (!userId) throw new Error("Authentication failed. Please try again.");

      const userMetadata = data.user?.user_metadata || {};

      let { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("name, role, municipality")
        .eq("id", userId)
        .single();

      if (profileError) {
        const fallbackRole = userMetadata.role || "public_user";
        const fallbackMunicipality = userMetadata.municipality || null;

        if (fallbackRole !== "public_user") {
          throw profileError;
        }

        const { error: upsertError } = await supabase
          .from("profiles")
          .upsert({
            id: userId,
            name: userMetadata.name || data.user.email || "Public User",
            role: fallbackRole,
            municipality: fallbackMunicipality,
          }, { onConflict: "id" });

        if (upsertError) throw upsertError;

        const refetch = await supabase
          .from("profiles")
          .select("name, role, municipality")
          .eq("id", userId)
          .single();

        profileData = refetch.data;
        profileError = refetch.error;
      }

      const profile = profileData as any;

      if (profileError) throw profileError;

      if (profile?.role !== "public_user") {
        await supabase.auth.signOut();
        throw new Error("This account is not authorized for Public User Dashboard.");
      }

      if (!profile?.municipality) {
        throw new Error("No municipality found for this account. Please update the profile.");
      }

      toast({
        title: "Welcome!",
        description: `Successfully logged in as ${profile?.name || "Public User"}`,
      });

      navigate("/public/dashboard");
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: err.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            className="absolute top-4 left-4"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          <div className="flex items-center justify-center mb-4">
            <Globe className="w-8 h-8 text-primary mr-2 pulse-health" />
            <h1 className="text-2xl font-bold text-primary">Public User Login</h1>
          </div>
          <p className="text-muted-foreground">Access municipality-level health reports</p>
        </div>

        <Card className="health-card border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Secure Access</CardTitle>
            <CardDescription>
              Enter your email and password to view your municipality dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicLogin;

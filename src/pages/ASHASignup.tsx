import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, ArrowLeft, User, Lock, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

type Municipality = {
  municipality_id: number;
  municipality_name: string;
};

const ASHASignup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "asha_worker",
    password: "",
    confirmPassword: "",
    municipalityId: "",
  });
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMuni, setIsFetchingMuni] = useState(false);

  useEffect(() => {
    const getMunicipalities = async () => {
      setIsFetchingMuni(true);
      try {
        const { data, error } = await supabase
          .from("municipalities")
          .select("*");

        if (error) throw error;
        if (data) {
          const mapped = data.map((m: any) => {
            const id = m.municipality_id !== undefined ? m.municipality_id : m.id;
            const name = m.municipality_name !== undefined ? m.municipality_name : m.name;
            return {
              municipality_id: Number(id),
              municipality_name: String(name || ""),
            };
          }).sort((a, b) => a.municipality_name.localeCompare(b.municipality_name));
          setMunicipalities(mapped);
        }
      } catch (error: any) {
        toast({
          title: "Error fetching municipalities",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsFetchingMuni(false);
      }
    };
    getMunicipalities();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Please ensure both passwords match.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (formData.role === "public_user" && !formData.municipalityId) {
      toast({
        title: "Missing Municipality",
        description: "Public users must select their municipality.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      // ✅ Sign up with email + password
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          // Pass metadata so DB trigger can seed profile with real name/role
          data: {
            name: formData.name,
            role: formData.role,
            municipality_id: formData.role === "public_user" && formData.municipalityId
              ? Number(formData.municipalityId)
              : null,
          },
        },
      });

      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("User ID not returned from Supabase.");

      // ✅ Create or update the profile row when we have an authenticated session.
      // This keeps registration resilient even if the database trigger is missing.
      if (authData.session) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: userId,
            name: formData.name,
            role: formData.role,
            municipality_id: formData.role === "public_user" && formData.municipalityId
              ? Number(formData.municipalityId)
              : null,
          }, { onConflict: "id" });

        if (profileError) {
          console.error("Profile Upsert Error:", profileError);
          throw new Error(`Profile creation failed: ${profileError.message}`);
        }

        // Double check it was created
        const { data: checkProfile } = await supabase
          .from("profiles")
          .select("id, municipality_id")
          .eq("id", userId)
          .single();

        console.log("Verified Profile in DB:", checkProfile);
      }

      // Session is persisted by Supabase; no localStorage needed

      toast({
        title: "Signup Successful 🎉",
        description: "Account created successfully. Welcome to Arogya Jal!",
      });

      if (formData.role === "asha_worker") {
        navigate("/asha/dashboard");
      } else if (formData.role === "government") {
        navigate("/gov/dashboard");
      } else if (formData.role === "public_user") {
        navigate("/public/dashboard");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      console.error("Signup Error:", err);
      toast({
        title: "Signup Failed",
        description: err.message || "Something went wrong while signing up.",
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

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      role: e.target.value,
      municipalityId: e.target.value === "public_user" ? prev.municipalityId : "",
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
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
            <Heart className="w-8 h-8 text-primary mr-2 heartbeat" />
            <h1 className="text-2xl font-bold text-primary">User Registration</h1>
          </div>
          <p className="text-muted-foreground">Create your Arogya Jal account</p>
        </div>

        {/* Signup Form */}
        <Card className="health-card border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Create Account</CardTitle>
            <CardDescription>
              Join the community health monitoring system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
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

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleRoleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="asha_worker">ASHA Worker</option>
                  <option value="government">Government Official</option>
                  <option value="public_user">Public User</option>
                </select>
              </div>

              {formData.role === "public_user" && (
                <div className="space-y-2">
                  <Label htmlFor="municipalityId">Municipality</Label>
                  <select
                    id="municipalityId"
                    name="municipalityId"
                    value={formData.municipalityId}
                    onChange={(e) => setFormData(prev => ({ ...prev, municipalityId: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                    disabled={isFetchingMuni}
                  >
                    <option value="">Select your municipality</option>
                    {municipalities.map((muni) => (
                      <option key={muni.municipality_id} value={muni.municipality_id}>
                        {muni.municipality_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ASHASignup;

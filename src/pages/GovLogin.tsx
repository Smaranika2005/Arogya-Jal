import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowLeft, User, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const GovLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Demo credentials for government officials
  const demoCredentials = [
    { username: "admin", password: "admin123", name: "District Health Officer" },
    { username: "health_dept", password: "health123", name: "Health Department Admin" },
    { username: "gov_official", password: "gov123", name: "Government Official" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Check demo credentials
    const validCredential = demoCredentials.find(
      cred => cred.username === formData.username && cred.password === formData.password
    );

    if (validCredential) {
      // Store current session
      localStorage.setItem("currentUser", JSON.stringify({
        id: "gov_" + validCredential.username,
        name: validCredential.name,
        username: validCredential.username,
        role: "government",
        loginTime: new Date().toISOString(),
      }));

      toast({
        title: "Welcome!",
        description: `Successfully logged in as ${validCredential.name}`,
      });

      navigate("/gov/dashboard");
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid username or password. Try: admin/admin123",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
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
            <Shield className="w-8 h-8 text-primary mr-2 pulse-health" />
            <h1 className="text-2xl font-bold text-primary">Government Official Login</h1>
          </div>
          <p className="text-muted-foreground">Access health monitoring dashboard</p>
        </div>

        {/* Login Form */}
        <Card className="health-card border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Secure Access</CardTitle>
            <CardDescription>
              Enter your official credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Enter your username"
                    value={formData.username}
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
                className="w-full bg-primary hover:bg-primary-dark text-primary-foreground py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            {/* Demo Credentials Info */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Demo Credentials:</h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>• admin / admin123</p>
                <p>• health_dept / health123</p>
                <p>• gov_official / gov123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GovLogin;
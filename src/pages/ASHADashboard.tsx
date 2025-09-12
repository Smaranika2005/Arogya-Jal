import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Heart, 
  LogOut, 
  Plus, 
  FileText, 
  User, 
  Calendar,
  Activity,
  MapPin,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ASHADashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [surveyStats, setSurveyStats] = useState({
    totalSurveys: 0,
    thisWeek: 0,
    thisMonth: 0,
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!user || user.role !== "asha") {
      navigate("/asha/login");
      return;
    }
    setCurrentUser(user);

    // Calculate survey statistics
    const surveys = JSON.parse(localStorage.getItem("healthSurveys") || "[]");
    const userSurveys = surveys.filter((s: any) => s.ashaWorkerId === user.id);
    
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const thisWeekSurveys = userSurveys.filter((s: any) => 
      new Date(s.createdAt) >= oneWeekAgo
    );
    const thisMonthSurveys = userSurveys.filter((s: any) => 
      new Date(s.createdAt) >= oneMonthAgo
    );

    setSurveyStats({
      totalSurveys: userSurveys.length,
      thisWeek: thisWeekSurveys.length,
      thisMonth: thisMonthSurveys.length,
    });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Heart className="w-8 h-8 text-primary heartbeat" />
              <div>
                <h1 className="text-xl font-bold text-primary">Health Monitoring System</h1>
                <p className="text-sm text-muted-foreground">ASHA Worker Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-semibold text-foreground">Hello, {currentUser.name}</p>
                <p className="text-sm text-muted-foreground">ASHA Worker</p>
              </div>
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {currentUser.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {currentUser.name}!
          </h2>
          <p className="text-lg text-muted-foreground">
            Continue monitoring community health and making a difference.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="health-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Surveys</p>
                  <p className="text-3xl font-bold text-primary">{surveyStats.totalSurveys}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="health-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Week</p>
                  <p className="text-3xl font-bold text-secondary">{surveyStats.thisWeek}</p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="health-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Month</p>
                  <p className="text-3xl font-bold text-accent">{surveyStats.thisMonth}</p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* New Survey Card */}
          <Card className="health-card border-0 hover:scale-105 transition-transform duration-300">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Create New Survey</CardTitle>
              <CardDescription>
                Collect new health data from your allocated booth and community members.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary-dark text-primary-foreground px-8 py-3 rounded-lg font-semibold transition-all duration-300"
                onClick={() => navigate("/asha/survey")}
              >
                <Activity className="w-5 h-5 mr-2" />
                Start New Survey
              </Button>
            </CardContent>
          </Card>

          {/* View Profile Card */}
          <Card className="health-card border-0 hover:scale-105 transition-transform duration-300">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-secondary" />
              </div>
              <CardTitle className="text-xl">View Profile & History</CardTitle>
              <CardDescription>
                Review your profile information and past survey submissions from the last month.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground px-8 py-3 rounded-lg font-semibold transition-all duration-300"
                onClick={() => navigate("/asha/profile")}
              >
                <User className="w-5 h-5 mr-2" />
                View Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Info */}
        <div className="mt-12 text-center">
          <Card className="health-card border-0 max-w-2xl mx-auto">
            <CardContent className="p-8">
              <div className="flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-primary mr-2" />
                <h3 className="text-xl font-semibold">Your Impact</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Your dedication to community health monitoring helps identify potential health issues early, 
                enabling faster response times and better health outcomes for your community. Every survey 
                you complete contributes to a larger picture of public health and safety.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ASHADashboard;
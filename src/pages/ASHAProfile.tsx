import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Calendar,
  FileText,
  MapPin,
  Activity,
  TrendingUp
} from "lucide-react";

interface Survey {
  id: string;
  ashaWorkerId: string;
  ashaWorkerName: string;
  surveyDate: string;
  boothNumber: string;
  symptoms: string[];
  ageGroupAffected: string;
  symptomDuration: string;
  waterBodiesCount: string;
  avgPH: string;
  avgTurbidity: string;
  createdAt: string;
}

const ASHAProfile = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userSurveys, setUserSurveys] = useState<Survey[]>([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!user || user.role !== "asha") {
      navigate("/asha/login");
      return;
    }
    setCurrentUser(user);

    // Get user's surveys from last month
    const allSurveys = JSON.parse(localStorage.getItem("healthSurveys") || "[]");
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const filteredSurveys = allSurveys
      .filter((survey: Survey) => 
        survey.ashaWorkerId === user.id && 
        new Date(survey.createdAt) >= oneMonthAgo
      )
      .sort((a: Survey, b: Survey) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    setUserSurveys(filteredSurveys);
  }, [navigate]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAgeGroupLabel = (value: string) => {
    const labels: { [key: string]: string } = {
      children: "Children (0-12 years)",
      adults: "Adults (13-60 years)",
      elderly: "Elderly (60+ years)"
    };
    return labels[value] || value;
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/asha/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-xl font-bold text-primary">Profile & History</h1>
              <p className="text-sm text-muted-foreground">Your account information and survey history</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Profile Information */}
          <Card className="health-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{currentUser.name}</h2>
                  <p className="text-muted-foreground">ASHA Worker</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-semibold">{currentUser.name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone Number</p>
                    <p className="font-semibold">{currentUser.phone}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Registered Since</p>
                    <p className="font-semibold">
                      {new Date(currentUser.registeredAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Survey Statistics */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="health-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Surveys</p>
                    <p className="text-3xl font-bold text-primary">{userSurveys.length}</p>
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
                    <p className="text-sm font-medium text-muted-foreground">Unique Booths</p>
                    <p className="text-3xl font-bold text-secondary">
                      {new Set(userSurveys.map(s => s.boothNumber)).size}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="health-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg. per Week</p>
                    <p className="text-3xl font-bold text-accent">
                      {Math.round((userSurveys.length / 4) * 10) / 10}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Survey History */}
          <Card className="health-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Survey History (Last Month)
              </CardTitle>
              <CardDescription>
                Your recent health monitoring surveys and submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userSurveys.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Surveys Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't submitted any surveys in the last month.
                  </p>
                  <Button
                    onClick={() => navigate("/asha/survey")}
                    className="bg-primary hover:bg-primary-dark"
                  >
                    Create Your First Survey
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {userSurveys.map((survey) => (
                    <div key={survey.id} className="border rounded-lg p-6 hover:bg-muted/20 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-lg">
                            Survey - Booth {survey.boothNumber}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Submitted on {formatDate(survey.createdAt)}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-primary border-primary">
                          {survey.surveyDate}
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium mb-1">Reported Symptoms:</p>
                          <div className="flex flex-wrap gap-1">
                            {survey.symptoms.map((symptom) => (
                              <Badge key={symptom} variant="secondary" className="text-xs">
                                {symptom}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="font-medium mb-1">Age Group Affected:</p>
                          <p className="text-muted-foreground">
                            {getAgeGroupLabel(survey.ageGroupAffected)}
                          </p>
                        </div>

                        <div>
                          <p className="font-medium mb-1">Symptom Duration:</p>
                          <p className="text-muted-foreground">{survey.symptomDuration}</p>
                        </div>

                        <div>
                          <p className="font-medium mb-1">Water Quality:</p>
                          <p className="text-muted-foreground">
                            {survey.waterBodiesCount} bodies, pH: {survey.avgPH}, 
                            Turbidity: {survey.avgTurbidity} NTU
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ASHAProfile;
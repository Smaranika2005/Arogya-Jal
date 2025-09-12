import { useState, useEffect } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  LogOut, 
  FileText, 
  Users, 
  TrendingUp,
  AlertTriangle,
  Download,
  BarChart3,
  Activity,
  Droplets
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';

const GovDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [surveyData, setSurveyData] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalSurveys: 0,
    totalWorkers: 0,
    recentSurveys: 0,
    criticalAlerts: 0,
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!user || user.role !== "government") {
      navigate("/gov/login");
      return;
    }
    setCurrentUser(user);

    // Load all survey data
    const surveys = JSON.parse(localStorage.getItem("healthSurveys") || "[]");
    const workers = JSON.parse(localStorage.getItem("ashaWorkers") || "[]");
    
    // Calculate dashboard statistics
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentSurveys = surveys.filter((s: any) => 
      new Date(s.createdAt) >= oneWeekAgo
    );

    setDashboardStats({
      totalSurveys: surveys.length,
      totalWorkers: workers.length,
      recentSurveys: recentSurveys.length,
      criticalAlerts: surveys.filter((s: any) => 
        s.symptoms.includes("Diarrhoea") && s.symptoms.includes("Vomiting")
      ).length,
    });

    setSurveyData(surveys);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  // Prepare chart data
  const symptomData = React.useMemo(() => {
    const symptomCounts: { [key: string]: number } = {};
    surveyData.forEach((survey: any) => {
      survey.symptoms.forEach((symptom: string) => {
        symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
      });
    });
    
    return Object.entries(symptomCounts).map(([symptom, count]) => ({
      symptom: symptom.replace(/\//g, '/'),
      count
    }));
  }, [surveyData]);

  const ageGroupData = React.useMemo(() => {
    const ageCounts: { [key: string]: number } = {};
    surveyData.forEach((survey: any) => {
      const group = survey.ageGroupAffected;
      ageCounts[group] = (ageCounts[group] || 0) + 1;
    });

    const labels: { [key: string]: string } = {
      children: "Children",
      adults: "Adults",
      elderly: "Elderly"
    };

    return Object.entries(ageCounts).map(([group, count]) => ({
      group: labels[group] || group,
      count,
      fill: group === 'children' ? '#0ea5e9' : group === 'adults' ? '#10b981' : '#f59e0b'
    }));
  }, [surveyData]);

  const waterQualityData = React.useMemo(() => {
    return surveyData.map((survey: any, index: number) => ({
      survey: `S${index + 1}`,
      pH: parseFloat(survey.avgPH) || 0,
      turbidity: parseFloat(survey.avgTurbidity) || 0,
    }));
  }, [surveyData]);

  const downloadReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      summary: dashboardStats,
      surveys: surveyData,
      symptomDistribution: symptomData,
      ageGroupDistribution: ageGroupData,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `health-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report Downloaded",
      description: "Health monitoring report has been downloaded successfully.",
    });
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
              <Shield className="w-8 h-8 text-primary pulse-health" />
              <div>
                <h1 className="text-xl font-bold text-primary">Government Dashboard</h1>
                <p className="text-sm text-muted-foreground">Health Monitoring System</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={downloadReport}
                className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
              
              <div className="text-right">
                <p className="font-semibold text-foreground">{currentUser.name}</p>
                <p className="text-sm text-muted-foreground">Government Official</p>
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
        {/* Overview Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="health-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Surveys</p>
                  <p className="text-3xl font-bold text-primary">{dashboardStats.totalSurveys}</p>
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
                  <p className="text-sm font-medium text-muted-foreground">ASHA Workers</p>
                  <p className="text-3xl font-bold text-secondary">{dashboardStats.totalWorkers}</p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="health-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Week</p>
                  <p className="text-3xl font-bold text-accent">{dashboardStats.recentSurveys}</p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="health-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Critical Alerts</p>
                  <p className="text-3xl font-bold text-destructive">{dashboardStats.criticalAlerts}</p>
                </div>
                <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Symptom Distribution */}
          <Card className="health-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Symptom Distribution
              </CardTitle>
              <CardDescription>
                Frequency of reported symptoms across all surveys
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={symptomData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="symptom" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Age Group Distribution */}
          <Card className="health-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Age Group Distribution
              </CardTitle>
              <CardDescription>
                Most affected age groups in the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ageGroupData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="count"
                    label={({ group, count }) => `${group}: ${count}`}
                  >
                    {ageGroupData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Water Quality Chart */}
        <Card className="health-card border-0 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Droplets className="w-5 h-5 mr-2" />
              Water Quality Monitoring
            </CardTitle>
            <CardDescription>
              pH and Turbidity levels across survey locations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={waterQualityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="survey" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="pH" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="pH Level"
                />
                <Line 
                  type="monotone" 
                  dataKey="turbidity" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  name="Turbidity (NTU)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Surveys Table */}
        <Card className="health-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Recent Survey Submissions
            </CardTitle>
            <CardDescription>
              Latest health surveys submitted by ASHA workers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {surveyData.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Survey Data</h3>
                <p className="text-muted-foreground">
                  No surveys have been submitted yet. Data will appear here once ASHA workers start submitting surveys.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {surveyData.slice(0, 5).map((survey: any) => (
                  <div key={survey.id} className="border rounded-lg p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">
                          Booth {survey.boothNumber} - {survey.ashaWorkerName}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(survey.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {survey.symptoms.length} symptoms
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {survey.symptoms.slice(0, 3).map((symptom: string) => (
                        <Badge key={symptom} variant="secondary" className="text-xs">
                          {symptom}
                        </Badge>
                      ))}
                      {survey.symptoms.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{survey.symptoms.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GovDashboard;
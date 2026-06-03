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
  TrendingUp,
  Pencil
} from "lucide-react";
import { getMySurveys } from "@/services/surveys";
import { supabase } from "@/lib/supabase";

interface SurveyRow {
  id: string;
  user_id: string;
  date_of_survey: string;
  booth_no: string;
  total_people?: number;
  survey_data: any;
  created_at: string;
}

const ASHAProfile = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userSurveys, setUserSurveys] = useState<SurveyRow[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/asha/login');
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (!profile || profile.role !== 'asha_worker') {
        navigate('/asha/login');
        return;
      }
      setCurrentUser({ id: user.id, name: profile.name, role: profile.role });

      try {
        const data = await getMySurveys(user.id);
        setUserSurveys(data as SurveyRow[]);
      } catch (error) {
        // ignore
      }
    })();
  }, [navigate]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSurveyTotalPeople = (survey: SurveyRow) => Number(survey.total_people || survey.survey_data?.totalPeopleSurveyed || 0);

  const toDisplayPercentage = (survey: SurveyRow, value: number) => {
    const numericValue = Number(value) || 0;
    if (survey.survey_data?.surveyValueFormat === 'percentage') {
      return numericValue;
    }

    const totalPeople = getSurveyTotalPeople(survey);
    if (!totalPeople) {
      return 0;
    }

    return Number(((numericValue / totalPeople) * 100).toFixed(2));
  };

  const getAgeGroupSummary = (survey: SurveyRow) => {
    const a = survey.survey_data?.ageGroups || {};
    return `Children: ${toDisplayPercentage(survey, a.children0to12 || 0)}%, Adults: ${toDisplayPercentage(survey, a.adults13to60 || 0)}%, Elderly: ${toDisplayPercentage(survey, a.elderly60plus || 0)}%`;
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
                {/* <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-semibold">{currentUser.name}</p>
                  </div>
                </div> */}

                {/* <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone Number</p>
                    <p className="font-semibold">{currentUser.phone}</p>
                  </div>
                </div> */}

                {/* <div className="flex items-center space-x-3">
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
                </div> */}
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
                      {new Set(userSurveys.map(s => s.booth_no)).size}
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
                Survey History
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
                            Survey - Booth {survey.booth_no}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Submitted on {formatDate(survey.created_at)}
                          </p>
                        </div>
                        <Button 
                           size="sm" 
                           variant="outline" 
                           onClick={() => navigate(`/asha/survey/${survey.id}`)}
                           className="flex items-center space-x-1 hover:text-primary border-primary/20 hover:border-primary"
                         >
                           <Pencil className="w-3.5 h-3.5" />
                           <span>Edit</span>
                         </Button>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium mb-1">Reported Symptoms:</p>
                          <p className="text-muted-foreground">
                            D:{toDisplayPercentage(survey, survey.survey_data?.symptoms?.diarrhoea || 0)}%, Ab:{toDisplayPercentage(survey, survey.survey_data?.symptoms?.abdominalPain || 0)}%, Dw:{toDisplayPercentage(survey, survey.survey_data?.symptoms?.dehydrationWeakness || 0)}%, V:{toDisplayPercentage(survey, survey.survey_data?.symptoms?.vomiting || 0)}%, F:{toDisplayPercentage(survey, survey.survey_data?.symptoms?.fever || 0)}%, SR:{toDisplayPercentage(survey, survey.survey_data?.symptoms?.skinRashes || 0)}%
                          </p>
                        </div>

                        <div>
                          <p className="font-medium mb-1">Age Group Affected:</p>
                          <p className="text-muted-foreground">{getAgeGroupSummary(survey)}</p>
                        </div>

                        <div>
                          <p className="font-medium mb-1">Symptom Duration:</p>
                          <p className="text-muted-foreground">{survey.survey_data?.avgSymptomDuration}</p>
                        </div>

                        <div>
                          <p className="font-medium mb-1">Water Quality:</p>
                          <p className="text-muted-foreground">
                            {survey.survey_data?.numberOfWaterBodies || 0} bodies, pH: {survey.survey_data?.avgPH || 0}, 
                            Turbidity: {survey.survey_data?.avgTurbidity || 0} NTU, Temp: {survey.survey_data?.avgTemperature || 0} °C
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
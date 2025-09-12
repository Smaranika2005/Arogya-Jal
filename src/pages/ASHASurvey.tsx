import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Save, MapPin, Thermometer, Droplets } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ASHASurvey = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    surveyDate: new Date().toISOString().split('T')[0],
    boothNumber: "",
    symptoms: [] as string[],
    ageGroupAffected: "",
    symptomDuration: "",
    waterBodiesCount: "",
    avgPH: "",
    avgTurbidity: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const symptomOptions = [
    "Diarrhoea",
    "Vomiting", 
    "Abdominal Pain",
    "Fever",
    "Dehydration/Weakness",
    "Skin Rashes"
  ];

  const ageGroupOptions = [
    { value: "children", label: "Children (0-12 years)" },
    { value: "adults", label: "Adults (13-60 years)" },
    { value: "elderly", label: "Elderly (60+ years)" },
  ];

  const handleSymptomChange = (symptom: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      symptoms: checked 
        ? [...prev.symptoms, symptom]
        : prev.symptoms.filter(s => s !== symptom)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (formData.symptoms.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select at least one symptom or indication.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!formData.ageGroupAffected) {
      toast({
        title: "Missing Information", 
        description: "Please select the age group mostly affected.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Get current user
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!currentUser) {
      navigate("/asha/login");
      return;
    }

    // Create survey entry
    const surveyEntry = {
      id: Date.now().toString(),
      ashaWorkerId: currentUser.id,
      ashaWorkerName: currentUser.name,
      ...formData,
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage
    const existingSurveys = JSON.parse(localStorage.getItem("healthSurveys") || "[]");
    const updatedSurveys = [...existingSurveys, surveyEntry];
    localStorage.setItem("healthSurveys", JSON.stringify(updatedSurveys));

    toast({
      title: "Survey Submitted Successfully!",
      description: "Your health monitoring data has been recorded.",
    });

    navigate("/asha/dashboard");
    setIsLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

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
              <h1 className="text-xl font-bold text-primary">Health Survey Form</h1>
              <p className="text-sm text-muted-foreground">Community Health Data Collection</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="container mx-auto px-4 py-8">
        <Card className="health-card border-0 max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Health Monitoring Survey</CardTitle>
            <CardDescription>
              Please fill out all sections accurately to help monitor community health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="surveyDate">Date of Survey</Label>
                    <Input
                      id="surveyDate"
                      name="surveyDate"
                      type="date"
                      value={formData.surveyDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="boothNumber">Allocated Booth No.</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="boothNumber"
                        name="boothNumber"
                        type="text"
                        placeholder="Enter booth number"
                        value={formData.boothNumber}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Symptoms Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Reported Symptoms</h3>
                <p className="text-sm text-muted-foreground">Select all symptoms reported in your area:</p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {symptomOptions.map((symptom) => (
                    <div key={symptom} className="flex items-center space-x-2">
                      <Checkbox
                        id={symptom}
                        checked={formData.symptoms.includes(symptom)}
                        onCheckedChange={(checked) => handleSymptomChange(symptom, checked as boolean)}
                      />
                      <Label htmlFor={symptom} className="cursor-pointer">
                        {symptom}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Age Groups */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Age Groups Mostly Affected</h3>
                
                <RadioGroup
                  value={formData.ageGroupAffected}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, ageGroupAffected: value }))}
                >
                  {ageGroupOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Additional Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Additional Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="symptomDuration">Duration of Symptom (in days)</Label>
                  <Input
                    id="symptomDuration"
                    name="symptomDuration"
                    type="text"
                    placeholder="e.g., 3-5 days, 1 week, etc."
                    value={formData.symptomDuration}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {/* Water Quality Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Water Quality Assessment</h3>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="waterBodiesCount">No. of Water Bodies in Booth</Label>
                    <div className="relative">
                      <Droplets className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="waterBodiesCount"
                        name="waterBodiesCount"
                        type="number"
                        placeholder="Count"
                        value={formData.waterBodiesCount}
                        onChange={handleInputChange}
                        className="pl-10"
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avgPH">Average pH of Water Bodies</Label>
                    <div className="relative">
                      <Thermometer className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="avgPH"
                        name="avgPH"
                        type="number"
                        step="0.1"
                        placeholder="pH value"
                        value={formData.avgPH}
                        onChange={handleInputChange}
                        className="pl-10"
                        min="0"
                        max="14"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avgTurbidity">Average Turbidity (NTU)</Label>
                    <div className="relative">
                      <Droplets className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="avgTurbidity"
                        name="avgTurbidity"
                        type="number"
                        step="0.1"
                        placeholder="NTU value"
                        value={formData.avgTurbidity}
                        onChange={handleInputChange}
                        className="pl-10"
                        min="0"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <Button
                  type="submit"
                  size="lg"
                  className="bg-primary hover:bg-primary-dark text-primary-foreground px-12 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
                  disabled={isLoading}
                >
                  {isLoading ? "Submitting..." : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Submit Survey
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ASHASurvey;
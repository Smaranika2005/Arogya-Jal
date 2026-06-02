import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, MapPin, Thermometer, Droplets } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createSurvey, denormalizeSurveyForForm, getSurveyById, updateSurvey, type SurveyFormData } from "@/services/surveys";
import { supabase } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchMunicipalities } from "@/services/arogya-api";

type MunicipalityOption = {
  id: number;
  name: string;
};

const ASHASurvey = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const today = new Date().toISOString().split('T')[0];
  const [municipalities, setMunicipalities] = useState<MunicipalityOption[]>([]);
  const [formData, setFormData] = useState<SurveyFormData>({
    surveyDate: today,
    pincode: "",
    municipality: "",
    wardNo: "",
    boothNo: "",
    totalPeopleSurveyed: 0,
    symptoms: {
      diarrhoea: 0,
      abdominalPain: 0,
      dehydrationWeakness: 0,
      vomiting: 0,
      fever: 0,
      skinRashes: 0,
    },
    ageGroups: {
      children0to12: 0,
      adults13to60: 0,
      elderly60plus: 0,
    },
    avgSymptomDuration: "",
    numberOfWaterBodies: 0,
    avgPH: 0,
    avgTurbidity: 0,
    avgTemperature: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

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
    })();
  }, [navigate]);

  useEffect(() => {
    if (!id) {
      setFormData((prev) => ({ ...prev, surveyDate: today }));
    }
  }, [id, today]);

  useEffect(() => {
    const loadMunicipalities = async () => {
      if (!currentUser) return;
      try {
        const data = await fetchMunicipalities();
        setMunicipalities(data);
      } catch (error: any) {
        toast({ title: "Unable to load municipalities", description: error.message, variant: "destructive" });
      }
    };

    loadMunicipalities();
  }, [currentUser, toast]);

  useEffect(() => {
    const loadExisting = async () => {
      if (!id) return;
      try {
        if (!currentUser) return;
        const data = await getSurveyById(id, currentUser.id);
        if (data?.survey_data) {
          setFormData(denormalizeSurveyForForm(data.survey_data));
        }
      } catch (error: any) {
        toast({ title: "Unable to load survey", description: error.message, variant: "destructive" });
      }
    };
    loadExisting();
  }, [id, toast, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Basic validation
    if (!formData.pincode || !formData.municipality || !formData.wardNo || !formData.boothNo) {
      toast({ title: "Missing fields", description: "Fill general information fields.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if (!currentUser) {
      navigate('/asha/login');
      return;
    }

    try {
      if (id) {
        await updateSurvey(id, currentUser.id, formData);
      } else {
        await createSurvey(currentUser.id, formData);
      }
      toast({
        title: id ? "Survey updated" : "Survey submitted",
        description: "Your health monitoring data has been saved.",
      });
      navigate("/asha/profile");
    } catch (error: any) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    let { value } = e.target;

    // Allow only digits for specific fields
    if (name === 'pincode' || name === 'wardNo' || name === 'boothNo' || name === 'totalPeopleSurveyed') {
      value = value.replace(/\D/g, '');
    }

    setFormData(prev => ({
      ...prev,
      // Keep pincode/wardNo/boothNo as strings even if input type is number
      [name]: (name === 'pincode' || name === 'wardNo' || name === 'boothNo')
        ? value
        : (e.target.type === 'number' ? Number(value) : value),
    }));
  };

  const handleNestedNumberChange = (path: 'symptoms' | 'ageGroups', key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value || 0);
    setFormData(prev => ({
      ...prev,
      [path]: { ...prev[path], [key]: value },
    }));
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
            <CardTitle className="text-2xl">{id ? 'Edit Survey' : 'Health Monitoring Survey'}</CardTitle>
            <CardDescription>
              Please fill out all sections accurately to help monitor community health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* General Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">General Information</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="surveyDate">Date of Survey</Label>
                    <Input
                      id="surveyDate"
                      name="surveyDate"
                      type="date"
                      value={formData.surveyDate}
                      readOnly
                    />
                    <p className="text-xs text-muted-foreground">Filled automatically by the system.</p>
                  </div>
                  
                  {/* Pincode */}
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="pincode"
                        name="pincode"
                        type="number"
                        placeholder="Enter pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        inputMode="numeric"
                        className="pl-10 no-spinner"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Municipality */}
                  <div className="space-y-2">
                    <Label htmlFor="municipality">Municipality Name</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                      <Select
                        name="municipality"
                        value={formData.municipality}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, municipality: value }))}
                        required
                      >
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Select municipality name" />
                        </SelectTrigger>
                        <SelectContent>
                          {municipalities.map((municipality, index) => (
                            <SelectItem
                              key={`${municipality.id}-${index}`}
                              value={municipality.name}
                            >
                              {municipality.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Ward No */}
                  <div className="space-y-2">
                    <Label htmlFor="wardNo">Ward No.</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="wardNo"
                        name="wardNo"
                        type="number"
                        placeholder="Ward number"
                        value={formData.wardNo}
                        onChange={handleInputChange}
                        inputMode="numeric"
                        className="pl-10 no-spinner"
                        required
                      />
                    </div>
                  </div>
                  {/* Booth No */}
                  <div className="space-y-2">
                    <Label htmlFor="boothNo">Booth No.</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="boothNo"
                        name="boothNo"
                        type="number"
                        placeholder="Booth number"
                        value={formData.boothNo}
                        onChange={handleInputChange}
                        inputMode="numeric"
                        className="pl-10 no-spinner"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Survey Data */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold border-b pb-2">Survey Data</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="totalPeopleSurveyed">Total Number of People Surveyed</Label>
                      <Input
                        id="totalPeopleSurveyed"
                        name="totalPeopleSurveyed"
                          type="number"
                          min={0}
                          placeholder="Enter number of people surveyed"
                        value={formData.totalPeopleSurveyed}
                        onChange={handleInputChange}
                          inputMode="numeric"
                      />
                    
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="symptoms.diarrhoea">Diarrhoea</Label>
                      <Input id="symptoms.diarrhoea" type="number" min={0} placeholder="Number affected" value={formData.symptoms.diarrhoea} onChange={handleNestedNumberChange('symptoms','diarrhoea')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="symptoms.abdominalPain">Abdominal Pain</Label>
                      <Input id="symptoms.abdominalPain" type="number" min={0} placeholder="Number affected" value={formData.symptoms.abdominalPain} onChange={handleNestedNumberChange('symptoms','abdominalPain')} />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="symptoms.dehydrationWeakness">Dehydration</Label>
                      <Input id="symptoms.dehydrationWeakness" type="number" min={0} placeholder="Number affected" value={formData.symptoms.dehydrationWeakness} onChange={handleNestedNumberChange('symptoms','dehydrationWeakness')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="symptoms.vomiting">Vomiting</Label>
                      <Input id="symptoms.vomiting" type="number" min={0} placeholder="Number affected" value={formData.symptoms.vomiting} onChange={handleNestedNumberChange('symptoms','vomiting')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="symptoms.fever">Fever</Label>
                      <Input id="symptoms.fever" type="number" min={0} placeholder="Number affected" value={formData.symptoms.fever} onChange={handleNestedNumberChange('symptoms','fever')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="symptoms.skinRashes">Skin Rashes</Label>
                      <Input id="symptoms.skinRashes" type="number" min={0} placeholder="Number affected" value={formData.symptoms.skinRashes} onChange={handleNestedNumberChange('symptoms','skinRashes')} />
                  </div>
                </div>
              </div>

              {/* Age Group Affected */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Age Group Affected</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ageGroups.children0to12">Children (0–12 years)</Label>
                    <Input id="ageGroups.children0to12" type="number" min={0} value={formData.ageGroups.children0to12} onChange={handleNestedNumberChange('ageGroups','children0to12')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ageGroups.adults13to60">Adults (13–60 years)</Label>
                    <Input id="ageGroups.adults13to60" type="number" min={0} value={formData.ageGroups.adults13to60} onChange={handleNestedNumberChange('ageGroups','adults13to60')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ageGroups.elderly60plus">Citizens / Elderly (60+ years)</Label>
                    <Input id="ageGroups.elderly60plus" type="number" min={0} value={formData.ageGroups.elderly60plus} onChange={handleNestedNumberChange('ageGroups','elderly60plus')} />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Additional Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="avgSymptomDuration">Average Duration of Symptoms</Label>
                  <Input
                    id="avgSymptomDuration"
                    name="avgSymptomDuration"
                    type="text"
                    placeholder="e.g., 3-5 days"
                    value={formData.avgSymptomDuration}
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
                    <Label htmlFor="numberOfWaterBodies">Number of Water Bodies</Label>
                    <div className="relative">
                      <Droplets className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="numberOfWaterBodies"
                        name="numberOfWaterBodies"
                        type="number"
                        min={0}
                        placeholder="Count"
                        value={formData.numberOfWaterBodies}
                        onChange={handleInputChange}
                        className="pl-10"
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
                        min={0}
                        step="0.1"
                        placeholder="pH value"
                        value={formData.avgPH}
                        onChange={handleInputChange}
                        className="pl-10"
                        
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
                        min={0}
                        step="0.1"
                        placeholder="NTU value"
                        value={formData.avgTurbidity}
                        onChange={handleInputChange}
                        className="pl-10"
                       
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avgTemperature">Average Temperature (°C)</Label>
                    <div className="relative">
                      <Thermometer className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="avgTemperature"
                        name="avgTemperature"
                        type="number"
                        step="0.1"
                        placeholder="Temperature"
                        value={formData.avgTemperature}
                        onChange={handleInputChange}
                        className="pl-10"
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
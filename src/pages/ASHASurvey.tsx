import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, MapPin, Thermometer, Droplets, Plus, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createSurvey, getSurveyById, updateSurvey, type SurveyFormData, type WaterBodyAssessment } from "@/services/surveys";
import { supabase } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type MunicipalityOption = {
  id: number;
  name: string;
};

const FALLBACK_WATER_BODIES: Record<number, { wid: number; wname: string; municipality_id: number }[]> = {
  1: [
    { wid: 1, wname: 'Rabindra Sarobar Lake', municipality_id: 1 },
    { wid: 2, wname: 'Subhash Sarobar Lake', municipality_id: 1 },
    { wid: 3, wname: 'East Kolkata Wetlands', municipality_id: 1 },
    { wid: 13, wname: 'Hooghly River Point', municipality_id: 1 }
  ],
  2: [
    { wid: 7, wname: 'Amrita Bandh', municipality_id: 2 }
  ],
  3: [
    { wid: 5, wname: 'Mirik Lake', municipality_id: 3 },
    { wid: 6, wname: 'Senchal Lake', municipality_id: 3 }
  ],
  4: [
    { wid: 11, wname: 'Durgapur Barrage Lake', municipality_id: 4 },
    { wid: 12, wname: 'Troika Park Lake', municipality_id: 4 }
  ],
  5: [
    { wid: 14, wname: 'Lal Dighi Pond', municipality_id: 5 },
    { wid: 15, wname: 'Hooghly River Bank', municipality_id: 5 }
  ],
  6: [
    { wid: 4, wname: 'Santragachi Jheel', municipality_id: 6 }
  ],
  7: [
    { wid: 16, wname: 'Salt Lake Central Park Lake', municipality_id: 7 },
    { wid: 17, wname: 'Nalban Lake', municipality_id: 7 }
  ],
  8: [
    { wid: 8, wname: 'Kalyani Lake Park', municipality_id: 8 }
  ],
  9: [
    { wid: 9, wname: 'Barasat Dighi', municipality_id: 9 }
  ],
  10: [
    { wid: 10, wname: 'Bally Khal Point', municipality_id: 10 }
  ]
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
  const isSubmitting = useRef(false);

  // New states for Water Quality Assessment
  const [waterBodiesList, setWaterBodiesList] = useState<any[]>([]);
  const [maxWaterBodiesCount, setMaxWaterBodiesCount] = useState<number>(0);
  const [waterBodyAssessments, setWaterBodyAssessments] = useState<WaterBodyAssessment[]>([]);
  const [collapsedCards, setCollapsedCards] = useState<Record<number, boolean>>({});
  const [waterBodiesLimitError, setWaterBodiesLimitError] = useState<string>("");
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState<number | null>(null);

  // Sync selected municipality ID based on name or when municipalities list is loaded
  useEffect(() => {
    if (formData.municipality && municipalities.length > 0) {
      const muni = municipalities.find(m => m.name === formData.municipality);
      if (muni) {
        setSelectedMunicipalityId(muni.id);
      }
    } else {
      setSelectedMunicipalityId(null);
    }
  }, [formData.municipality, municipalities]);

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
        const { data, error } = await supabase
          .from("municipalities")
          .select("municipality_id, municipality_name");

        if (error) throw error;

        const mappedData = (data || []).map((m: any) => ({
          id: Number(m.municipality_id),
          name: m.municipality_name || "",
        }));

        setMunicipalities(mappedData);
      } catch (error: any) {
        toast({ title: "Unable to load municipalities", description: error.message, variant: "destructive" });
      }
    };

    loadMunicipalities();
  }, [currentUser, toast]);

  // Fetch water bodies dynamically when municipality ID changes
  useEffect(() => {
    const fetchWaterBodiesForMuni = async () => {
      if (!selectedMunicipalityId) {
        setWaterBodiesList([]);
        setMaxWaterBodiesCount(0);
        return;
      }

      console.log("fetchWaterBodiesForMuni: Querying all water_bodies and filtering for municipality_id =", selectedMunicipalityId);
      try {
        const { data, error } = await supabase
          .from('water_bodies')
          .select('wid, wname, municipality_id');

        if (error) throw error;

        let allBodies = data || [];
        console.log("fetchWaterBodiesForMuni: All water bodies in DB =", allBodies);

        let list = allBodies.filter(wb => Number(wb.municipality_id) === Number(selectedMunicipalityId));
        if (list.length === 0) {
          console.log("fetchWaterBodiesForMuni: No remote records found, using fallback water bodies for municipality:", selectedMunicipalityId);
          list = FALLBACK_WATER_BODIES[Number(selectedMunicipalityId)] || [];
        }
        console.log("fetchWaterBodiesForMuni: Filtered water bodies for this municipality =", list);

        setWaterBodiesList(list);
        setMaxWaterBodiesCount(list.length);
      } catch (err: any) {
        console.error("fetchWaterBodiesForMuni: Error fetching water bodies", err);
        toast({
          title: "Error fetching water bodies",
          description: err.message,
          variant: "destructive"
        });
      }
    };

    fetchWaterBodiesForMuni();
  }, [selectedMunicipalityId, toast]);

  useEffect(() => {
    const loadExisting = async () => {
      if (!id) return;
      try {
        if (!currentUser) return;
        const data = await getSurveyById(id, currentUser.id);
        if (data?.survey_data) {
          const formVal = data.survey_data;
          setFormData(formVal);
          if (formVal.waterBodyAssessments) {
            setWaterBodyAssessments(formVal.waterBodyAssessments);
          }
        }
      } catch (error: any) {
        toast({ title: "Unable to load survey", description: error.message, variant: "destructive" });
      }
    };
    loadExisting();
  }, [id, toast, currentUser]);

  // Card helpers
  const addWaterBodyAssessment = () => {
    if (!formData.municipality) {
      toast({
        title: "Municipality required",
        description: "Please select a municipality before adding water bodies.",
        variant: "destructive"
      });
      return;
    }

    const limit = Number(formData.numberOfWaterBodies) || 0;
    if (limit <= 0) {
      toast({
        title: "Number of Water Bodies required",
        description: "Please specify a Number of Water Bodies greater than 0 before adding cards.",
        variant: "destructive"
      });
      return;
    }

    if (waterBodyAssessments.length >= limit) {
      setWaterBodiesLimitError(`Cannot add more cards than the specified Number of Water Bodies (${limit}).`);
      toast({
        title: "Limit reached",
        description: `Cannot add more cards than the specified Number of Water Bodies (${limit}).`,
        variant: "destructive"
      });
      return;
    }

    setWaterBodiesLimitError("");
    setWaterBodyAssessments(prev => [
      ...prev,
      { wid: 0, ph: "", turbidity: "", tds: "", rank: prev.length + 1 }
    ]);
  };

  const removeWaterBodyAssessment = (index: number) => {
    setWaterBodyAssessments(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      // Re-assign ranks based on new order
      return filtered.map((item, i) => ({ ...item, rank: i + 1 }));
    });
    setWaterBodiesLimitError("");
  };

  const handleCardFieldChange = (index: number, field: keyof WaterBodyAssessment, value: any) => {
    setWaterBodyAssessments(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const toggleCollapse = (index: number) => {
    setCollapsedCards(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const getAvailableWaterBodies = (currentIndex: number) => {
    const selectedWids = waterBodyAssessments
      .map((item, idx) => idx !== currentIndex ? item.wid : 0)
      .filter(Boolean);
    return waterBodiesList.filter(wb => !selectedWids.includes(wb.wid));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setIsLoading(true);

    const resetSubmission = () => {
      setIsLoading(false);
      isSubmitting.current = false;
    };

    // Basic validation
    if (!formData.pincode || !formData.municipality || !formData.wardNo || !formData.boothNo) {
      toast({ title: "Missing fields", description: "Fill general information fields.", variant: "destructive" });
      resetSubmission();
      return;
    }

    // Number of water bodies validation
    if (formData.numberOfWaterBodies === undefined || formData.numberOfWaterBodies === null || formData.numberOfWaterBodies === '') {
      toast({ title: "Validation Error", description: "Number of Water Bodies is required.", variant: "destructive" });
      resetSubmission();
      return;
    }

    const numWaterBodies = Number(formData.numberOfWaterBodies);
    if (numWaterBodies < 0 || numWaterBodies > maxWaterBodiesCount) {
      toast({
        title: "Validation Error",
        description: `Number of Water Bodies must be between 0 and ${maxWaterBodiesCount} (total available for this municipality).`,
        variant: "destructive"
      });
      resetSubmission();
      return;
    }

    if (waterBodyAssessments.length > numWaterBodies) {
      toast({
        title: "Validation Error",
        description: `You have added more cards (${waterBodyAssessments.length}) than the specified Number of Water Bodies (${numWaterBodies}).`,
        variant: "destructive"
      });
      resetSubmission();
      return;
    }

    // Validate each card
    for (let i = 0; i < waterBodyAssessments.length; i++) {
      const card = waterBodyAssessments[i];
      if (!card.wid || card.wid <= 0) {
        toast({ title: "Validation Error", description: `Please select a water body for Water Body ${i + 1}.`, variant: "destructive" });
        resetSubmission();
        return;
      }

      const phVal = parseFloat(card.ph);
      if (isNaN(phVal) || phVal < 0 || phVal > 14) {
        toast({ title: "Validation Error", description: `pH for Water Body ${i + 1} must be a number between 0 and 14.`, variant: "destructive" });
        resetSubmission();
        return;
      }

      const turbVal = parseFloat(card.turbidity);
      if (isNaN(turbVal) || turbVal <= 0) {
        toast({ title: "Validation Error", description: `Turbidity for Water Body ${i + 1} must be a positive number.`, variant: "destructive" });
        resetSubmission();
        return;
      }

      const tdsVal = parseFloat(card.tds);
      if (isNaN(tdsVal) || tdsVal <= 0) {
        toast({ title: "Validation Error", description: `TDS for Water Body ${i + 1} must be a positive number.`, variant: "destructive" });
        resetSubmission();
        return;
      }
    }

    if (!currentUser) {
      navigate('/asha/login');
      resetSubmission();
      return;
    }

    try {
      const payload = {
        ...formData,
        waterBodyAssessments
      };

      if (id) {
        await updateSurvey(id, currentUser.id, payload);
      } else {
        await createSurvey(currentUser.id, payload);
      }
      toast({
        title: id ? "Survey updated" : "Survey submitted",
        description: "Your health monitoring data has been saved.",
      });
      navigate("/asha/profile");
    } catch (error: any) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      resetSubmission();
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
        : (e.target.type === 'number' ? (value === '' ? '' : Number(value)) : value),
    }));
  };

  const handleNestedNumberChange = (path: 'symptoms' | 'ageGroups', key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? '' : Number(e.target.value);
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
                    <Input id="symptoms.diarrhoea" type="number" min={0} placeholder="Number affected" value={formData.symptoms.diarrhoea} onChange={handleNestedNumberChange('symptoms', 'diarrhoea')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="symptoms.abdominalPain">Abdominal Pain</Label>
                    <Input id="symptoms.abdominalPain" type="number" min={0} placeholder="Number affected" value={formData.symptoms.abdominalPain} onChange={handleNestedNumberChange('symptoms', 'abdominalPain')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="symptoms.dehydrationWeakness">Dehydration</Label>
                    <Input id="symptoms.dehydrationWeakness" type="number" min={0} placeholder="Number affected" value={formData.symptoms.dehydrationWeakness} onChange={handleNestedNumberChange('symptoms', 'dehydrationWeakness')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="symptoms.vomiting">Vomiting</Label>
                    <Input id="symptoms.vomiting" type="number" min={0} placeholder="Number affected" value={formData.symptoms.vomiting} onChange={handleNestedNumberChange('symptoms', 'vomiting')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="symptoms.fever">Fever</Label>
                    <Input id="symptoms.fever" type="number" min={0} placeholder="Number affected" value={formData.symptoms.fever} onChange={handleNestedNumberChange('symptoms', 'fever')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="symptoms.skinRashes">Skin Rashes</Label>
                    <Input id="symptoms.skinRashes" type="number" min={0} placeholder="Number affected" value={formData.symptoms.skinRashes} onChange={handleNestedNumberChange('symptoms', 'skinRashes')} />
                  </div>
                </div>
              </div>

              {/* Age Group Affected */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Age Group Affected</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ageGroups.children0to12">Children (0–12 years)</Label>
                    <Input id="ageGroups.children0to12" type="number" min={0} value={formData.ageGroups.children0to12} onChange={handleNestedNumberChange('ageGroups', 'children0to12')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ageGroups.adults13to60">Adults (13–60 years)</Label>
                    <Input id="ageGroups.adults13to60" type="number" min={0} value={formData.ageGroups.adults13to60} onChange={handleNestedNumberChange('ageGroups', 'adults13to60')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ageGroups.elderly60plus">Citizens / Elderly (60+ years)</Label>
                    <Input id="ageGroups.elderly60plus" type="number" min={0} value={formData.ageGroups.elderly60plus} onChange={handleNestedNumberChange('ageGroups', 'elderly60plus')} />
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

              {/* Water Quality Assessment */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Water Quality Assessment</h3>

                <Alert className="bg-blue-50/50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-500" />
                  <AlertTitle className="text-blue-700 font-semibold">Priority Order Required</AlertTitle>
                  <AlertDescription className="text-blue-600">
                    Please enter water bodies in order of significance—starting with the <strong>most significant</strong> one first, followed by others in decreasing order.
                  </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-2 gap-6 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="numberOfWaterBodies">Number of Water Bodies</Label>
                    <div className="relative">
                      <Droplets className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="numberOfWaterBodies"
                        name="numberOfWaterBodies"
                        type="number"
                        min={0}
                        max={maxWaterBodiesCount}
                        placeholder="Count"
                        value={formData.numberOfWaterBodies}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                    {formData.municipality && (
                      <p className="text-xs text-muted-foreground">
                        Max available for {formData.municipality}: {maxWaterBodiesCount}
                      </p>
                    )}
                  </div>

                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addWaterBodyAssessment}
                      className="w-full md:w-auto"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Water Body
                    </Button>
                  </div>
                </div>

                {waterBodiesLimitError && (
                  <p className="text-sm font-medium text-destructive mt-2">
                    {waterBodiesLimitError}
                  </p>
                )}

                {/* Dynamic Card Layout */}
                {waterBodyAssessments.length > 0 && (
                  <div className="space-y-4">
                    {waterBodyAssessments.map((assessment, index) => {
                      const isCollapsed = !!collapsedCards[index];
                      const availableBodies = getAvailableWaterBodies(index);
                      const selectedBody = waterBodiesList.find(wb => wb.wid === assessment.wid);

                      return (
                        <Card key={index} className="border border-input overflow-hidden shadow-sm">
                          {/* Card Header (Collapsible toggle + Title + Remove button) */}
                          <div className="flex items-center justify-between bg-muted/30 px-4 py-3 border-b">
                            <div
                              className="flex items-center space-x-2 cursor-pointer flex-grow"
                              onClick={() => toggleCollapse(index)}
                            >
                              <span className="font-semibold text-sm text-primary">
                                {index === 0 ? "1st Water Body (Most Significant)" :
                                  index === 1 ? "2nd Water Body" :
                                    index === 2 ? "3rd Water Body" :
                                      `${index + 1}th Water Body`}
                                {selectedBody ? ` — ${selectedBody.wname}` : ""}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {isCollapsed ? "(Click to expand)" : "(Click to collapse)"}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeWaterBodyAssessment(index)}
                              className="h-8 px-3"
                            >
                              Remove
                            </Button>
                          </div>

                          {/* Card Content (Visible only if not collapsed) */}
                          {!isCollapsed && (
                            <CardContent className="p-4 space-y-4">
                              <div className="grid md:grid-cols-2 gap-4">
                                {/* Select Water Body */}
                                <div className="space-y-2">
                                  <Label htmlFor={`water-body-select-${index}`}>Select Water Body</Label>
                                  <Select
                                    value={assessment.wid ? String(assessment.wid) : ""}
                                    onValueChange={(val) => handleCardFieldChange(index, 'wid', Number(val))}
                                    required
                                  >
                                    <SelectTrigger id={`water-body-select-${index}`}>
                                      <SelectValue placeholder="Select water body" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableBodies.map((wb) => (
                                        <SelectItem key={wb.wid} value={String(wb.wid)}>
                                          {wb.wname}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* pH */}
                                <div className="space-y-2">
                                  <Label htmlFor={`ph-input-${index}`}>pH</Label>
                                  <Input
                                    id={`ph-input-${index}`}
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="14"
                                    placeholder="pH (0-14)"
                                    value={assessment.ph}
                                    onChange={(e) => handleCardFieldChange(index, 'ph', e.target.value)}
                                    required
                                  />
                                </div>

                                {/* Turbidity */}
                                <div className="space-y-2">
                                  <Label htmlFor={`turbidity-input-${index}`}>Turbidity (NTU)</Label>
                                  <Input
                                    id={`turbidity-input-${index}`}
                                    type="number"
                                    step="0.1"
                                    min="0.01"
                                    placeholder="Turbidity (NTU)"
                                    value={assessment.turbidity}
                                    onChange={(e) => handleCardFieldChange(index, 'turbidity', e.target.value)}
                                    required
                                  />
                                </div>

                                {/* TDS */}
                                <div className="space-y-2">
                                  <Label htmlFor={`tds-input-${index}`}>TDS (mg/L)</Label>
                                  <Input
                                    id={`tds-input-${index}`}
                                    type="number"
                                    step="0.1"
                                    min="0.01"
                                    placeholder="TDS (mg/L)"
                                    value={assessment.tds}
                                    onChange={(e) => handleCardFieldChange(index, 'tds', e.target.value)}
                                    required
                                  />
                                </div>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )}
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
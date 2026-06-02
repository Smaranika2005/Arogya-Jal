import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Droplets, LogOut, Plus, FileText, User, Activity, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const ASHADashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);

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
      setCurrentUser({ id: user.id, name: profile.name });
    })();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    navigate('/');
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-background to-emerald-50">
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Droplets className="w-8 h-8 text-sky-600" />
            <div>
              <h1 className="text-xl font-bold text-sky-800">Arogya Jal</h1>
              <p className="text-sm text-muted-foreground">ASHA Worker Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-semibold">{currentUser.name}</p>
              <p className="text-sm text-muted-foreground">ASHA Worker</p>
            </div>
            <Avatar><AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback></Avatar>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome, {currentUser.name}!</h2>
          <p className="text-muted-foreground">
            Collect TDS and turbidity readings. pH is captured automatically from IoT sensors.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <Activity className="h-10 w-10 text-sky-600" />
              <div>
                <p className="text-sm text-muted-foreground">Assessment Level</p>
                <p className="text-2xl font-bold">Booth</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <BarChart3 className="h-10 w-10 text-emerald-600" />
              <div>
                <p className="text-sm text-muted-foreground">WQI Calculation</p>
                <p className="text-2xl font-bold">Automatic</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <Droplets className="h-10 w-10 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">pH Source</p>
                <p className="text-2xl font-bold">IoT Sensor</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-sky-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" /> New Assessment
              </CardTitle>
              <CardDescription>
                Enter municipality, pincode, survey counts, symptoms, and age groups for the community assessment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate('/asha/survey')}>
                <FileText className="h-4 w-4 mr-2" /> Start Assessment
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" /> Profile
              </CardTitle>
              <CardDescription>View your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => navigate('/asha/profile')}>
                View Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ASHADashboard;

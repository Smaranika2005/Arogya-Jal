import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Activity, Shield, Users, TrendingUp, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();
  const [activeIcon, setActiveIcon] = useState(0);

  const floatingIcons = [
    { Icon: Heart, delay: "0s" },
    { Icon: Activity, delay: "0.5s" },
    { Icon: Shield, delay: "1s" },
    { Icon: Users, delay: "1.5s" },
    { Icon: TrendingUp, delay: "2s" },
    { Icon: MapPin, delay: "2.5s" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 health-gradient opacity-10" />
        
        {/* Floating Icons Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {floatingIcons.map(({ Icon, delay }, index) => (
            <div
              key={index}
              className={`absolute float-animation opacity-20 ${
                activeIcon === index ? "opacity-40 scale-125" : ""
              }`}
              style={{
                left: `${10 + index * 15}%`,
                top: `${20 + index * 10}%`,
                animationDelay: delay,
              }}
            >
              <Icon className="w-8 h-8 text-primary" />
            </div>
          ))}
        </div>

        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Main Title */}
            <div className="mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="heartbeat">
                  <Heart className="w-12 h-12 text-primary mr-4" />
                </div>
                <h1 className="text-5xl md:text-6xl font-bold">
                  <span className="text-gradient-primary">Smart Community</span>
                </h1>
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold text-secondary mb-4">
                Health Monitoring & Early Warning System
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Empowering ASHA workers and government officials with real-time health data collection, 
                monitoring, and early warning capabilities for better community health outcomes.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary-dark text-primary-foreground px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                onClick={() => navigate("/asha/login")}
              >
                <Users className="w-5 h-5 mr-2" />
                Login as ASHA Worker
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105"
                onClick={() => navigate("/gov/login")}
              >
                <Shield className="w-5 h-5 mr-2" />
                Login as Government Official
              </Button>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-muted-foreground mb-4">New ASHA Worker?</p>
              <Button
                variant="ghost"
                className="text-accent hover:text-accent-foreground hover:bg-accent/10 text-lg font-medium"
                onClick={() => navigate("/asha/signup")}
              >
                Sign Up Here →
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gradient-to-r from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Comprehensive Health Monitoring
            </h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for field workers and decision makers to track, analyze, and respond to community health challenges.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="health-card p-8 text-center border-0">
              <div className="mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Activity className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h4 className="text-xl font-semibold mb-4">Real-time Data Collection</h4>
              <p className="text-muted-foreground">
                ASHA workers can collect and submit health surveys with symptoms, demographics, and environmental data.
              </p>
            </Card>

            <Card className="health-card p-8 text-center border-0">
              <div className="mb-6">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
                  <TrendingUp className="w-8 h-8 text-secondary" />
                </div>
              </div>
              <h4 className="text-xl font-semibold mb-4">Analytics & Insights</h4>
              <p className="text-muted-foreground">
                Government officials get comprehensive dashboards with charts, trends, and actionable insights.
              </p>
            </Card>

            <Card className="health-card p-8 text-center border-0">
              <div className="mb-6">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                  <Shield className="w-8 h-8 text-accent" />
                </div>
              </div>
              <h4 className="text-xl font-semibold mb-4">Early Warning System</h4>
              <p className="text-muted-foreground">
                Automated alerts and reports help identify potential health outbreaks before they spread.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
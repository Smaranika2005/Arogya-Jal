import { Heart, Mail, Phone, MapPin, Shield, Users, Activity } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Heart className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold text-gradient-primary">HealthMonitor</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Empowering communities with smart health monitoring and early warning systems for better health outcomes.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Quick Links</h4>
            <div className="space-y-2">
              <a href="#features" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Features
              </a>
              <a href="#how-it-works" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                How It Works
              </a>
              <a href="#about" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                About Us
              </a>
            </div>
          </div>

          {/* For Users */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">For Users</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4 text-primary" />
                <span>ASHA Workers</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-secondary" />
                <span>Government Officials</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Activity className="w-4 h-4 text-accent" />
                <span>Health Administrators</span>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Contact</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-primary" />
                <span>support@healthmonitor.gov</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 text-primary" />
                <span>1800-XXX-HEALTH</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Ministry of Health, India</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            © 2024 Smart Community Health Monitoring System. Built for better community health outcomes.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
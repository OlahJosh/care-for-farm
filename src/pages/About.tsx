import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import farmcareLogo from "/farmcare-logo.png";
import heroBackground from "@/assets/hero-farm-background.jpg";
import {
  Target,
  Eye,
  Heart,
  Users,
  Globe,
  Award,
  Zap,
  Shield,
  Sprout,
  TrendingUp,
  Mail,
  MapPin,
  Phone
} from "lucide-react";

const teamMembers = [
  {
    name: "Dr. Oluwaseun Adeyemi",
    role: "Founder & CEO",
    bio: "Agricultural scientist with 15+ years experience in precision farming"
  },
  {
    name: "Amina Bello",
    role: "CTO",
    bio: "AI/ML expert specializing in computer vision for agriculture"
  },
  {
    name: "Chukwuemeka Okonkwo",
    role: "Head of Agronomy",
    bio: "Former extension officer with expertise in pest management"
  },
  {
    name: "Fatima Abdullahi",
    role: "Product Director",
    bio: "Product leader focused on farmer-centric solutions"
  }
];

const milestones = [
  { year: "2022", event: "FarmCare founded with a mission to protect African harvests" },
  { year: "2023", event: "Launched AI pest detection with 95%+ accuracy" },
  { year: "2024", event: "Expanded to 5 countries across Africa" },
  { year: "2025", event: "10,000+ farmers using FarmCare daily" }
];

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <img src={farmcareLogo} alt="FarmCare Logo" className="h-10 w-10 rounded-lg" />
            <h1 className="text-2xl font-bold text-foreground">FarmCare</h1>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/help">
              <Button variant="ghost">Help Center</Button>
            </Link>
            <Link to="/auth">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="relative py-24"
        style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-white/85 dark:bg-background/90 z-0"></div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            About FarmCare
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Empowering farmers across Africa with intelligent agricultural technology 
            to protect crops, optimize yields, and build sustainable livelihoods.
          </p>
        </div>
      </section>

      <main className="container mx-auto px-6 py-16">
        {/* Mission, Vision, Values */}
        <section className="mb-20">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To protect every harvest through accessible, AI-powered agricultural 
                  intelligence that puts the power of precision farming in every farmer's hands.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Eye className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  A world where no farmer loses their harvest to preventable threats. 
                  Where technology bridges the gap between traditional wisdom and modern solutions.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Our Values</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Farmer-first innovation, accessibility for all, environmental 
                  sustainability, and unwavering commitment to food security.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Our Story */}
        <section className="mb-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Our Story</h2>
          <div className="prose prose-lg dark:prose-invert mx-auto text-muted-foreground">
            <p className="text-lg leading-relaxed mb-6">
              FarmCare was born from a simple observation: farmers across Africa were losing 
              up to 40% of their harvests to pests, weather events, and market uncertainties. 
              Despite advances in agricultural technology, these solutions remained out of reach 
              for most smallholder farmers.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              In 2022, our founding team, a group of agricultural scientists, AI researchers, 
              and former farmers, set out to change this. We believed that the same AI technology 
              powering autonomous vehicles could be adapted to identify crop pests. That IoT 
              sensors used in smart cities could monitor farm conditions. And that mobile 
              technology could bring all of this to any farmer with a smartphone.
            </p>
            <p className="text-lg leading-relaxed">
              Today, FarmCare serves thousands of farmers across multiple African countries, 
              providing real-time pest detection, environmental monitoring, weather intelligence, 
              and market insights, all in one integrated platform designed for the unique 
              challenges of African agriculture.
            </p>
          </div>
        </section>

        {/* Impact Numbers */}
        <section className="mb-20 py-16 bg-primary/5 -mx-6 px-6 rounded-3xl">
          <h2 className="text-3xl font-bold text-center mb-12">Our Impact</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">10K+</div>
              <p className="text-muted-foreground">Active Farmers</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">50K+</div>
              <p className="text-muted-foreground">Pest Detections</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">5</div>
              <p className="text-muted-foreground">Countries</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">95%+</div>
              <p className="text-muted-foreground">Detection Accuracy</p>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="mb-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Journey</h2>
          <div className="space-y-6">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                  {milestone.year}
                </div>
                <div className="pt-4">
                  <p className="text-lg">{milestone.event}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-4">Our Leadership</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            A passionate team combining agricultural expertise with cutting-edge technology
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {teamMembers.map((member) => (
              <Card key={member.name} className="text-center">
                <CardContent className="pt-6">
                  <div className="w-20 h-20 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold">{member.name}</h3>
                  <p className="text-sm text-primary mb-2">{member.role}</p>
                  <p className="text-sm text-muted-foreground">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose FarmCare</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <Sprout className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Built for African Farms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Designed specifically for the crops, pests, and conditions common to African agriculture.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Works Offline</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Core features work even with limited connectivity, perfect for rural areas.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Globe className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Local Language Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Interface available in multiple African languages for accessibility.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Data Privacy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your farm data is yours. Enterprise-grade security protects your information.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Proven Results</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Farmers report up to 40% reduction in crop losses after using FarmCare.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Award className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Expert Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Access to agricultural experts and responsive customer support.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Contact Section */}
        <section className="max-w-4xl mx-auto">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-8 pb-8">
              <h2 className="text-2xl font-bold text-center mb-8">Get in Touch</h2>
              <div className="grid sm:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-medium mb-1">Email</h4>
                  <a href="mailto:farmcareintl@gmail.com" className="text-sm text-muted-foreground hover:text-primary">
                    farmcareintl@gmail.com
                  </a>
                </div>
                <div>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-medium mb-1">Phone</h4>
                  <a href="tel:+2349024324733" className="text-sm text-muted-foreground hover:text-primary">+234 902 432 4733</a>
                </div>
                <div>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-medium mb-1">Location</h4>
                  <p className="text-sm text-muted-foreground">Ogbomoso, Nigeria</p>
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-8">
                <Link to="/help">
                  <Button>Visit Help Center</Button>
                </Link>
                <Link to="/auth">
                  <Button variant="outline">Get Started</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12 bg-card">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; 2025 FarmCare. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default About;

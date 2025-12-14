import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import farmcareLogo from "/farmcare-logo.png";
import {
  Search,
  Ticket,
  BookOpen,
  Settings,
  ShoppingBag,
  HelpCircle,
  MessageSquare,
  Mail,
  ChevronRight,
  ArrowLeft,
  Send,
  CheckCircle,
  Loader2,
  Phone,
  MapPin,
  Clock
} from "lucide-react";

const SUPPORT_EMAIL = "farmcareintl@gmail.com";

const helpCategories = [
  {
    icon: BookOpen,
    title: "Getting Started",
    description: "Learn the basics of FarmCare",
    articles: 12
  },
  {
    icon: Settings,
    title: "Account & Settings",
    description: "Manage your account preferences",
    articles: 8
  },
  {
    icon: ShoppingBag,
    title: "Orders & Payments",
    description: "Track orders and billing",
    articles: 15
  },
  {
    icon: HelpCircle,
    title: "Troubleshooting",
    description: "Fix common issues",
    articles: 20
  }
];

const faqs = [
  {
    question: "How do I upload crop images for pest detection?",
    answer: "Navigate to the 'Upload' section from your dashboard. You can take a photo directly or upload an existing image. Our AI will analyze it and provide pest detection results within seconds."
  },
  {
    question: "What types of pests can FarmCare detect?",
    answer: "FarmCare's AI can detect various agricultural pests including Fall Armyworm, aphids, locusts, and other common crop pests. Our detection accuracy is over 95% for supported pest types."
  },
  {
    question: "How do I connect IoT sensors to my farm?",
    answer: "Go to the Sensors page and follow the setup guide to connect compatible IoT devices. FarmCare supports most standard agricultural sensors for temperature, humidity, and soil moisture monitoring."
  },
  {
    question: "Can I track market prices for my crops?",
    answer: "Yes! The Market Trends page shows real-time pricing data for various crops. You can also contribute by submitting prices from your local market to help the farming community."
  },
  {
    question: "How do I contact an agronomist?",
    answer: "Visit the Expert Directory to find verified agricultural specialists. You can view their profiles, expertise areas, and contact them directly through the platform."
  },
  {
    question: "What payment methods are accepted in the Farm Store?",
    answer: "We accept credit/debit cards, bank transfers, and pay-on-delivery options. All payments are processed securely through our encrypted payment system."
  },
  {
    question: "How do weather alerts work?",
    answer: "FarmCare integrates with weather APIs to provide 7-day forecasts. You'll receive automatic notifications for adverse weather conditions that could affect your crops."
  },
  {
    question: "Can I export my analysis reports?",
    answer: "Yes, you can download or print detailed reports from any analysis. Reports include pest detection results, recommendations, and historical data."
  },
  {
    question: "How do I track my support ticket?",
    answer: "After submitting a support request, you'll receive a ticket ID (format: FC-XXXXX-XXXX). Use the 'Track Your Ticket' feature on this page to check the status of your request."
  },
  {
    question: "Is my farm data secure?",
    answer: "Absolutely. We use enterprise-grade encryption and follow strict data protection protocols. Your farm data is private and only accessible to you and authorized personnel you approve."
  }
];

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState("");
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const generateTicketId = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `FC-${timestamp}-${random}`;
  };

  const handleTicketLookup = async () => {
    if (!ticketId.trim()) {
      toast.error("Please enter a ticket ID");
      return;
    }
    
    setIsLookingUp(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLookingUp(false);
    
    // Simulate ticket lookup
    if (ticketId.startsWith("FC-")) {
      toast.info("Ticket Status: In Progress", {
        description: "Our support team is reviewing your request. Expected response within 24 hours."
      });
    } else {
      toast.error("Ticket not found", {
        description: "Please check the ticket ID and try again."
      });
    }
  };

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newTicketId = generateTicketId();
    setSubmittedTicketId(newTicketId);
    setIsSubmitting(false);
    
    toast.success("Message sent successfully!", {
      description: `Your ticket ID is ${newTicketId}`
    });
  };

  const filteredFaqs = faqs.filter(
    faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (submittedTicketId) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto flex h-16 items-center justify-between px-6">
            <Link to="/" className="flex items-center gap-3">
              <img src={farmcareLogo} alt="FarmCare Logo" className="h-10 w-10 rounded-lg" />
              <h1 className="text-2xl font-bold text-foreground">FarmCare</h1>
            </Link>
            <nav className="flex items-center gap-4">
              <Link to="/about">
                <Button variant="ghost">About</Button>
              </Link>
              <Link to="/auth">
                <Button>Get Started</Button>
              </Link>
            </nav>
          </div>
        </header>

        <main className="container mx-auto px-6 py-16">
          <Card className="max-w-lg mx-auto text-center">
            <CardContent className="pt-8 space-y-6">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Message Sent!</h2>
                <p className="text-muted-foreground">
                  Our support team will get back to you within 24-48 hours.
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Your Ticket ID</p>
                <p className="text-xl font-mono font-bold text-primary">{submittedTicketId}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Save this ticket ID to track your request status.
              </p>
              <div className="flex flex-col gap-3 pt-2">
                <Button onClick={() => { setSubmittedTicketId(""); setShowContactForm(false); setContactForm({ name: "", email: "", subject: "", message: "" }); }}>
                  Back to Help Center
                </Button>
                <Button variant="outline" asChild>
                  <a href={`mailto:${SUPPORT_EMAIL}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email Support Directly
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (showContactForm) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto flex h-16 items-center justify-between px-6">
            <Link to="/" className="flex items-center gap-3">
              <img src={farmcareLogo} alt="FarmCare Logo" className="h-10 w-10 rounded-lg" />
              <h1 className="text-2xl font-bold text-foreground">FarmCare</h1>
            </Link>
            <nav className="flex items-center gap-4">
              <Link to="/about">
                <Button variant="ghost">About</Button>
              </Link>
              <Link to="/auth">
                <Button>Get Started</Button>
              </Link>
            </nav>
          </div>
        </header>

        <main className="container mx-auto px-6 py-12">
          <div className="max-w-2xl mx-auto">
            <Button 
              variant="ghost" 
              className="mb-6"
              onClick={() => setShowContactForm(false)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Help Center
            </Button>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Leave a Message
                </CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you within 24-48 hours. 
                  You'll receive a ticket ID to track your request.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitMessage} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Brief description of your issue"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Please describe your issue or question in detail..."
                      rows={6}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Mail className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h4 className="font-medium mb-1">Email</h4>
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-sm text-muted-foreground hover:text-primary">
                    {SUPPORT_EMAIL}
                  </a>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Phone className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h4 className="font-medium mb-1">Phone</h4>
                  <a href="tel:+2349024324733" className="text-sm text-muted-foreground hover:text-primary">+234 902 432 4733</a>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Clock className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h4 className="font-medium mb-1">Response Time</h4>
                  <p className="text-sm text-muted-foreground">24-48 hours</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
            <Link to="/about">
              <Button variant="ghost">About</Button>
            </Link>
            <Link to="/auth">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            How Can We Help?
          </h1>
          <div className="max-w-xl mx-auto relative mt-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              className="pl-12 h-14 text-lg"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      <main className="container mx-auto px-6 py-12">
        {/* Track Ticket */}
        <Card className="max-w-2xl mx-auto mb-12">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Ticket className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Track Your Ticket</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Enter your ticket ID to check status
                </p>
                <div className="flex gap-2">
                  <Input
                    value={ticketId}
                    onChange={(e) => setTicketId(e.target.value.toUpperCase())}
                    placeholder="Enter Ticket ID (e.g., FC-XXXXX-XXXX)"
                    className="flex-1"
                  />
                  <Button onClick={handleTicketLookup} disabled={isLookingUp}>
                    {isLookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Look Up"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-2">Browse by Category</h2>
          <p className="text-muted-foreground text-center mb-8">
            Find answers organized by topic
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {helpCategories.map((category) => (
              <Card key={category.title} className="hover:border-primary/50 transition-colors cursor-pointer group">
                <CardContent className="pt-6">
                  <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                    <category.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{category.title}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section className="mb-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Frequently Asked Questions</h2>
          <p className="text-muted-foreground text-center mb-8">
            Quick answers to common questions about FarmCare
          </p>
          <Accordion type="single" collapsible className="space-y-2">
            {filteredFaqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          {filteredFaqs.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No results found for "{searchQuery}". Try a different search term.
            </p>
          )}
        </section>

        {/* Still Need Help */}
        <section className="max-w-2xl mx-auto">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-8 pb-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Still Need Help?</h2>
              <p className="text-muted-foreground mb-6">
                Our support team is here to assist you with any questions or concerns
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => setShowContactForm(true)} size="lg">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Leave a Message
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href={`mailto:${SUPPORT_EMAIL}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email Support
                  </a>
                </Button>
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

export default HelpCenter;

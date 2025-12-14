import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Eye, EyeOff, Phone, Mail, ArrowLeft, User, Lock } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ScrollArea } from "@/components/ui/scroll-area";
import farmcareLogo from "/farmcare-logo.png";

// Country codes for phone authentication
const countryCodes = [
  { code: "+234", country: "Nigeria", flag: "🇳🇬" },
  { code: "+254", country: "Kenya", flag: "🇰🇪" },
  { code: "+233", country: "Ghana", flag: "🇬🇭" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+256", country: "Uganda", flag: "🇺🇬" },
  { code: "+255", country: "Tanzania", flag: "🇹🇿" },
  { code: "+251", country: "Ethiopia", flag: "🇪🇹" },
  { code: "+20", country: "Egypt", flag: "🇪🇬" },
  { code: "+212", country: "Morocco", flag: "🇲🇦" },
  { code: "+237", country: "Cameroon", flag: "🇨🇲" },
  { code: "+225", country: "Ivory Coast", flag: "🇨🇮" },
  { code: "+221", country: "Senegal", flag: "🇸🇳" },
  { code: "+263", country: "Zimbabwe", flag: "🇿🇼" },
  { code: "+260", country: "Zambia", flag: "🇿🇲" },
  { code: "+265", country: "Malawi", flag: "🇲🇼" },
  { code: "+250", country: "Rwanda", flag: "🇷🇼" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+55", country: "Brazil", flag: "🇧🇷" },
];

type AuthMethod = "email" | "phone";
type AuthMode = "login" | "signup";
type PhoneAuthStep = "phone" | "otp" | "profile";

const Auth = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Auth method and mode
  const [authMethod, setAuthMethod] = useState<AuthMethod>("email");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  
  // Email auth states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"farmer" | "agronomist">("farmer");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  
  // Phone auth states
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+234");
  const [otpCode, setOtpCode] = useState("");
  const [phoneAuthStep, setPhoneAuthStep] = useState<PhoneAuthStep>("phone");
  const [phoneFullName, setPhoneFullName] = useState("");
  const [phoneRole, setPhoneRole] = useState<"farmer" | "agronomist">("farmer");
  const [phoneAgreeToTerms, setPhoneAgreeToTerms] = useState(false);
  const [phoneSupported, setPhoneSupported] = useState(true);

  useEffect(() => {
    if (user && userRole) {
      if (userRole === "agronomist") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, userRole, navigate]);

  // Format phone number for display
  const formatPhoneDisplay = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
  };

  // Format phone for Supabase (needs +country code)
  const formatPhoneForSupabase = (phone: string, code: string) => {
    const cleaned = phone.replace(/\D/g, "");
    return `${code}${cleaned}`;
  };

  const getSelectedCountry = () => {
    return countryCodes.find(c => c.code === countryCode) || countryCodes[0];
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (error) throw error;
      toast.success("Welcome back!");
      
      if (data.user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .single();
        
        if (roleData?.role === "agronomist") {
          navigate("/admin/dashboard");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast.success("Password reset link sent to your email!");
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreeToTerms) {
      toast.error("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
      toast.success("Account created! Please check your email for verification.");
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  // Phone OTP handlers
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber || phoneNumber.replace(/\D/g, "").length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = formatPhoneForSupabase(phoneNumber, countryCode);
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });
      
      if (error) throw error;
      
      toast.success("OTP sent to your phone!");
      setPhoneAuthStep("otp");
    } catch (error: any) {
      const message = error?.message || "Failed to send OTP";
      if (typeof message === "string" && message.toLowerCase().includes("unsupported phone provider")) {
        toast.error("Phone sign-in is not enabled yet. Please use email and password for now.");
        setPhoneSupported(false);
        setAuthMethod("email");
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otpCode.length !== 6) {
      toast.error("Please enter the 6-digit OTP code");
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = formatPhoneForSupabase(phoneNumber, countryCode);
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otpCode,
        type: "sms",
      });

      if (error) throw error;

      // Check if user has a profile (existing user)
      if (data.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", data.user.id)
          .single();

        if (!profileData?.full_name) {
          // New user - needs to complete profile
          setPhoneAuthStep("profile");
        } else {
          // Existing user - redirect
          toast.success("Welcome back!");
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", data.user.id)
            .single();
          
          if (roleData?.role === "agronomist") {
            navigate("/admin/dashboard");
          } else {
            navigate("/dashboard");
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Invalid OTP code");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneAgreeToTerms) {
      toast.error("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    if (!phoneFullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    setLoading(true);

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        throw new Error("User not found");
      }

      // Update user metadata
      await supabase.auth.updateUser({
        data: {
          full_name: phoneFullName,
          role: phoneRole,
        },
      });

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: phoneFullName,
          phone: formatPhoneForSupabase(phoneNumber, countryCode),
        })
        .eq("id", currentUser.id);

      if (profileError) throw profileError;

      toast.success("Account setup complete!");
      
      if (phoneRole === "agronomist") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to complete profile");
    } finally {
      setLoading(false);
    }
  };

  const resetPhoneAuth = () => {
    setPhoneAuthStep("phone");
    setOtpCode("");
    setPhoneFullName("");
    setPhoneRole("farmer");
    setPhoneAgreeToTerms(false);
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setRole("farmer");
    setAgreeToTerms(false);
    setShowForgotPassword(false);
    resetPhoneAuth();
  };

  const switchAuthMethod = () => {
    resetForm();
    setAuthMethod(authMethod === "email" ? "phone" : "email");
  };

  const switchAuthMode = () => {
    resetForm();
    setAuthMode(authMode === "login" ? "signup" : "login");
  };

  // Get page title and description
  const getTitle = () => {
    if (authMethod === "phone") {
      if (phoneAuthStep === "otp") return "Verify OTP";
      if (phoneAuthStep === "profile") return "Complete Profile";
      return authMode === "login" ? "Welcome Back" : "Create Account";
    }
    if (showForgotPassword) return "Reset Password";
    return authMode === "login" ? "Welcome Back" : "Create Account";
  };

  const getDescription = () => {
    if (authMethod === "phone") {
      if (phoneAuthStep === "otp") return "Enter the code sent to your phone";
      if (phoneAuthStep === "profile") return "Just a few more details to get started";
      return "Use your phone number to continue";
    }
    if (showForgotPassword) return "Enter your email to receive a reset link";
    return authMode === "login" 
      ? "Sign in to access your farm dashboard" 
      : "Join FarmCare to protect your crops";
  };

  // Render phone auth content based on step
  const renderPhoneAuth = () => {
    if (phoneAuthStep === "otp") {
      return (
        <form onSubmit={handleVerifyOTP} className="space-y-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={resetPhoneAuth}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code sent to
            </p>
            <p className="font-medium text-foreground">{formatPhoneForSupabase(phoneNumber, countryCode)}</p>
          </div>

          <div className="flex justify-center py-4">
            <InputOTP
              maxLength={6}
              value={otpCode}
              onChange={(value) => setOtpCode(value)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button type="submit" className="w-full h-12 text-base font-medium" disabled={loading || otpCode.length !== 6}>
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>

          <button
            type="button"
            className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors"
            onClick={handleSendOTP}
            disabled={loading}
          >
            Didn't receive code? <span className="text-primary font-medium">Resend OTP</span>
          </button>
        </form>
      );
    }

    if (phoneAuthStep === "profile") {
      return (
        <form onSubmit={handleCompleteProfile} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="phone-name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone-name"
                type="text"
                placeholder="Enter your full name"
                value={phoneFullName}
                onChange={(e) => setPhoneFullName(e.target.value)}
                required
                className="pl-10 h-12"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone-role">Select Role</Label>
            <Select value={phoneRole} onValueChange={(value: "farmer" | "agronomist") => setPhoneRole(value)}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="farmer">Farmer</SelectItem>
                <SelectItem value="agronomist">Agronomist</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-start space-x-3 pt-2">
            <Checkbox
              id="phone-terms"
              checked={phoneAgreeToTerms}
              onCheckedChange={(checked) => setPhoneAgreeToTerms(checked as boolean)}
              className="mt-0.5"
            />
            <Label htmlFor="phone-terms" className="text-sm font-normal leading-relaxed cursor-pointer text-muted-foreground">
              I agree to the{" "}
              <Link to="/terms" className="text-primary hover:underline" target="_blank">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-primary hover:underline" target="_blank">
                Privacy Policy
              </Link>
            </Label>
          </div>

          <Button type="submit" className="w-full h-12 text-base font-medium" disabled={loading}>
            {loading ? "Completing setup..." : "Complete Setup"}
          </Button>
        </form>
      );
    }

    // Default: phone number entry step
    return (
      <form onSubmit={handleSendOTP} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="flex gap-2">
            <Select value={countryCode} onValueChange={setCountryCode}>
              <SelectTrigger className="w-[120px] h-12">
                <SelectValue>
                  {getSelectedCountry().flag} {countryCode}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-[200px]">
                  {countryCodes.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      <span className="flex items-center gap-2">
                        <span>{country.flag}</span>
                        <span>{country.code}</span>
                        <span className="text-muted-foreground text-xs">{country.country}</span>
                      </span>
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="803 123 4567"
                value={formatPhoneDisplay(phoneNumber)}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 15))}
                required
                className="pl-10 h-12"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            We'll send a verification code to this number
          </p>
        </div>

        <Button type="submit" className="w-full h-12 text-base font-medium" disabled={loading}>
          {loading ? "Sending OTP..." : "Send Verification Code"}
        </Button>

        <div className="text-center pt-2">
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={switchAuthMethod}
          >
            {authMode === "login" ? "Sign in" : "Sign up"} with email instead
          </button>
        </div>
      </form>
    );
  };

  // Render email auth
  const renderEmailAuth = () => {
    if (showForgotPassword) {
      return (
        <form onSubmit={handleForgotPassword} className="space-y-5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowForgotPassword(false)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="reset-email"
                type="email"
                placeholder="farmer@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                className="pl-10 h-12"
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full h-12 text-base font-medium" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
      );
    }

    if (authMode === "login") {
      return (
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="login-email"
                type="email"
                placeholder="farmer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 h-12"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password">Password</Label>
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 pr-10 h-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full h-12 text-base font-medium" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>

          <div className="space-y-3 pt-2">
            <div className="text-center">
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={switchAuthMode}
              >
                Don't have an account? <span className="text-primary font-medium">Sign up</span>
              </button>
            </div>
            
            {phoneSupported && (
              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={switchAuthMethod}
                >
                  Sign in with phone instead
                </button>
              </div>
            )}
          </div>
        </form>
      );
    }

    // Signup form
    return (
      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signup-name">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="signup-name"
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="pl-10 h-12"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="signup-email"
              type="email"
              placeholder="farmer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-10 h-12"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="pl-10 pr-10 h-12"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-confirm-password">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="signup-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="pl-10 pr-10 h-12"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-role">Select Role</Label>
          <Select value={role} onValueChange={(value: "farmer" | "agronomist") => setRole(value)}>
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="farmer">Farmer</SelectItem>
              <SelectItem value="agronomist">Agronomist</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-start space-x-3 pt-2">
          <Checkbox
            id="terms"
            checked={agreeToTerms}
            onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
            className="mt-0.5"
          />
          <Label htmlFor="terms" className="text-sm font-normal leading-relaxed cursor-pointer text-muted-foreground">
            I agree to the{" "}
            <Link to="/terms" className="text-primary hover:underline" target="_blank">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-primary hover:underline" target="_blank">
              Privacy Policy
            </Link>
          </Label>
        </div>

        <Button type="submit" className="w-full h-12 text-base font-medium" disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </Button>

        <div className="space-y-3 pt-2">
          <div className="text-center">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={switchAuthMode}
            >
              Already have an account? <span className="text-primary font-medium">Sign in</span>
            </button>
          </div>
          
          {phoneSupported && (
            <div className="text-center">
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={switchAuthMethod}
              >
                Sign up with phone instead
              </button>
            </div>
          )}
        </div>
      </form>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background to-muted/30 p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Logo and header outside card */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center mb-3">
            <img src={farmcareLogo} alt="FarmCare Logo" className="h-12 w-12 rounded-xl shadow-md" />
          </div>
          <h1 className="text-xl font-bold text-foreground">FarmCare</h1>
        </div>

        <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2 pt-5">
            <CardTitle className="text-lg font-semibold">
              {getTitle()}
            </CardTitle>
            <CardDescription className="text-sm">
              {getDescription()}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-4 pb-6">
            {!phoneSupported && authMethod === "phone" && (
              <p className="text-xs text-center text-destructive mb-4 p-2 bg-destructive/10 rounded-md">
                Phone sign-in is not available yet. Please use email instead.
              </p>
            )}

            {authMethod === "phone" ? renderPhoneAuth() : renderEmailAuth()}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to FarmCare's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Auth;

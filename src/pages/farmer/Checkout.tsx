import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  ShoppingCart, 
  Truck, 
  CreditCard, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight,
  Minus,
  Plus,
  Trash2,
  MapPin,
  Phone,
  User,
  Lock,
  Package,
  Printer,
  Download
} from "lucide-react";

type CheckoutStep = "cart" | "delivery" | "payment" | "confirmation";

interface DeliveryDetails {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes: string;
}

const COUNTRIES = [
  { code: "NG", name: "Nigeria" },
  { code: "GH", name: "Ghana" },
  { code: "KE", name: "Kenya" },
  { code: "ZA", name: "South Africa" },
  { code: "TZ", name: "Tanzania" },
  { code: "UG", name: "Uganda" },
  { code: "ET", name: "Ethiopia" },
  { code: "EG", name: "Egypt" },
  { code: "CM", name: "Cameroon" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "SN", name: "Senegal" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" },
  { code: "RW", name: "Rwanda" },
  { code: "BJ", name: "Benin" },
  { code: "TG", name: "Togo" },
  { code: "ML", name: "Mali" },
  { code: "NE", name: "Niger" },
  { code: "BF", name: "Burkina Faso" },
  { code: "MW", name: "Malawi" },
  { code: "MZ", name: "Mozambique" },
  { code: "AO", name: "Angola" },
  { code: "CD", name: "DR Congo" },
  { code: "SD", name: "Sudan" },
];

interface PaymentDetails {
  method: "card" | "bank_transfer" | "pay_on_delivery";
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  cardName: string;
}

const STEPS: { id: CheckoutStep; label: string; icon: React.ElementType }[] = [
  { id: "cart", label: "Review Cart", icon: ShoppingCart },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "confirmation", label: "Confirm", icon: CheckCircle },
];

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, updateQuantity, removeFromCart, clearCart, totalPrice } = useCart();
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("cart");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [orderDate, setOrderDate] = useState<Date | null>(null);
  const [confirmedItems, setConfirmedItems] = useState<typeof items>([]);
  const [confirmedDelivery, setConfirmedDelivery] = useState<DeliveryDetails | null>(null);
  const [confirmedPayment, setConfirmedPayment] = useState<PaymentDetails | null>(null);
  const [confirmedTotal, setConfirmedTotal] = useState<number>(0);
  
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails>({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "NG",
    notes: "",
  });
  
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    method: "card",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    cardName: "",
  });

  // Auto-fill from profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, farm_location")
        .eq("id", user.id)
        .single();
      
      if (data) {
        setDeliveryDetails(prev => ({
          ...prev,
          fullName: data.full_name || "",
          phone: data.phone || "",
          address: data.farm_location || "",
        }));
      }
    };
    
    fetchProfile();
  }, [user]);

  const deliveryFee = 2500;
  const grandTotal = totalPrice + deliveryFee;

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
  const progressValue = ((currentStepIndex + 1) / STEPS.length) * 100;

  const goToNextStep = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  };

  const goToPrevStep = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  const validateDelivery = () => {
    if (!deliveryDetails.fullName.trim()) {
      toast.error("Please enter your full name");
      return false;
    }
    if (!deliveryDetails.phone.trim()) {
      toast.error("Please enter your phone number");
      return false;
    }
    if (!deliveryDetails.address.trim()) {
      toast.error("Please enter your delivery address");
      return false;
    }
    if (!deliveryDetails.city.trim()) {
      toast.error("Please enter your city");
      return false;
    }
    if (!deliveryDetails.state.trim()) {
      toast.error("Please enter your state");
      return false;
    }
    return true;
  };

  const validatePayment = () => {
    if (paymentDetails.method === "card") {
      if (!paymentDetails.cardNumber.replace(/\s/g, "").match(/^\d{16}$/)) {
        toast.error("Please enter a valid 16-digit card number");
        return false;
      }
      if (!paymentDetails.cardExpiry.match(/^\d{2}\/\d{2}$/)) {
        toast.error("Please enter card expiry in MM/YY format");
        return false;
      }
      if (!paymentDetails.cardCvv.match(/^\d{3,4}$/)) {
        toast.error("Please enter a valid CVV");
        return false;
      }
      if (!paymentDetails.cardName.trim()) {
        toast.error("Please enter cardholder name");
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === "cart") {
      if (items.length === 0) {
        toast.error("Your cart is empty");
        return;
      }
      goToNextStep();
    } else if (currentStep === "delivery") {
      if (validateDelivery()) {
        goToNextStep();
      }
    } else if (currentStep === "payment") {
      if (validatePayment()) {
        goToNextStep();
      }
    }
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Store order details before clearing cart
    setConfirmedItems([...items]);
    setConfirmedDelivery({ ...deliveryDetails });
    setConfirmedPayment({ ...paymentDetails });
    setConfirmedTotal(grandTotal);
    setOrderDate(new Date());
    
    // Generate order number
    const newOrderNumber = `FC-${Date.now().toString(36).toUpperCase()}`;
    setOrderNumber(newOrderNumber);
    
    // Clear cart
    clearCart();
    
    setIsProcessing(false);
    toast.success("Order placed successfully!");
  };

  const handlePrintReceipt = () => {
    const receiptContent = generateReceiptHTML();
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const handleDownloadReceipt = () => {
    const receiptContent = generateReceiptHTML();
    const blob = new Blob([receiptContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `FarmCare-Receipt-${orderNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Receipt downloaded");
  };

  const generateReceiptHTML = () => {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-NG", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    };

    const paymentMethodLabel = confirmedPayment?.method === "card" 
      ? `Card ending in ${confirmedPayment.cardNumber.slice(-4)}`
      : confirmedPayment?.method === "bank_transfer" 
        ? "Bank Transfer" 
        : "Pay on Delivery";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>FarmCare Receipt - ${orderNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #16a34a; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { color: #16a34a; margin: 0; font-size: 28px; }
          .header p { color: #666; margin: 5px 0; }
          .order-info { background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .order-info p { margin: 5px 0; }
          .section { margin-bottom: 20px; }
          .section h3 { border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 12px; color: #374151; }
          .item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
          .item:last-child { border-bottom: none; }
          .totals { background: #f0fdf4; padding: 15px; border-radius: 8px; }
          .totals .row { display: flex; justify-content: space-between; padding: 5px 0; }
          .totals .total { font-size: 18px; font-weight: bold; color: #16a34a; border-top: 2px solid #16a34a; padding-top: 10px; margin-top: 10px; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 12px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FarmCare</h1>
          <p>Order Receipt</p>
        </div>
        
        <div class="order-info">
          <p><strong>Order Number:</strong> ${orderNumber}</p>
          <p><strong>Date:</strong> ${orderDate ? formatDate(orderDate) : ""}</p>
          <p><strong>Payment Method:</strong> ${paymentMethodLabel}</p>
        </div>

        <div class="section">
          <h3>Delivery Address</h3>
          <p><strong>${confirmedDelivery?.fullName}</strong></p>
          <p>${confirmedDelivery?.phone}</p>
          <p>${confirmedDelivery?.address}</p>
          <p>${confirmedDelivery?.city}, ${confirmedDelivery?.state} ${confirmedDelivery?.postalCode || ""}</p>
          <p>${COUNTRIES.find(c => c.code === confirmedDelivery?.country)?.name || confirmedDelivery?.country}</p>
          ${confirmedDelivery?.notes ? `<p><em>Note: ${confirmedDelivery.notes}</em></p>` : ""}
        </div>

        <div class="section">
          <h3>Items Ordered</h3>
          ${confirmedItems.map(item => `
            <div class="item">
              <span>${item.name} x ${item.quantity}</span>
              <span>₦${(item.price * item.quantity).toLocaleString()}</span>
            </div>
          `).join("")}
        </div>

        <div class="totals">
          <div class="row">
            <span>Subtotal</span>
            <span>₦${(confirmedTotal - deliveryFee).toLocaleString()}</span>
          </div>
          <div class="row">
            <span>Delivery Fee</span>
            <span>₦${deliveryFee.toLocaleString()}</span>
          </div>
          <div class="row total">
            <span>Total</span>
            <span>₦${confirmedTotal.toLocaleString()}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for shopping with FarmCare!</p>
          <p>For inquiries, contact us at support@farmcare.com</p>
        </div>
      </body>
      </html>
    `;
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.slice(0, 2) + "/" + v.slice(2, 4);
    }
    return v;
  };

  // Render different steps
  const renderCartReview = () => (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
          <Button onClick={() => navigate("/farm-store")}>
            Continue Shopping
          </Button>
        </div>
      ) : (
        <>
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium line-clamp-2">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">{item.seller}</p>
                    <p className="text-lg font-semibold text-primary mt-1">
                      ₦{item.price.toLocaleString()}
                    </p>
                    {item.stock && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {item.stock} units left
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          if (item.stock && item.quantity >= item.stock) {
                            toast.error(`Only ${item.stock} units available`);
                            return;
                          }
                          updateQuantity(item.id, item.quantity + 1);
                        }}
                        disabled={item.stock ? item.quantity >= item.stock : false}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );

  const renderDeliveryForm = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={deliveryDetails.fullName}
                onChange={(e) => setDeliveryDetails(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={deliveryDetails.phone}
                onChange={(e) => setDeliveryDetails(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+234..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Delivery Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Street Address *</Label>
            <Input
              id="address"
              value={deliveryDetails.address}
              onChange={(e) => setDeliveryDetails(prev => ({ ...prev, address: e.target.value }))}
              placeholder="House number, street name"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={deliveryDetails.city}
                onChange={(e) => setDeliveryDetails(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Enter city"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State/Province *</Label>
              <Input
                id="state"
                value={deliveryDetails.state}
                onChange={(e) => setDeliveryDetails(prev => ({ ...prev, state: e.target.value }))}
                placeholder="Enter state or province"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal/ZIP Code</Label>
              <Input
                id="postalCode"
                value={deliveryDetails.postalCode}
                onChange={(e) => setDeliveryDetails(prev => ({ ...prev, postalCode: e.target.value }))}
                placeholder="Enter postal code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Select
                value={deliveryDetails.country}
                onValueChange={(value) => setDeliveryDetails(prev => ({ ...prev, country: value }))}
              >
                <SelectTrigger id="country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Delivery Notes (Optional)</Label>
            <Input
              id="notes"
              value={deliveryDetails.notes}
              onChange={(e) => setDeliveryDetails(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any special instructions for delivery"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPaymentForm = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={paymentDetails.method}
            onValueChange={(value) => setPaymentDetails(prev => ({ ...prev, method: value as PaymentDetails["method"] }))}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  <span className="font-medium">Credit/Debit Card</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Pay securely with your card</p>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
              <RadioGroupItem value="bank_transfer" id="bank_transfer" />
              <Label htmlFor="bank_transfer" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  <span className="font-medium">Bank Transfer</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Transfer to our bank account</p>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
              <RadioGroupItem value="pay_on_delivery" id="pay_on_delivery" />
              <Label htmlFor="pay_on_delivery" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  <span className="font-medium">Pay on Delivery</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Pay when you receive your order</p>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {paymentDetails.method === "card" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Card Details
            </CardTitle>
            <CardDescription>Your payment information is encrypted and secure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                value={paymentDetails.cardNumber}
                onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardNumber: formatCardNumber(e.target.value) }))}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cardExpiry">Expiry Date</Label>
                <Input
                  id="cardExpiry"
                  value={paymentDetails.cardExpiry}
                  onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardExpiry: formatExpiry(e.target.value) }))}
                  placeholder="MM/YY"
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardCvv">CVV</Label>
                <Input
                  id="cardCvv"
                  type="password"
                  value={paymentDetails.cardCvv}
                  onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardCvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                  placeholder="123"
                  maxLength={4}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cardName">Cardholder Name</Label>
              <Input
                id="cardName"
                value={paymentDetails.cardName}
                onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardName: e.target.value }))}
                placeholder="Name on card"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {paymentDetails.method === "bank_transfer" && (
        <Card>
          <CardHeader>
            <CardTitle>Bank Transfer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p><span className="text-muted-foreground">Bank:</span> <strong>First Bank of Nigeria</strong></p>
              <p><span className="text-muted-foreground">Account Name:</span> <strong>FarmCare Agro Ltd</strong></p>
              <p><span className="text-muted-foreground">Account Number:</span> <strong>0123456789</strong></p>
            </div>
            <p className="text-sm text-muted-foreground">
              After payment, send proof to our WhatsApp or email. Your order will be processed within 24 hours of confirmation.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderConfirmation = () => (
    <div className="space-y-6">
      {orderNumber ? (
        <Card className="text-center py-8">
          <CardContent className="space-y-4">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">Order Placed Successfully!</h2>
            <p className="text-muted-foreground">Thank you for your order</p>
            <div className="p-4 bg-muted rounded-lg inline-block">
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="text-xl font-mono font-bold">{orderNumber}</p>
            </div>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              You will receive an SMS confirmation shortly. The seller will contact you to arrange delivery.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button variant="outline" onClick={handlePrintReceipt}>
                <Printer className="h-4 w-4 mr-2" />
                Print Receipt
              </Button>
              <Button variant="outline" onClick={handleDownloadReceipt}>
                <Download className="h-4 w-4 mr-2" />
                Download Receipt
              </Button>
            </div>
            <div className="pt-2">
              <Button onClick={() => navigate("/farm-store")} size="lg">
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded bg-muted overflow-hidden">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-medium line-clamp-1">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-semibold">₦{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₦{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span>₦{deliveryFee.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">₦{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>{deliveryDetails.fullName}</strong></p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" /> {deliveryDetails.phone}
              </p>
              <p className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>
                  {deliveryDetails.address}, {deliveryDetails.city}, {deliveryDetails.state} {deliveryDetails.postalCode}
                  <br />
                  {COUNTRIES.find(c => c.code === deliveryDetails.country)?.name || deliveryDetails.country}
                </span>
              </p>
              {deliveryDetails.notes && (
                <p className="text-sm italic text-muted-foreground">Note: {deliveryDetails.notes}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {paymentDetails.method === "card" && <CreditCard className="h-5 w-5" />}
                {paymentDetails.method === "bank_transfer" && <Package className="h-5 w-5" />}
                {paymentDetails.method === "pay_on_delivery" && <Truck className="h-5 w-5" />}
                <span className="font-medium">
                  {paymentDetails.method === "card" && `Card ending in ${paymentDetails.cardNumber.slice(-4)}`}
                  {paymentDetails.method === "bank_transfer" && "Bank Transfer"}
                  {paymentDetails.method === "pay_on_delivery" && "Pay on Delivery"}
                </span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;
              const isOrderPlaced = orderNumber && step.id === "confirmation";
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex flex-col items-center ${index > 0 ? "ml-4" : ""}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isActive || isCompleted || isOrderPlaced
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`text-xs mt-1 hidden sm:block ${isActive ? "font-medium" : "text-muted-foreground"}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`h-0.5 w-8 sm:w-16 mx-2 ${
                      isCompleted ? "bg-primary" : "bg-muted"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={progressValue} className="h-1" />
        </div>

        {/* Step Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {currentStep === "cart" && renderCartReview()}
            {currentStep === "delivery" && renderDeliveryForm()}
            {currentStep === "payment" && renderPaymentForm()}
            {currentStep === "confirmation" && renderConfirmation()}
          </div>

          {/* Order Summary Sidebar */}
          {!orderNumber && (
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Items ({items.reduce((a, b) => a + b.quantity, 0)})</span>
                      <span>₦{totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery</span>
                      <span>₦{deliveryFee.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">₦{grandTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {currentStep !== "cart" && (
                      <Button variant="outline" className="w-full" onClick={goToPrevStep}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                    )}
                    {currentStep === "confirmation" ? (
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={handlePlaceOrder}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>Processing...</>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Place Order
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button className="w-full" onClick={handleNextStep}>
                        Continue
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;

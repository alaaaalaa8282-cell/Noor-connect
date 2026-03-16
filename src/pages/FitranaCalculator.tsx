import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AppBar } from "@/components/AppBar";
import { PageTransition } from "@/components/PageTransition";
import { useIslamicCalendar } from "@/hooks/useIslamicCalendar";
import { useToast } from "@/hooks/use-toast";
import { 
  Calculator, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Info, 
  Plus, 
  Minus, 
  History,
  Download,
  Share2,
  Bell,
  Wallet,
  User
} from "lucide-react";
import { motion } from "framer-motion";

interface FamilyMember {
  id: string;
  name: string;
  age: 'adult' | 'child';
  fitranaAmount?: number;
}

interface PaymentRecord {
  id: string;
  year: number;
  totalAmount: number;
  familyMembers: number;
  paymentDate?: string;
  recipient?: string;
  paid: boolean;
}

interface FitranaData {
  familyMembers: FamilyMember[];
  pricePerKg: number;
  calculationMethod: 'weight' | 'saa' | 'amount';
  currency: string;
  paymentHistory: PaymentRecord[];
}

const FITRANA_STORAGE_KEY = 'fitrana-calculator-data';
const DEFAULT_PRICE_PER_KG = 100; // PKR
const SA_TO_KG = 2.5; // 1 Saa = 2.5 kg

// Islamic calculation methods
const CALCULATION_METHODS = [
  { value: 'weight', label: 'By Weight (2.5kg per person)', description: 'Standard Islamic calculation' },
  { value: 'saa', label: 'By Saa (traditional measure)', description: 'Traditional Islamic measurement' },
  { value: 'amount', label: 'By Amount', description: 'Direct amount entry' }
];

// Currencies
const CURRENCIES = [
  { value: 'PKR', label: 'Pakistani Rupee (PKR)', symbol: 'Rs.' },
  { value: 'USD', label: 'US Dollar (USD)', symbol: '$' },
  { value: 'EUR', label: 'Euro (EUR)', symbol: '€' },
  { value: 'GBP', label: 'British Pound (GBP)', symbol: '£' },
  { value: 'SAR', label: 'Saudi Riyal (SAR)', symbol: 'SR' }
];

export default function FitranaCalculator() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isEidAlFitr, isEidAlAdha, islamicInfo, isLoading } = useIslamicCalendar();

  // Determine if Fitrana calculator should be shown (1 week before, during, 1 week after Eid)
  const shouldShow = useMemo(() => {
    if (isLoading || !islamicInfo) return false;
    
    const hijriMonth = islamicInfo.hijriMonth;
    const hijriDay = islamicInfo.hijriDay;
    
    // 1 week before Eid al-Fitr (23-30 Ramadan)
    if (hijriMonth === 9 && hijriDay >= 23) return true;
    
    // Eid al-Fitr period (1-3 Shawwal)
    if (isEidAlFitr && hijriMonth === 10 && hijriDay <= 3) return true;
    
    // 1 week after Eid al-Fitr (4-10 Shawwal)
    if (hijriMonth === 10 && hijriDay >= 4 && hijriDay <= 10) return true;
    
    // 1 week before Eid al-Adha (3-9 Dhul Hijjah)
    if (hijriMonth === 12 && hijriDay >= 3 && hijriDay <= 9) return true;
    
    // Eid al-Adha period (10-12 Dhul Hijjah)
    if (isEidAlAdha && hijriMonth === 12 && hijriDay >= 10 && hijriDay <= 12) return true;
    
    // 1 week after Eid al-Adha (13-19 Dhul Hijjah)
    if (hijriMonth === 12 && hijriDay >= 13 && hijriDay <= 19) return true;
    
    return false;
  }, [isLoading, islamicInfo, isEidAlFitr, isEidAlAdha]);

  const [fitranaData, setFitranaData] = useState<FitranaData>(() => ({
    familyMembers: [{ id: '1', name: '', age: 'adult' }],
    pricePerKg: DEFAULT_PRICE_PER_KG,
    calculationMethod: 'weight',
    currency: 'PKR',
    paymentHistory: []
  }));

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem(FITRANA_STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setFitranaData(prev => ({ ...prev, ...data }));
      } catch (e) {
        console.error('Failed to parse saved Fitrana data');
      }
    }
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem(FITRANA_STORAGE_KEY, JSON.stringify(fitranaData));
  }, [fitranaData]);

  // Calculate Fitrana amounts
  const calculateFitrana = useMemo(() => {
    const { familyMembers, pricePerKg, calculationMethod } = fitranaData;
    
    return familyMembers.map(member => {
      let amount = 0;
      
      if (calculationMethod === 'weight') {
        amount = 2.5 * pricePerKg; // 2.5kg per person
      } else if (calculationMethod === 'saa') {
        amount = SA_TO_KG * pricePerKg; // 1 Saa = 2.5kg
      } else {
        amount = member.fitranaAmount || 0; // Direct amount
      }
      
      return { ...member, fitranaAmount: amount };
    });
  }, [fitranaData]);

  const totalFitrana = useMemo(() => {
    return calculateFitrana.reduce((sum, member) => sum + (member.fitranaAmount || 0), 0);
  }, [calculateFitrana]);

  const currencySymbol = useMemo(() => {
    const currency = CURRENCIES.find(c => c.value === fitranaData.currency);
    return currency?.symbol || 'Rs.';
  }, [fitranaData.currency]);

  const formatCurrency = useMemo(() => {
    return (amount: number) => {
      return `${currencySymbol} ${amount.toFixed(2)}`;
    };
  }, [currencySymbol]);

  // Add family member
  const addFamilyMember = () => {
    const newMember: FamilyMember = {
      id: Date.now().toString(),
      name: '',
      age: 'adult'
    };
    setFitranaData(prev => ({
      ...prev,
      familyMembers: [...prev.familyMembers, newMember]
    }));
  };

  // Remove family member
  const removeFamilyMember = (id: string) => {
    setFitranaData(prev => ({
      ...prev,
      familyMembers: prev.familyMembers.filter(member => member.id !== id)
    }));
  };

  // Update family member
  const updateFamilyMember = (id: string, field: keyof FamilyMember, value: any) => {
    setFitranaData(prev => ({
      ...prev,
      familyMembers: prev.familyMembers.map(member => 
        member.id === id ? { ...member, [field]: value } : member
      )
    }));
  };

  // Mark as paid
  const markAsPaid = () => {
    const currentYear = new Date().getFullYear();
    const newRecord: PaymentRecord = {
      id: Date.now().toString(),
      year: currentYear,
      totalAmount: totalFitrana,
      familyMembers: fitranaData.familyMembers.length,
      paymentDate: new Date().toISOString(),
      paid: true
    };

    setFitranaData(prev => ({
      ...prev,
      paymentHistory: [...prev.paymentHistory, newRecord]
    }));

    toast({
      title: "✅ Fitrana Paid!",
      description: `Successfully recorded ${formatCurrency(totalFitrana)} for ${fitranaData.familyMembers.length} family members.`,
    });
  };

  // Export payment history
  const exportHistory = () => {
    const history = fitranaData.paymentHistory;
    const csvContent = [
      ['Year', 'Family Members', 'Total Amount', 'Payment Date', 'Status'],
      ...history.map(record => [
        record.year,
        record.familyMembers,
        `${currencySymbol} ${record.totalAmount.toFixed(2)}`,
        record.paymentDate ? new Date(record.paymentDate).toLocaleDateString() : '',
        record.paid ? 'Paid' : 'Unpaid'
      ])
    ].map(row => row.join(','));

    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitrana-history-${new Date().getFullYear()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Payment history exported successfully.",
    });
  };

  // Share calculation
  const shareCalculation = () => {
    const text = `Fitrana Calculation:\nFamily Members: ${fitranaData.familyMembers.length}\nTotal Amount: ${formatCurrency(totalFitrana)}\nCalculation Method: ${fitranaData.calculationMethod}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Fitrana Calculation',
        text: text
      });
    } else {
      navigator.clipboard.writeText(text);
      toast({
        title: "Copied to Clipboard",
        description: "Calculation details copied successfully.",
      });
    }
  };

  // If not in Fitrana period, show message
  if (!shouldShow) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background pb-32">
          <AppBar title="Fitrana Calculator" showBack={true} />
          
          <div className="max-w-lg mx-auto p-4">
            <Card className="text-center p-8">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 rounded-full bg-muted">
                  <Calculator className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold">Fitrana Calculator Not Available</h2>
                <p className="text-muted-foreground">
                  The Fitrana Calculator is available 1 week before Eid and stays available for 1 week after Eid.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/services')}
                  className="mt-4"
                >
                  Back to Services
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-32">
        <AppBar title="Fitrana Calculator" showBack={true} />

        <div className="max-w-lg mx-auto p-4 space-y-4">
          {/* Info Card */}
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-primary mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">About Zakat al-Fitr</p>
                  <p className="text-xs text-muted-foreground">
                    Zakat al-Fitr is compulsory charity given before Eid prayer to purify fasting Muslims. 
                    It's typically calculated as 2.5kg of wheat or equivalent value per family member.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calculator Settings */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" />
                Calculator Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Calculation Method</Label>
                <Select 
                  value={fitranaData.calculationMethod} 
                  onValueChange={(value: 'weight' | 'saa' | 'amount') => 
                    setFitranaData(prev => ({ ...prev, calculationMethod: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CALCULATION_METHODS.map(method => (
                      <SelectItem key={method.value} value={method.value}>
                        <div>
                          <div className="font-medium">{method.label}</div>
                          <div className="text-xs text-muted-foreground">{method.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Currency</Label>
                  <Select 
                    value={fitranaData.currency} 
                    onValueChange={(value) => setFitranaData(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(currency => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Price per kg ({fitranaData.currency})</Label>
                  <Input
                    type="number"
                    value={fitranaData.pricePerKg}
                    onChange={(e) => setFitranaData(prev => ({ 
                      ...prev, 
                      pricePerKg: parseFloat(e.target.value) || 0 
                    }))}
                    placeholder="Enter price per kg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Family Members */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Family Members ({fitranaData.familyMembers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {fitranaData.familyMembers.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <div className="p-2 rounded-full bg-primary/10">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Name</Label>
                        <Input
                          value={member.name}
                          onChange={(e) => updateFamilyMember(member.id, 'name', e.target.value)}
                          placeholder="Enter name"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Age Type</Label>
                        <Select 
                          value={member.age}
                          onValueChange={(value: 'adult' | 'child') => 
                            updateFamilyMember(member.id, 'age', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="adult">Adult</SelectItem>
                            <SelectItem value="child">Child</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {fitranaData.calculationMethod === 'amount' && (
                      <div>
                        <Label className="text-xs">Fitrana Amount ({fitranaData.currency})</Label>
                        <Input
                          type="number"
                          value={member.fitranaAmount || ''}
                          onChange={(e) => updateFamilyMember(member.id, 'fitranaAmount', parseFloat(e.target.value) || 0)}
                          placeholder="Enter amount"
                        />
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatCurrency(calculateFitrana[index]?.fitranaAmount || 0)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFamilyMember(member.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
              
              <Button
                variant="outline"
                onClick={addFamilyMember}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Family Member
              </Button>
            </CardContent>
          </Card>

          {/* Total Result */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Total Fitrana Amount</h3>
                <div className="text-3xl font-bold text-primary">
                  {formatCurrency(totalFitrana)}
                </div>
                <p className="text-xs text-muted-foreground">
                  For {fitranaData.familyMembers.length} family members
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={markAsPaid}
              className="flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Mark as Paid
            </Button>
            <Button
              variant="outline"
              onClick={shareCalculation}
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>

          {/* FAQ Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="q1">
                  <AccordionTrigger>Who is obligated to pay Fitrana?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      Every Muslim who possesses wealth above the Nisab threshold is obligated to pay Fitrana. 
                      This includes adults who have enough food for their family for one day and night. 
                      Parents should pay on behalf of their minor children.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="q2">
                  <AccordionTrigger>How much Fitrana per person?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      The standard amount is 2.5kg of wheat, barley, dates, or equivalent value. 
                      In monetary terms, it's the value of 2.5kg of staple food in your local area. 
                      Some scholars suggest 3kg for those who can afford it.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="q3">
                  <AccordionTrigger>What if I can't afford the standard amount?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      If someone cannot afford the standard amount, they should pay what they can afford. 
                      The obligation is lifted for those in genuine financial hardship. 
                      Allah does not burden a soul beyond its capacity.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="q4">
                  <AccordionTrigger>Can I pay more than the calculated amount?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      Yes, you can pay more than the calculated amount. 
                      Additional Fitrana is considered voluntary charity (Sadaqa) and carries extra rewards. 
                      Many people give extra to help those in greater need.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="q5">
                  <AccordionTrigger>When should Fitrana be paid?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      Fitrana must be paid before Eid prayer begins. 
                      It's recommended to pay 1-2 days before Eid to ensure it reaches the needy in time. 
                      Some scholars allow payment until the end of Ramadan.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="q6">
                  <AccordionTrigger>What items can be given as Fitrana?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      Fitrana can be given as: wheat, barley, dates, raisins, cheese, or money. 
                      Money is preferred in modern times as it gives recipients flexibility to buy what they need. 
                      The amount should be equivalent to 2.5kg of staple food.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Payment History */}
          {fitranaData.paymentHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {fitranaData.paymentHistory.slice(-3).reverse().map(record => (
                    <div key={record.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="text-sm font-medium">{record.year}</p>
                        <p className="text-xs text-muted-foreground">
                          {record.familyMembers} members • {formatCurrency(record.totalAmount)}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs ${
                        record.paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.paid ? 'Paid' : 'Pending'}
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={exportHistory}
                    className="w-full flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export Full History
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

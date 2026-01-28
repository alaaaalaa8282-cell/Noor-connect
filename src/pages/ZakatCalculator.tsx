import { useState, useEffect } from "react";
import { AppBar } from "@/components/AppBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator, DollarSign, Info, Coins, Banknote, Building, Car } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ZakatAssets {
  cash: number;
  bankBalance: number;
  gold: number;
  silver: number;
  stocks: number;
  businessAssets: number;
  receivables: number;
  otherAssets: number;
}

interface ZakatLiabilities {
  debts: number;
  loans: number;
  bills: number;
}

const ZAKAT_STORAGE_KEY = 'zakat-calculator-data';
const NISAB_GOLD_GRAMS = 87.48; // grams of gold for nisab
const NISAB_SILVER_GRAMS = 612.36; // grams of silver for nisab
const ZAKAT_RATE = 0.025; // 2.5%

export default function ZakatCalculator() {
  const [assets, setAssets] = useState<ZakatAssets>({
    cash: 0,
    bankBalance: 0,
    gold: 0,
    silver: 0,
    stocks: 0,
    businessAssets: 0,
    receivables: 0,
    otherAssets: 0,
  });

  const [liabilities, setLiabilities] = useState<ZakatLiabilities>({
    debts: 0,
    loans: 0,
    bills: 0,
  });

  const [goldPrice, setGoldPrice] = useState(65); // USD per gram
  const [silverPrice, setSilverPrice] = useState(0.80); // USD per gram
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    const saved = localStorage.getItem(ZAKAT_STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.assets) setAssets(data.assets);
        if (data.liabilities) setLiabilities(data.liabilities);
        if (data.goldPrice) setGoldPrice(data.goldPrice);
        if (data.silverPrice) setSilverPrice(data.silverPrice);
        if (data.currency) setCurrency(data.currency);
      } catch (e) {
        console.error('Failed to parse saved zakat data');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(ZAKAT_STORAGE_KEY, JSON.stringify({
      assets,
      liabilities,
      goldPrice,
      silverPrice,
      currency,
    }));
  }, [assets, liabilities, goldPrice, silverPrice, currency]);

  const totalAssets = Object.values(assets).reduce((a, b) => a + b, 0);
  const totalLiabilities = Object.values(liabilities).reduce((a, b) => a + b, 0);
  const netWorth = totalAssets - totalLiabilities;
  const nisabGold = NISAB_GOLD_GRAMS * goldPrice;
  const nisabSilver = NISAB_SILVER_GRAMS * silverPrice;
  const nisab = Math.min(nisabGold, nisabSilver);
  const isZakatDue = netWorth >= nisab;
  const zakatAmount = isZakatDue ? netWorth * ZAKAT_RATE : 0;

  const updateAsset = (key: keyof ZakatAssets, value: string) => {
    const num = parseFloat(value) || 0;
    setAssets(prev => ({ ...prev, [key]: num }));
  };

  const updateLiability = (key: keyof ZakatLiabilities, value: string) => {
    const num = parseFloat(value) || 0;
    setLiabilities(prev => ({ ...prev, [key]: num }));
  };

  const resetCalculator = () => {
    setAssets({
      cash: 0,
      bankBalance: 0,
      gold: 0,
      silver: 0,
      stocks: 0,
      businessAssets: 0,
      receivables: 0,
      otherAssets: 0,
    });
    setLiabilities({ debts: 0, loans: 0, bills: 0 });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppBar title="Zakat Calculator" showBack />
      
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Info Card */}
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-primary mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">About Zakat</p>
                <p className="text-xs text-muted-foreground">
                  Zakat is 2.5% of your total wealth that exceeds the Nisab threshold for one lunar year. 
                  Current Nisab (Gold): {nisabGold.toFixed(2)} {currency} | (Silver): {nisabSilver.toFixed(2)} {currency}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metal Prices */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Coins className="w-4 h-4 text-primary" />
              Metal Prices (per gram)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Gold Price ({currency})</Label>
                <Input
                  type="number"
                  value={goldPrice || ''}
                  onChange={(e) => setGoldPrice(parseFloat(e.target.value) || 0)}
                  placeholder="65"
                />
              </div>
              <div>
                <Label className="text-xs">Silver Price ({currency})</Label>
                <Input
                  type="number"
                  value={silverPrice || ''}
                  onChange={(e) => setSilverPrice(parseFloat(e.target.value) || 0)}
                  placeholder="0.80"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assets */}
        <Accordion type="single" collapsible defaultValue="assets">
          <AccordionItem value="assets">
            <AccordionTrigger className="text-base font-semibold">
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-primary" />
                Assets ({currency} {totalAssets.toFixed(2)})
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div>
                  <Label className="text-xs">Cash on Hand</Label>
                  <Input
                    type="number"
                    value={assets.cash || ''}
                    onChange={(e) => updateAsset('cash', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-xs">Bank Balance</Label>
                  <Input
                    type="number"
                    value={assets.bankBalance || ''}
                    onChange={(e) => updateAsset('bankBalance', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-xs">Gold Value</Label>
                  <Input
                    type="number"
                    value={assets.gold || ''}
                    onChange={(e) => updateAsset('gold', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-xs">Silver Value</Label>
                  <Input
                    type="number"
                    value={assets.silver || ''}
                    onChange={(e) => updateAsset('silver', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-xs">Stocks & Investments</Label>
                  <Input
                    type="number"
                    value={assets.stocks || ''}
                    onChange={(e) => updateAsset('stocks', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-xs">Business Assets</Label>
                  <Input
                    type="number"
                    value={assets.businessAssets || ''}
                    onChange={(e) => updateAsset('businessAssets', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-xs">Money Owed to You</Label>
                  <Input
                    type="number"
                    value={assets.receivables || ''}
                    onChange={(e) => updateAsset('receivables', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-xs">Other Assets</Label>
                  <Input
                    type="number"
                    value={assets.otherAssets || ''}
                    onChange={(e) => updateAsset('otherAssets', e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Liabilities */}
        <Accordion type="single" collapsible>
          <AccordionItem value="liabilities">
            <AccordionTrigger className="text-base font-semibold">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-destructive" />
                Liabilities ({currency} {totalLiabilities.toFixed(2)})
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div>
                  <Label className="text-xs">Personal Debts</Label>
                  <Input
                    type="number"
                    value={liabilities.debts || ''}
                    onChange={(e) => updateLiability('debts', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-xs">Loans</Label>
                  <Input
                    type="number"
                    value={liabilities.loans || ''}
                    onChange={(e) => updateLiability('loans', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-xs">Due Bills & Payments</Label>
                  <Input
                    type="number"
                    value={liabilities.bills || ''}
                    onChange={(e) => updateLiability('bills', e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Results */}
        <Card className={`border-2 ${isZakatDue ? 'border-primary bg-primary/5' : 'border-muted'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Zakat Calculation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Assets:</span>
                <span className="font-medium">{currency} {totalAssets.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Liabilities:</span>
                <span className="font-medium text-destructive">- {currency} {totalLiabilities.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-medium">Net Worth:</span>
                <span className="font-bold">{currency} {netWorth.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nisab Threshold:</span>
                <span className="font-medium">{currency} {nisab.toFixed(2)}</span>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${isZakatDue ? 'bg-primary/20' : 'bg-muted'}`}>
              <div className="text-center">
                {isZakatDue ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-1">Your Zakat Due (2.5%)</p>
                    <p className="text-3xl font-bold text-primary">{currency} {zakatAmount.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      May Allah accept your Zakat and bless your wealth
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium">Zakat Not Due</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your net worth is below the Nisab threshold
                    </p>
                  </>
                )}
              </div>
            </div>

            <Button variant="outline" onClick={resetCalculator} className="w-full">
              Reset Calculator
            </Button>
          </CardContent>
        </Card>

        {/* Zakat Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Who Can Receive Zakat?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• The poor (Al-Fuqara)</li>
              <li>• The needy (Al-Masakin)</li>
              <li>• Zakat administrators (Al-Amilina Alayha)</li>
              <li>• Those whose hearts are to be reconciled (Al-Mu'allafah Qulubuhum)</li>
              <li>• Those in bondage (Fir-Riqab)</li>
              <li>• Those in debt (Al-Gharimun)</li>
              <li>• In the cause of Allah (Fi Sabilillah)</li>
              <li>• The wayfarer (Ibn As-Sabil)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

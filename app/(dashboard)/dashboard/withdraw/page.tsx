'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useUser } from '@/lib/auth';
import { useTheme } from '@/lib/theme-provider';
import Image from 'next/image';

interface GoldAsset {
  goldType: string;
  amount: string;
  purchasePrice: string;
}

interface RawGoldAsset extends GoldAsset {
  userId: number;
  id: number;
  createdAt: string;
  updatedAt: string;
}

const BAHT_TO_GRAM = 15.2; // 1 baht = 15.2 grams for 96.5% gold

const calculateBaht = (gramAmount: number) => {
  return (gramAmount / BAHT_TO_GRAM).toFixed(4);
};

export default function WithdrawPage() {
  const { user } = useUser();
  const { theme } = useTheme();
  const [assets, setAssets] = useState<GoldAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [gramAmount, setGramAmount] = useState('');
  const [contactDetails, setContactDetails] = useState({
    name: '',
    tel: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchAssets() {
      try {
        const response = await fetch('/api/gold-assets');
        if (response.ok) {
          const goldAssets = await response.json() as RawGoldAsset[];
          
          // Combine assets of the same type
          const combinedAssets = goldAssets.reduce<Record<string, GoldAsset>>((acc, asset) => {
            const amount = Number(asset.amount);
            if (amount <= 0) return acc;
            
            if (!acc[asset.goldType]) {
              acc[asset.goldType] = {
                goldType: asset.goldType,
                amount: amount.toString(),
                purchasePrice: asset.purchasePrice
              };
            } else {
              acc[asset.goldType].amount = (Number(acc[asset.goldType].amount) + amount).toString();
            }
            return acc;
          }, {});

          // Convert to array and filter out zero amounts
          const assetsArray = Object.values(combinedAssets);
          setAssets(assetsArray);
        }
      } catch (error) {
        console.error('Error fetching assets:', error);
        toast.error('Failed to fetch gold assets');
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchAssets();
    }
  }, [user]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAsset || !gramAmount) {
      toast.error('Please select an asset and enter withdrawal amount');
      return;
    }
  
    if (!contactDetails.name || !contactDetails.tel || !contactDetails.address) {
      toast.error('Please fill in all contact details');
      return;
    }
  
    const asset = assets.find(a => a.goldType === selectedAsset);
    if (!asset) {
      toast.error('Selected asset not found');
      return;
    }

    const bathAmount = calculateBaht(Number(gramAmount));
    if (Number(bathAmount) > Number(asset.amount)) {
      toast.error('Withdrawal amount exceeds available balance');
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      const response = await fetch('/api/withdraw-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goldType: selectedAsset,
          amount: bathAmount,
          ...contactDetails
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit withdrawal request');
      }
  
      // Update local state with new amount
      setAssets(prevAssets => 
        prevAssets.map(a => 
          a.goldType === selectedAsset 
            ? { ...a, amount: data.remainingAmount }
            : a
        )
      );
  
      toast.success('Withdrawal request submitted successfully');
      setSelectedAsset(null);
      setGramAmount('');
      setContactDetails({ name: '', tel: '', address: '' });
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit withdrawal request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className={`text-lg lg:text-2xl font-medium mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        Withdraw Gold
      </h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className={theme === 'dark' ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
          <CardHeader>
            <CardTitle className={`flex items-center space-x-2 ${theme === 'dark' ? 'text-white' : ''}`}>
              <LogOut className="h-6 w-6 text-orange-500" />
              <span>Withdraw Physical Gold</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleWithdraw} className="space-y-6">
              <div className="space-y-2">
                <Label className={theme === 'dark' ? 'text-white' : ''}>Select Gold Type</Label>
                <div className="grid gap-4">
                  {assets.map((asset) => (
                    <Button
                      key={asset.goldType}
                      type="button"
                      variant={selectedAsset === asset.goldType ? 'default' : 'outline'}
                      className={`w-full justify-start space-x-2 h-auto py-4 ${
                        selectedAsset === asset.goldType ? 'bg-orange-500 text-white hover:bg-orange-600' : 
                        theme === 'dark' ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white hover:bg-[#252525]' : ''
                      }`}
                      onClick={() => setSelectedAsset(asset.goldType)}
                    >
                      <div className="flex items-center space-x-4 w-full">
                        <Image 
                          src="/gold.png" 
                          alt="Gold" 
                          width={40} 
                          height={40}
                          className={`rounded-md ${theme === 'dark' ? 'brightness-[10]' : ''}`}
                        />
                        <div className="flex flex-col items-start">
                          <span>{asset.goldType}</span>
                          <div className="text-sm opacity-75">
                            <p>Available: {Number(asset.amount).toFixed(4)} บาท</p>
                            <p>({(Number(asset.amount) * BAHT_TO_GRAM).toFixed(2)} กรัม)</p>
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className={theme === 'dark' ? 'text-white' : ''}>
                  Withdrawal Amount (กรัม)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={gramAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    const asset = assets.find(a => a.goldType === selectedAsset);
                    if (!asset || Number(calculateBaht(Number(value))) <= Number(asset.amount)) {
                      setGramAmount(value);
                    }
                  }}
                  placeholder="Enter amount in grams"
                  className={`text-lg ${theme === 'dark' ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}`}
                />
                {gramAmount && (
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    = {calculateBaht(Number(gramAmount))} บาททอง
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className={theme === 'dark' ? 'text-white' : ''}>Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={contactDetails.name}
                  onChange={(e) => setContactDetails(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                  required
                  className={theme === 'dark' ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tel" className={theme === 'dark' ? 'text-white' : ''}>Telephone</Label>
                <Input
                  id="tel"
                  type="tel"
                  value={contactDetails.tel}
                  onChange={(e) => setContactDetails(prev => ({ ...prev, tel: e.target.value }))}
                  placeholder="Enter your phone number"
                  required
                  className={theme === 'dark' ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className={theme === 'dark' ? 'text-white' : ''}>Address</Label>
                <Input
                  id="address"
                  type="text"
                  value={contactDetails.address}
                  onChange={(e) => setContactDetails(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter your delivery address"
                  required
                  className={theme === 'dark' ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}
                />
              </div>

              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-[#1a1a1a] text-orange-400' : 'bg-orange-50 text-orange-800'}`}>
                <p>Important Notes:</p>
                <ul className={`list-disc ml-4 mt-2 space-y-1 ${theme === 'dark' ? 'text-gray-400' : 'text-orange-800'}`}>
                  
               
                  
                  <li>Processing time: 1-2 business days</li>
                  <li>หลังจากกดถอนกรุณา</li>
                </ul>
          
                <p className="text-sm text-blue-500">
                  <a href="http://m.me/4mangkorntong" target="_blank" rel="noopener noreferrer">
                    ติดต่อพนักงานเพื่อเลือกทอง
                  </a>
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                disabled={!selectedAsset || !gramAmount || Number(gramAmount) <= 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Request Withdrawal'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
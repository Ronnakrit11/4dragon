'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Upload, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useUser } from '@/lib/auth';
import Image from 'next/image';
import { useTheme } from '@/lib/theme-provider';

interface VerifiedSlip {
  id: number;
  amount: string;
  verifiedAt: string;
  status: 'completed' | 'pending';
}

interface DepositLimit {
  id: number;
  name: string;
  dailyLimit: string;
}

// Store used payloads in localStorage
const getStoredPayloads = (): string[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('usedPayloads');
  return stored ? JSON.parse(stored) : [];
};

const storePayload = (payload: string) => {
  const payloads = getStoredPayloads();
  payloads.push(payload);
  localStorage.setItem('usedPayloads', JSON.stringify(payloads));
};

export default function DepositPage() {
  const { user } = useUser();
  const { theme } = useTheme();
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentDeposits, setRecentDeposits] = useState<VerifiedSlip[]>([]);
  const [balance, setBalance] = useState(0);
  const [depositLimit, setDepositLimit] = useState<DepositLimit | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch recent deposits
        const depositsResponse = await fetch('/api/deposits/recent');
        if (depositsResponse.ok) {
          const depositsData = await depositsResponse.json();
          setRecentDeposits(depositsData);
        }

        // Fetch user's balance
        const balanceResponse = await fetch('/api/user/balance');
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          setBalance(Number(balanceData.balance));
        }

        // Fetch user's deposit limit
        const limitResponse = await fetch('/api/users/deposit-limit');
        if (limitResponse.ok) {
          const limitData = await limitResponse.json();
          setDepositLimit(limitData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }

    if (user) {
      fetchData();
    }
  }, [user]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !amount) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    // Check if amount exceeds remaining limit
    if (depositLimit) {
      const remainingLimit = Number(depositLimit.dailyLimit) - balance;
      if (Number(amount) > remainingLimit) {
        toast.error('ไม่สามารถเพิ่มเงินได้');
        return;
      }
    }

    try {
      setIsVerifying(true);
      setIsProcessing(true);

      const fileReader = new FileReader();
      
      fileReader.onload = async () => {
        const base64Content = fileReader.result?.toString() || '';
        const usedPayloads = getStoredPayloads();

        if (usedPayloads.includes(base64Content)) {
          setIsVerifying(false);
          setIsProcessing(false);
          toast.error('สลิปถูกใช้ไปแล้ว');
          return;
        }

        const formData = new FormData();
        formData.append('slip', selectedFile);
        formData.append('amount', amount);

        const response = await fetch('/api/verify-slip', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.message === 'slip_already_used') {
            storePayload(base64Content);
            toast.error('สลิปถูกใช้ไปแล้ว');
            return;
          }
          if (data.message === 'deposit_limit_exceeded') {
            toast.error(data.details);
            return;
          }
          throw new Error(data.message || 'Failed to verify slip');
        }

        if (data.status === 200) {
          storePayload(base64Content);
          
          toast.success('ยืนยันสลิปสำเร็จ');
          setAmount('');
          setSelectedMethod(null);
          setSelectedFile(null);
          
          const recentResponse = await fetch('/api/deposits/recent');
          if (recentResponse.ok) {
            const recentData = await recentResponse.json();
            setRecentDeposits(recentData);
          }

          // Update balance
          const balanceResponse = await fetch('/api/user/balance');
          if (balanceResponse.ok) {
            const balanceData = await balanceResponse.json();
            setBalance(Number(balanceData.balance));
          }
        } else {
          toast.error(data.message || 'สลิปไม่ถูกต้อง');
        }
      };

      fileReader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('Error processing deposit:', error);
      toast.error(error instanceof Error ? error.message : 'ไม่สามารถตรวจสอบสลิปได้');
    } finally {
      setIsVerifying(false);
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error('ขนาดไฟล์ต้องไม่เกิน 10MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('กรุณาอัพโหลดไฟล์รูปภาพเท่านั้น');
        return;
      }
      setSelectedFile(file);
    }
  };

  const paymentMethods = [
    {
      id: 'bank',
      name: 'Bank Transfer',
      accountInfo: 'Bank: 192-2-95245-7\nนายบรรณศาสตร์ วงษ์วิจิตสุข'
    }
  ];

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  // Calculate remaining deposit limit
  const remainingLimit = depositLimit ? Number(depositLimit.dailyLimit) - balance : 0;
  const canDeposit = depositLimit && Number(amount) <= remainingLimit;
  const showLimitError = amount && !canDeposit;

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className={`text-lg lg:text-2xl font-medium mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        Deposit Funds
      </h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className={theme === 'dark' ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
          <CardHeader>
            <CardTitle className={`flex items-center space-x-2 ${theme === 'dark' ? 'text-white' : ''}`}>
              <Wallet className="h-6 w-6 text-orange-500" />
              <span>Make a Deposit</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDeposit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="amount" className={theme === 'dark' ? 'text-white' : ''}>Amount (THB)</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min="0"
                  step="0.01"
                  className={`text-lg ${theme === 'dark' ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}`}
                />
                {depositLimit && (
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    <p>เงินสดในพอร์ต: ฿{balance.toLocaleString()}</p>
                    <p>วงเงินคงเหลือ: ฿{remainingLimit.toLocaleString()}</p>
                  </div>
                )}
                {showLimitError && (
                  <p className="text-sm text-red-500">
                    ไม่สามารถเพิ่มเงินได้
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className={theme === 'dark' ? 'text-white' : ''}>Select Payment Method</Label>
                <div className="grid gap-4">
                  {paymentMethods.map((method) => (
                    <Button
                      key={method.id}
                      type="button"
                      variant={selectedMethod === method.id ? 'default' : 'outline'}
                      className={`w-full justify-start space-x-2 h-auto py-4 ${
                        selectedMethod === method.id 
                          ? 'bg-orange-500 text-white hover:bg-orange-600' 
                          : theme === 'dark' 
                            ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white hover:bg-[#202020]'
                            : ''
                      }`}
                      onClick={() => setSelectedMethod(method.id)}
                      disabled={showLimitError}
                    >
                      <div className="flex items-center space-x-4 w-full">
                        <Image 
                          src="/kbank-logo.jpg" 
                          alt="Kbank Logo" 
                          width={70} 
                          height={60}
                          className="rounded-md"
                        />
                        <div className="flex flex-col items-start">
                          <span>{method.name}</span>
                          <span className="text-sm opacity-75 whitespace-pre-line">{method.accountInfo}</span>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slip" className={theme === 'dark' ? 'text-white' : ''}>Upload Transfer Slip</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="slip"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                    className="hidden"
                    disabled={showLimitError}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className={`w-full h-24 flex flex-col items-center justify-center border-dashed ${
                      theme === 'dark' 
                        ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white hover:bg-[#202020]'
                        : ''
                    }`}
                    onClick={() => document.getElementById('slip')?.click()}
                    disabled={showLimitError}
                  >
                    <Upload className="h-6 w-6 mb-2" />
                    {selectedFile ? (
                      <span className="text-sm">{selectedFile.name}</span>
                    ) : (
                      <span className="text-sm">Click to upload slip</span>
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                disabled={!amount || !selectedMethod || !selectedFile || isVerifying || isProcessing || !canDeposit}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Proceed with Deposit'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className={theme === 'dark' ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
          <CardHeader>
            <CardTitle className={theme === 'dark' ? 'text-white' : ''}>Recent Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDeposits.length > 0 ? (
                recentDeposits.map((deposit) => (
                  <div
                    key={deposit.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-[#1a1a1a] border-[#2A2A2A]'
                        : 'border-gray-200'
                    }`}
                  >
                    <div>
                      <p className={`font-medium ${theme === 'dark' ? 'text-white' : ''}`}>
                        {Number(deposit.amount).toLocaleString()} ฿
                      </p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatDate(deposit.verifiedAt)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        deposit.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {deposit.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  No recent deposits
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
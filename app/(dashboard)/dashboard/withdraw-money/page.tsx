'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useUser } from '@/lib/auth';
import { useTheme } from '@/lib/theme-provider';

interface BankAccount {
  bank: string;
  accountNumber: string;
  accountName: string;
}

const BANK_NAMES: { [key: string]: string } = {
  'ktb': 'ธนาคารกรุงไทย',
  'kbank': 'ธนาคารกสิกรไทย',
  'scb': 'ธนาคารไทยพาณิชย์',
  'gsb': 'ธนาคารออมสิน',
  'kkp': 'ธนาคารเกียรตินาคินภัทร'
};

export default function WithdrawMoneyPage() {
  const { user } = useUser();
  const { theme } = useTheme();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch user balance
        const balanceResponse = await fetch('/api/user/balance');
        const balanceData = await balanceResponse.json();
        setBalance(Number(balanceData.balance));

        // Fetch bank account details
        const bankResponse = await fetch('/api/user/bank-account');
        if (bankResponse.ok) {
          const bankData = await bankResponse.json();
          if (bankData && bankData.bank) {
            setBankAccount(bankData);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load account information');
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchData();
    }
  }, [user]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bankAccount) {
      toast.error('Please set up your bank account information first');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (Number(amount) > balance) {
      toast.error('Insufficient balance');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/withdraw-money/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Number(amount),
          bankAccount: {
            bank: bankAccount.bank,
            accountNumber: bankAccount.accountNumber,
            accountName: bankAccount.accountName
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit withdrawal request');
      }

      toast.success('Withdrawal request submitted successfully');
      setAmount('');
      
      // Refresh balance
      const balanceResponse = await fetch('/api/user/balance');
      const balanceData = await balanceResponse.json();
      setBalance(Number(balanceData.balance));
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      toast.error('Failed to submit withdrawal request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className={`text-lg lg:text-2xl font-medium mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        Withdraw Money
      </h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className={theme === 'dark' ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
          <CardHeader>
            <CardTitle className={`flex items-center space-x-2 ${theme === 'dark' ? 'text-white' : ''}`}>
              <Wallet className="h-6 w-6 text-orange-500" />
              <span>Withdraw Funds</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!bankAccount ? (
              <div className="text-center py-6">
                <p className={`mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Please set up your bank account information first
                </p>
                <Button 
                  onClick={() => window.location.href = '/dashboard/general'}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Set Up Bank Account
                </Button>
              </div>
            ) : (
              <form onSubmit={handleWithdraw} className="space-y-6">
                <div className={`bg-orange-50 p-4 rounded-lg ${theme === 'dark' ? 'bg-[#1a1a1a]' : ''}`}>
                  <p className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-800'}`}>
                    Bank Account Information
                  </p>
                  <div className="space-y-1">
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Bank: {BANK_NAMES[bankAccount.bank]}
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Account: {bankAccount.accountNumber}
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Name: {bankAccount.accountName}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className={theme === 'dark' ? 'text-white' : ''}>Available Balance</Label>
                  <p className="text-2xl font-bold text-orange-500">฿{balance.toLocaleString()}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount" className={theme === 'dark' ? 'text-white' : ''}>
                    Withdrawal Amount (THB)
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || (Number(value) >= 0 && Number(value) <= balance)) {
                        setAmount(value);
                      }
                    }}
                    placeholder="Enter amount to withdraw"
                    required
                    min="0"
                    max={balance}
                    className={`text-lg ${theme === 'dark' ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}`}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={!amount || Number(amount) <= 0 || Number(amount) > balance || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Submit Withdrawal Request'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

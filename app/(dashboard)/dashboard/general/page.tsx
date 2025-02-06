'use client';

import { startTransition, useActionState, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/lib/auth';
import { updateAccount, updateBankAccount } from '@/app/(login)/actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from '@/lib/theme-provider';

type ActionState = {
  error?: string;
  success?: string;
};

const BANK_OPTIONS = [
  { value: 'ktb', label: 'ธนาคารกรุงไทย' },
  { value: 'kbank', label: 'ธนาคารกสิกรไทย' },
  { value: 'scb', label: 'ธนาคารไทยพาณิชย์' },
  { value: 'gsb', label: 'ธนาคารออมสิน' },
  { value: 'kkp', label: 'ธนาคารเกียรตินาคินภัทร' }
];

export default function GeneralPage() {
  const { user } = useUser();
  const { theme } = useTheme();
  const [accountState, accountAction, isAccountPending] = useActionState<ActionState, FormData>(
    updateAccount,
    { error: '', success: '' }
  );

  const [bankState, bankAction, isBankPending] = useActionState<ActionState, FormData>(
    updateBankAccount,
    { error: '', success: '' }
  );

  const [bankAccount, setBankAccount] = useState({
    bank: '',
    accountNumber: '',
    accountName: ''
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBankAccount() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/user/bank-account');
        if (response.ok) {
          const data = await response.json();
          if (data) {
            setBankAccount({
              bank: data.bank || '',
              accountNumber: data.accountNumber || '',
              accountName: data.accountName || ''
            });
          }
        }
      } catch (error) {
        console.error('Error fetching bank account:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchBankAccount();
    }
  }, [user]);

  const handleAccountSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(() => {
      accountAction(new FormData(event.currentTarget));
    });
  };

  const handleBankSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const newBankData = {
      bank: formData.get('bank') as string,
      accountNumber: formData.get('bankAccountNo') as string,
      accountName: formData.get('bankAccountName') as string
    };
    
    setBankAccount(newBankData);
    
    startTransition(() => {
      bankAction(formData);
    });
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className={`text-lg lg:text-2xl font-medium mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        General Settings
      </h1>

      <div className="space-y-6">
        <Card className={theme === 'dark' ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
          <CardHeader>
            <CardTitle className={theme === 'dark' ? 'text-white' : ''}>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleAccountSubmit}>
              <div>
                <Label htmlFor="name" className={theme === 'dark' ? 'text-white' : ''}>Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter your name"
                  defaultValue={user?.name || ''}
                  required
                  className={theme === 'dark' ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}
                />
              </div>
              <div>
                <Label htmlFor="email" className={theme === 'dark' ? 'text-white' : ''}>Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  defaultValue={user?.email || ''}
                  required
                  className={theme === 'dark' ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}
                />
              </div>
              {accountState.error && (
                <p className="text-red-500 text-sm">{accountState.error}</p>
              )}
              {accountState.success && (
                <p className="text-green-500 text-sm">{accountState.success}</p>
              )}
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={isAccountPending}
              >
                {isAccountPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className={theme === 'dark' ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
          <CardHeader>
            <CardTitle className={theme === 'dark' ? 'text-white' : ''}>Bank Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleBankSubmit}>
                <div>
                  <Label htmlFor="bank" className={theme === 'dark' ? 'text-white' : ''}>Bank</Label>
                  <Select 
                    name="bank" 
                    required 
                    value={bankAccount.bank}
                    onValueChange={(value) => setBankAccount(prev => ({ ...prev, bank: value }))}
                  >
                    <SelectTrigger className={theme === 'dark' ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}>
                      <SelectValue placeholder="Select your bank" />
                    </SelectTrigger>
                    <SelectContent className={theme === 'dark' ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}>
                      {BANK_OPTIONS.map((bank) => (
                        <SelectItem 
                          key={bank.value} 
                          value={bank.value}
                          className={theme === 'dark' ? 'text-white focus:bg-[#252525]' : ''}
                        >
                          {bank.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bankAccountNo" className={theme === 'dark' ? 'text-white' : ''}>Bank Account Number</Label>
                  <Input
                    id="bankAccountNo"
                    name="bankAccountNo"
                    placeholder="Enter your bank account number"
                    value={bankAccount.accountNumber}
                    onChange={(e) => setBankAccount(prev => ({ ...prev, accountNumber: e.target.value }))}
                    required
                    className={theme === 'dark' ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="bankAccountName" className={theme === 'dark' ? 'text-white' : ''}>Name of Bank Account</Label>
                  <Input
                    id="bankAccountName"
                    name="bankAccountName"
                    placeholder="Enter name on bank account"
                    value={bankAccount.accountName}
                    onChange={(e) => setBankAccount(prev => ({ ...prev, accountName: e.target.value }))}
                    required
                    className={theme === 'dark' ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}
                  />
                </div>
                {bankState.error && (
                  <p className="text-red-500 text-sm">{bankState.error}</p>
                )}
                {bankState.success && (
                  <p className="text-green-500 text-sm">{bankState.success}</p>
                )}
                <Button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={isBankPending}
                >
                  {isBankPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Bank Details...
                    </>
                  ) : (
                    'Save Bank Details'
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

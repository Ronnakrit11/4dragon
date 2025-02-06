'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useUser } from '@/lib/auth';
import { useTheme } from '@/lib/theme-provider';

interface WithdrawalRequest {
  id: number;
  goldType: string;
  amount: string;
  name: string;
  tel: string;
  address: string;
  status: string;
  createdAt: string;
}

export default function WithdrawHistoryPage() {
  const { user } = useUser();
  const { theme } = useTheme();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWithdrawalHistory() {
      try {
        const response = await fetch('/api/withdraw-history');
        if (response.ok) {
          const data = await response.json();
          setWithdrawals(data);
        }
      } catch (error) {
        console.error('Error fetching withdrawal history:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchWithdrawalHistory();
    }
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className={`text-lg lg:text-2xl font-medium mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        Withdrawal History
      </h1>
      <Card className={theme === 'dark' ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
        <CardHeader>
          <CardTitle className={`flex items-center space-x-2 ${theme === 'dark' ? 'text-white' : ''}`}>
            <History className="h-6 w-6 text-orange-500" />
            <span>Your Withdrawal Requests</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : ''}`}>Loading...</div>
          ) : withdrawals.length > 0 ? (
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className={`border rounded-lg p-4 ${
                    theme === 'dark' 
                      ? 'bg-[#1a1a1a] border-[#2A2A2A] hover:bg-[#252525]' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className={`font-medium text-lg ${theme === 'dark' ? 'text-white' : ''}`}>
                        {withdrawal.name}
                      </h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        Tel: {withdrawal.tel}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${theme === 'dark' ? 'text-white' : ''}`}>
                        {withdrawal.goldType} - {Number(withdrawal.amount).toFixed(4)} บาท
                      </p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(withdrawal.createdAt).toLocaleString('th-TH')}
                      </p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs mt-2 ${getStatusColor(withdrawal.status)}`}>
                        {withdrawal.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-md ${
                    theme === 'dark' 
                      ? 'bg-[#252525] text-gray-300' 
                      : 'bg-gray-50 text-gray-600'
                  }`}>
                    <p className="text-sm">
                      <span className={`font-medium ${theme === 'dark' ? 'text-white' : ''}`}>
                        Delivery Address:
                      </span>
                      <br />
                      {withdrawal.address}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              No withdrawal history yet
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, ClipboardList, Loader2 } from 'lucide-react';
import { useUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTheme } from '@/lib/theme-provider';

interface WithdrawalRequest {
  id: number;
  userId: number;
  goldType: string;
  amount: string;
  name: string;
  tel: string;
  address: string;
  status: string;
  createdAt: string;
  user: {
    email: string;
    name: string | null;
  };
}

export default function WithdrawListPage() {
  const { user } = useUser();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    fetchWithdrawals();
  }, [user]);

  async function fetchWithdrawals() {
    try {
      const response = await fetch('/api/withdraw-requests');
      if (response.ok) {
        const data = await response.json();
        setWithdrawals(data);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleStatusUpdate = async (id: number, status: 'approved' | 'rejected') => {
    setProcessingId(id);
    try {
      const response = await fetch('/api/withdraw-requests/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast.success(`Withdrawal request ${status} successfully`);
      await fetchWithdrawals();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update withdrawal status');
    } finally {
      setProcessingId(null);
    }
  };

  if (!user) {
    redirect('/sign-in');
  }

  if (user.role !== 'admin') {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <Card className={isDark ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShieldAlert className="h-12 w-12 text-orange-500 mb-4" />
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Access Denied</h2>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-center max-w-md`}>
              Only administrators have access to the withdrawal list. Please contact an administrator for assistance.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className={`text-lg lg:text-2xl font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
        ประวัติการถอนทองทั้งหมด
      </h1>
      <Card className={isDark ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ClipboardList className="h-6 w-6 text-orange-500" />
            <span className={isDark ? 'text-white' : ''}>Pending Withdrawals</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : withdrawals.length > 0 ? (
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className={`${isDark ? 'bg-[#151515] hover:bg-[#151515]' : 'bg-white hover:bg-gray-50'} border ${isDark ? 'border-[#2A2A2A]' : 'border-gray-200'} rounded-lg p-4`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className={`font-medium text-lg ${isDark ? 'text-white' : ''}`}>{withdrawal.name}</h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Requested by: {withdrawal.user.email}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Tel: {withdrawal.tel}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${isDark ? 'text-white' : ''}`}>
                        {withdrawal.goldType} - {Number(withdrawal.amount).toFixed(4)} บาท
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(withdrawal.createdAt).toLocaleString('th-TH')}
                      </p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs mt-2 ${
                        withdrawal.status === 'approved' ? 'bg-green-100 text-green-800' :
                        withdrawal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {withdrawal.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className={`${isDark ? 'bg-[#151515]' : 'bg-gray-50'} p-3 rounded-md mb-4`}>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <span className="font-medium">Delivery Address:</span><br />
                      {withdrawal.address}
                    </p>
                  </div>
                  {withdrawal.status === 'pending' && (
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className={`text-red-600 ${isDark ? 'border-red-600 hover:bg-red-950' : 'border-red-600 hover:bg-red-50'}`}
                        onClick={() => handleStatusUpdate(withdrawal.id, 'rejected')}
                        disabled={processingId === withdrawal.id}
                      >
                        {processingId === withdrawal.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Reject'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleStatusUpdate(withdrawal.id, 'approved')}
                        disabled={processingId === withdrawal.id}
                      >
                        {processingId === withdrawal.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Approve'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              No withdrawal requests yet
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
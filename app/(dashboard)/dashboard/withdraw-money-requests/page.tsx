'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, BanknoteIcon, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useUser } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTheme } from '@/lib/theme-provider';

interface WithdrawalRequest {
  id: number;
  userId: number;
  amount: string;
  bank: string;
  accountNumber: string;
  accountName: string;
  status: string;
  createdAt: string;
  user: {
    email: string;
    name: string | null;
  };
}

const BANK_NAMES: { [key: string]: string } = {
  'ktb': 'ธนาคารกรุงไทย',
  'kbank': 'ธนาคารกสิกรไทย',
  'scb': 'ธนาคารไทยพาณิชย์',
  'gsb': 'ธนาคารออมสิน',
  'kkp': 'ธนาคารเกียรตินาคินภัทร'
};

export default function WithdrawMoneyRequestsPage() {
  const { user } = useUser();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      const response = await fetch('/api/withdraw-money/requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
      toast.error('Failed to fetch withdrawal requests');
    } finally {
      setLoading(false);
    }
  }

  const handleStatusUpdate = async (id: number, status: 'approved' | 'rejected') => {
    setProcessingId(id);
    try {
      const response = await fetch('/api/withdraw-money/update-status', {
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
      await fetchRequests();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update withdrawal status');
    } finally {
      setProcessingId(null);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <Card className={isDark ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShieldAlert className="h-12 w-12 text-orange-500 mb-4" />
            <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Access Denied</h2>
            <p className={`text-center max-w-md ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Only administrators have access to withdrawal requests management.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className={`text-lg lg:text-2xl font-medium mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        ประวัติการขอถอนเงินทั้งหมด
      </h1>

      <Card className={isDark ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BanknoteIcon className="h-6 w-6 text-orange-500" />
            <span className={isDark ? 'text-white' : ''}>Pending Withdrawals</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className={`border rounded-lg p-4 ${
                    isDark 
                      ? 'bg-[#151515] border-[#2A2A2A] hover:bg-[#1a1a1a]' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className={`font-medium text-lg ${isDark ? 'text-white' : ''}`}>
                        {request.accountName}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Requested by: {request.user.email}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Bank: {BANK_NAMES[request.bank]}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Account: {request.accountNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium text-lg text-orange-500`}>
                        ฿{Number(request.amount).toLocaleString()}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(request.createdAt).toLocaleString('th-TH')}
                      </p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs mt-2 ${
                        request.status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : request.status === 'rejected' 
                            ? 'bg-red-100 text-red-800' 
                            : isDark 
                              ? 'bg-yellow-900/30 text-yellow-200'
                              : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {request.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  {request.status === 'pending' && (
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className={`border-red-600 hover:bg-red-50 ${
                          isDark 
                            ? 'text-red-400 hover:bg-red-950/30' 
                            : 'text-red-600'
                        }`}
                        onClick={() => handleStatusUpdate(request.id, 'rejected')}
                        disabled={processingId === request.id}
                      >
                        {processingId === request.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        className={`${
                          isDark 
                            ? 'bg-green-700 hover:bg-green-600' 
                            : 'bg-green-600 hover:bg-green-700'
                        } text-white`}
                        onClick={() => handleStatusUpdate(request.id, 'approved')}
                        disabled={processingId === request.id}
                      >
                        {processingId === request.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </>
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

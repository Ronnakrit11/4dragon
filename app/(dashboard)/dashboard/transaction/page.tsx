'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useUser } from '@/lib/auth';
import { useTheme } from '@/lib/theme-provider';

interface Transaction {
  id: number;
  goldType: string;
  amount: string;
  pricePerUnit: string;
  totalPrice: string;
  type: 'buy' | 'sell';
  createdAt: string;
  user?: {
    id: number;
    name: string | null;
    email: string;
  };
}

export default function TransactionPage() {
  const { user } = useUser();
  const { theme } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.email === 'ronnakritnook1@gmail.com';

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const response = await fetch('/api/transactions/history');
        if (response.ok) {
          const data = await response.json();
          setTransactions(data);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, []);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className={`text-lg lg:text-2xl font-medium mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        Transaction History
      </h1>
      <Card className={theme === 'dark' ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
        <CardHeader>
          <CardTitle className={`flex items-center space-x-2 ${theme === 'dark' ? 'text-white' : ''}`}>
            <FileText className="h-6 w-6 text-orange-500" />
            <span>{isAdmin ? 'All User Transactions' : 'Your Transactions'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Loading transactions...</div>
          ) : transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                    theme === 'dark' 
                      ? 'bg-[#1a1a1a] border-[#2A2A2A] hover:bg-[#202020]' 
                      : 'hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'buy' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {transaction.type === 'buy' ? (
                        <ArrowDownCircle className="h-6 w-6" />
                      ) : (
                        <ArrowUpCircle className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {transaction.type === 'buy' ? 'ซื้อ' : 'ขาย'} {transaction.goldType}
                      </p>
                      {isAdmin && transaction.user && (
                        <p className="text-sm text-orange-600">
                          by {transaction.user.name || transaction.user.email}
                        </p>
                      )}
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(transaction.createdAt).toLocaleString('th-TH')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      transaction.type === 'buy' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {transaction.type === 'buy' ? '-' : '+'}฿{Number(transaction.totalPrice).toLocaleString()}
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {Number(transaction.amount).toFixed(4)} บาท @ ฿{Number(transaction.pricePerUnit).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              ยังไม่มีประวัติการทำรายการ
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

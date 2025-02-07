'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, PiggyBank, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useUser } from '@/lib/auth';
import { useTheme } from '@/lib/theme-provider';
import { pusherClient } from '@/lib/pusher';

interface GoldHolding {
  goldType: string;
  totalAmount: string;
  totalValue: string;
  averagePrice: string;
}

interface UserSummary {
  userId: number;
  userName: string | null;
  userEmail: string;
  userRole: string;
  goldType: string;
  totalAmount: string;
  totalValue: string;
}

interface SummaryData {
  goldHoldings: GoldHolding[];
  userSummaries: UserSummary[];
  adminStock: string;
}

interface GoldAsset {
  goldType: string;
  amount: string;
  purchasePrice: string;
  userId: number;
}

const BAHT_TO_GRAM = 15.2; // 1 baht = 15.2 grams for 96.5% gold
const GOLD_TYPE = 'ทองสมาคม 96.5%';

const calculateGrams = (bathAmount: number) => {
  return (bathAmount * BAHT_TO_GRAM).toFixed(2);
};

const SavingsSummaryPage = () => {
  const { user } = useUser();
  const { theme } = useTheme();
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminStock, setAdminStock] = useState({
    amount: 0,
    grams: 0
  });
  const [totalUserGoldAmount, setTotalUserGoldAmount] = useState(0);
  const isDark = theme === 'dark';

  const fetchData = async () => {
    try {
      const [summaryResponse, assetsResponse] = await Promise.all([
        fetch('/api/admin/savings-summary'),
        fetch('/api/gold-assets')
      ]);

      if (summaryResponse.ok && assetsResponse.ok) {
        const [summaryData, assetsData] = await Promise.all([
          summaryResponse.json(),
          assetsResponse.json()
        ]);

        // Calculate admin's total stock from assets
        const adminAssets = (assetsData as GoldAsset[]).filter(asset => 
          asset.goldType === GOLD_TYPE
        );

        const totalStock = adminAssets.reduce((total: number, asset: GoldAsset) => 
          total + Number(asset.amount), 0
        );

        setAdminStock({
          amount: totalStock,
          grams: Number(calculateGrams(totalStock))
        });

        // Filter user summaries to only include the correct gold type
        const filteredSummaries = summaryData.userSummaries.filter(
          (summary: UserSummary) => summary.goldType === GOLD_TYPE && summary.userRole !== 'admin'
        );

        // Group summaries by user and combine amounts
        const groupedSummaries = filteredSummaries.reduce((acc: UserSummary[], summary: UserSummary) => {
          const existingUser = acc.find(s => s.userId === summary.userId);
          if (existingUser) {
            existingUser.totalAmount = (Number(existingUser.totalAmount) + Number(summary.totalAmount)).toString();
            existingUser.totalValue = (Number(existingUser.totalValue) + Number(summary.totalValue)).toString();
          } else if (Number(summary.totalAmount) > 0) {
            acc.push(summary);
          }
          return acc;
        }, []);

        setSummaryData({
          ...summaryData,
          userSummaries: groupedSummaries
        });

        // Calculate total user gold amount
        const totalUserAmount = groupedSummaries.reduce(
          (sum: number, summary: UserSummary) => sum + Number(summary.totalAmount),
          0
        );
        setTotalUserGoldAmount(totalUserAmount);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();

      // Subscribe to real-time updates
      const channel = pusherClient.subscribe('gold-transactions');
      
      // Listen for buy/sell transactions
      channel.bind('transaction', () => {
        fetchData();
      });

      return () => {
        channel.unbind_all();
        pusherClient.unsubscribe('gold-transactions');
      };
    }
  }, [user]);

  if (!user || user.role !== 'admin') {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <Card className={isDark ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShieldAlert className="h-12 w-12 text-orange-500 mb-4" />
            <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Access Denied</h2>
            <p className={`text-center max-w-md ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Only administrators have access to the savings summary.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Loading summary...
        </div>
      </section>
    );
  }

  if (!summaryData) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          No data available
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className={`text-lg lg:text-2xl font-medium mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        สรุปการออมทอง
      </h1>

      <Card className={`mb-8 ${isDark ? 'bg-[#151515] border-[#2A2A2A]' : ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PiggyBank className="h-6 w-6 text-orange-500" />
            <span className={isDark ? 'text-white' : ''}>สรุปรวมทั้งหมด</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Total Stock */}
            <div className={`p-4 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : ''}`}>
                จำนวนรวม (Stock)
              </h3>
              <div className={`space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <p>{adminStock.amount.toFixed(4)} บาท</p>
                <p>({adminStock.grams.toFixed(2)} กรัม)</p>
              </div>
            </div>

            {/* User Holdings */}
            <div className={`p-4 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : ''}`}>
                ลูกค้าถือครองทั้งหมด
              </h3>
              <div className={`space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <p>{totalUserGoldAmount.toFixed(4)} บาท</p>
                <p>({calculateGrams(totalUserGoldAmount)} กรัม)</p>
              </div>
            </div>

            {/* Available Gold */}
            <div className={`p-4 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : ''}`}>
                คงเหลือ
              </h3>
              <div className={`space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <p>{(adminStock.amount - totalUserGoldAmount).toFixed(4)} บาท</p>
                <p>({(adminStock.grams - Number(calculateGrams(totalUserGoldAmount))).toFixed(2)} กรัม)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User-specific Summaries */}
      <Card className={isDark ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-orange-500" />
            <span className={isDark ? 'text-white' : ''}>สรุปรายบุคคล</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {summaryData.userSummaries.map((summary) => (
              <div
                key={summary.userId}
                className={`p-4 border rounded-lg ${
                  isDark ? 'border-[#2A2A2A] bg-[#1a1a1a]' : 'border-gray-200'
                }`}
              >
                <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : ''}`}>
                  {summary.userName || summary.userEmail}
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-[#252525]' : 'bg-gray-50'}`}>
                    <p className={`font-medium mb-2 ${isDark ? 'text-white' : ''}`}>
                      {summary.goldType}
                    </p>
                    <div className={`space-y-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <p>จำนวน: {Number(summary.totalAmount).toFixed(4)} บาท</p>
                      <p>({calculateGrams(Number(summary.totalAmount))} กรัม)</p>
                      <p>มูลค่า: ฿{Number(summary.totalValue).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default SavingsSummaryPage;
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, PiggyBank, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useUser } from '@/lib/auth';
import { useTheme } from '@/lib/theme-provider';

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
  goldType: string;
  totalAmount: string;
  totalValue: string;
}

interface SummaryData {
  goldHoldings: GoldHolding[];
  userSummaries: UserSummary[];
}

const SavingsSummaryPage = () => {
  const { user } = useUser();
  const { theme } = useTheme();
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const isDark = theme === 'dark';

  useEffect(() => {
    async function fetchSummary() {
      try {
        const response = await fetch('/api/admin/savings-summary');
        if (response.ok) {
          const data = await response.json();
          setSummaryData(data);
        }
      } catch (error) {
        console.error('Error fetching savings summary:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchSummary();
    }
  }, [user]);

  if (!user || user.role !== 'admin') {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <Card className={isDark ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShieldAlert className="h-12 w-12 text-orange-500 mb-4" />
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Access Denied</h2>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-center max-w-md`}>
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

  const totalGoldValue = summaryData.goldHoldings.reduce(
    (sum, holding) => sum + Number(holding.totalValue),
    0
  );

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className={`text-lg lg:text-2xl font-medium mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        สรุปการออมทอง
      </h1>

      {/* Overall Summary */}
      <Card className={`mb-8 ${isDark ? 'bg-[#151515] border-[#2A2A2A]' : ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PiggyBank className="h-6 w-6 text-orange-500" />
            <span className={isDark ? 'text-white' : ''}>สรุปรวมทั้งหมด</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {summaryData.goldHoldings.map((holding) => (
              <div
                key={holding.goldType}
                className={`p-4 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}
              >
                <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : ''}`}>
                  {holding.goldType}
                </h3>
                <div className={`space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <p>จำนวนรวม: {Number(holding.totalAmount).toFixed(4)} บาท</p>
                  <p>มูลค่ารวม: ฿{Number(holding.totalValue).toLocaleString()}</p>
                  <p>ราคาเฉลี่ย: ฿{Number(holding.averagePrice).toLocaleString()}</p>
                </div>
              </div>
            ))}
            <div className={`p-4 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : ''}`}>
                มูลค่ารวมทั้งหมด
              </h3>
              <p className="text-2xl font-bold text-orange-500">
                ฿{totalGoldValue.toLocaleString()}
              </p>
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
            {Object.values(
              summaryData.userSummaries.reduce<{[key: string]: {
                user: { name: string | null; email: string };
                holdings: UserSummary[];
              }}>((acc, summary) => {
                const key = summary.userId.toString();
                if (!acc[key]) {
                  acc[key] = {
                    user: { name: summary.userName, email: summary.userEmail },
                    holdings: []
                  };
                }
                acc[key].holdings.push(summary);
                return acc;
              }, {})
            ).map(({ user, holdings }) => (
              <div
                key={holdings[0].userId}
                className={`p-4 border rounded-lg ${
                  isDark ? 'border-[#2A2A2A] bg-[#1a1a1a]' : 'border-gray-200'
                }`}
              >
                <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : ''}`}>
                  {user.name || user.email}
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {holdings.map((holding, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${isDark ? 'bg-[#252525]' : 'bg-gray-50'}`}
                    >
                      <p className={`font-medium mb-2 ${isDark ? 'text-white' : ''}`}>
                        {holding.goldType}
                      </p>
                      <div className={`space-y-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <p>จำนวน: {Number(holding.totalAmount).toFixed(4)} บาท</p>
                        <p>มูลค่า: ฿{Number(holding.totalValue).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
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
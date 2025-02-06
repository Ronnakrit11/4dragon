'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2, Wallet, PieChart } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { AssetSkeleton } from '@/components/AssetSkeleton';
import { useTheme } from '@/lib/theme-provider';

interface GoldAsset {
  goldType: string;
  amount: string;
  purchasePrice: string;
  totalCost: string;
  averageCost: string;
}

interface GoldPrice {
  name: string;
  bid: string | number;
  ask: string | number;
  diff: string | number;
}

interface AssetData {
  balance: string;
  assets: GoldAsset[];
}

const PRICE_ADJUSTMENT = 50; // Fixed 50 baht adjustment
const BAHT_TO_GRAM = 15.2; // 1 baht = 15.2 grams for 96.5% gold

export default function AssetPage() {
  const { theme } = useTheme();
  const [assetData, setAssetData] = useState<AssetData | null>(null);
  const [prices, setPrices] = useState<GoldPrice[]>([]);
  const [loading, setLoading] = useState(true);

  const calculateGrams = (bathAmount: number) => {
    return (bathAmount * BAHT_TO_GRAM).toFixed(2);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [assetResponse, pricesResponse] = await Promise.all([
          fetch('/api/asset-data'),
          fetch('/api/gold')
        ]);

        if (assetResponse.ok && pricesResponse.ok) {
          const [assetData, pricesData] = await Promise.all([
            assetResponse.json(),
            pricesResponse.json()
          ]);

          setAssetData(assetData);
          setPrices(pricesData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const getBuybackPrice = useMemo(() => {
    const priceMap: Record<string, string> = {
      'ทองสมาคม 96.5%': 'สมาคมฯ',
      'ทอง 99.99%': '99.99%',
      'ทอง 96.5%': '96.5%'
    };
    
    return (goldType: string) => {
      const price = prices.find(p => p.name === priceMap[goldType]);
      if (!price) return 0;
      const baseBidPrice = Number(price.bid);
      return baseBidPrice - PRICE_ADJUSTMENT; // Apply -50 baht adjustment for sell price
    };
  }, [prices]);

  const totalAssetValue = useMemo(() => {
    if (!assetData?.assets) return 0;
    return assetData.assets.reduce((total, asset) => {
      const buybackPrice = getBuybackPrice(asset.goldType);
      return total + (Number(asset.amount) * buybackPrice);
    }, 0);
  }, [assetData?.assets, getBuybackPrice]);

  const totalAccountValue = useMemo(() => {
    return totalAssetValue + (assetData ? Number(assetData.balance) : 0);
  }, [totalAssetValue, assetData]);

  if (loading) {
    return <AssetSkeleton />;
  }

  if (!assetData) {
    return <div>Error loading asset data</div>;
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className={`text-lg lg:text-2xl font-medium mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        Asset Overview
      </h1>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card className={`md:col-span-3 ${theme === 'dark' ? 'bg-[#151515] border-[#2A2A2A]' : ''}`}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-6 w-6 text-orange-500" />
              <span className={`text-sm ${theme === 'dark' ? 'text-white' : ''}`}>Account Value</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-center md:text-left">
                <p className="text-xl font-bold text-orange-500">
                  {totalAccountValue.toLocaleString()} ฿
                </p>
                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  มูลค่ารวมในพอร์ต
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={theme === 'dark' ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wallet className="h-6 w-6 text-orange-500" />
              <span className={`text-sm ${theme === 'dark' ? 'text-white' : ''}`}>เงินสดในพอร์ต</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-2">
              <p className="text-xl font-bold text-orange-500">
                {Number(assetData.balance).toLocaleString()} ฿
              </p>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Total Available Balance
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className={`md:col-span-2 ${theme === 'dark' ? 'bg-[#151515] border-[#2A2A2A]' : ''}`}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart2 className="h-6 w-6 text-orange-500" />
              <span className={`text-sm ${theme === 'dark' ? 'text-white' : ''}`}>Asset Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-2">
              <p className="text-xl font-bold text-orange-500">
                {totalAssetValue.toLocaleString()} ฿
              </p>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Total Asset Value (at current buy-back prices)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className={`mt-8 ${theme === 'dark' ? 'bg-[#151515] border-[#2A2A2A]' : ''}`}>
        <CardHeader>
          <CardTitle className={theme === 'dark' ? 'text-white' : ''}>Asset Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          {assetData.assets.length > 0 ? (
            <div className="space-y-4">
              {assetData.assets.map((asset, index) => {
                const buybackPrice = getBuybackPrice(asset.goldType);
                const currentValue = Number(asset.amount) * buybackPrice;
                const purchaseValue = Number(asset.totalCost);
                const avgCost = Number(asset.averageCost);
                const profitLoss = currentValue - purchaseValue;
                const profitLossPercentage = purchaseValue !== 0 ? 
                  (profitLoss / purchaseValue) * 100 : 0;

                return (
                  <div 
                    key={index}
                    className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                      theme === 'dark' ? 'border-[#2A2A2A] hover:bg-[#1a1a1a]' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-0">
                      <div>
                        <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : ''}`}>
                          {asset.goldType}
                        </h3>
                        <div className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          <p>จำนวน: {Number(asset.amount).toFixed(4)} บาท</p>
                          <p>({calculateGrams(Number(asset.amount))} กรัม)</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium mb-1 ${theme === 'dark' ? 'text-white' : ''}`}>
                          ฿{currentValue.toLocaleString()}
                        </p>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          ราคารับซื้อ: ฿{buybackPrice.toLocaleString()} บาท
                        </p>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          (ขาย: ฿{buybackPrice.toLocaleString()} บาท)
                        </p>
                        <p className={`text-sm ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {profitLoss >= 0 ? '+' : ''}{profitLoss.toLocaleString()} 
                          ({profitLossPercentage.toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between text-[13px] pt-0">
                      <div>
                        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                          ต้นทุนเฉลี่ย: ฿{avgCost.toLocaleString()}
                        </p>
                        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                          ต้นทุนรวม: ฿{purchaseValue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              You don't have any gold assets yet
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
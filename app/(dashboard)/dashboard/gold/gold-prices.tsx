'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useTheme } from '@/lib/theme-provider';
import { pusherClient } from '@/lib/pusher';

interface GoldPrice {
  name: string;
  bid: string | number;
  ask: string | number;
  diff: string | number;
}

interface GoldAsset {
  goldType: string;
  amount: string;
  purchasePrice: string;
}

interface Transaction {
  id: number;
  goldType: string;
  amount: string;
  pricePerUnit: string;
  totalPrice: string;
  type: 'buy' | 'sell';
  createdAt: string;
}

interface TransactionSummary {
  goldType: string;
  units: number;
  price: number;
  total: number;
  isSell?: boolean;
  averageCost: number;
  totalCost: number;
  previousAvgCost?: number;
  previousTotalCost?: number;
}

const GOLD_TYPE = "ทองสมาคม 96.5%"; // Gold type name
const BAHT_TO_GRAM = 15.2; // 1 baht = 15.2 grams for 96.5% gold

export function GoldPrices() {
  const { theme } = useTheme();
  const [prices, setPrices] = useState<GoldPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [balance, setBalance] = useState(0);
  const [assets, setAssets] = useState<GoldAsset[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<GoldPrice | null>(null);
  const [isBuyDialogOpen, setIsBuyDialogOpen] = useState(false);
  const [isSellDialogOpen, setIsSellDialogOpen] = useState(false);
  const [moneyAmount, setMoneyAmount] = useState('');
  const [sellUnits, setSellUnits] = useState('');
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [transactionSummary, setTransactionSummary] = useState<TransactionSummary | null>(null);
  const [isBuyProcessing, setIsBuyProcessing] = useState(false);
  const [isSellProcessing, setIsSellProcessing] = useState(false);

  useEffect(() => {
    fetchData();

    const channel = pusherClient.subscribe('gold-prices');
    channel.bind('price-update', (data: { prices: GoldPrice[] }) => {
      const goldAssociationPrice = data.prices.find(price => price.name === 'สมาคมฯ');
      if (goldAssociationPrice) {
        setPrices([goldAssociationPrice]);
      }
      setLastUpdate(new Date());
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, []);

  async function fetchData() {
    try {
      const [pricesResponse, balanceResponse, assetsResponse] = await Promise.all([
        fetch('/api/gold'),
        fetch('/api/user/balance'),
        fetch('/api/gold-assets')
      ]);

      if (pricesResponse.ok && balanceResponse.ok && assetsResponse.ok) {
        const [pricesData, balanceData, assetsData] = await Promise.all([
          pricesResponse.json(),
          balanceResponse.json(),
          assetsResponse.json()
        ]);

        // Filter for only สมาคมฯ gold price
        const goldAssociationPrice = pricesData.find((price: GoldPrice) => price.name === 'สมาคมฯ');
        setPrices(goldAssociationPrice ? [goldAssociationPrice] : []);
        
        setBalance(Number(balanceData.balance));
        
        const combinedAssets = assetsData.reduce((acc: { [key: string]: GoldAsset }, asset: any) => {
          const amount = Number(asset.amount);
          if (amount <= 0) return acc;
          
          if (!acc[asset.goldType]) {
            acc[asset.goldType] = {
              goldType: asset.goldType,
              amount: amount.toString(),
              purchasePrice: asset.purchasePrice
            };
          } else {
            acc[asset.goldType].amount = (Number(acc[asset.goldType].amount) + amount).toString();
          }
          return acc;
        }, {});
        
        setAssets(Object.values(combinedAssets));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const calculateGrams = (bathAmount: number) => {
    return (bathAmount * BAHT_TO_GRAM).toFixed(2);
  };

  const calculateBaht = (gramAmount: number) => {
    return (gramAmount / BAHT_TO_GRAM).toFixed(4);
  };

  const getPortfolioSummary = (goldType: string) => {
    const asset = assets.find(a => a.goldType === goldType);
    return {
      units: asset ? Number(asset.amount) : 0,
      value: asset ? Number(asset.amount) * Number(asset.purchasePrice) : 0
    };
  };

  const handleBuyClick = (price: GoldPrice) => {
    setSelectedPrice(price);
    setMoneyAmount('');
    setIsBuyDialogOpen(true);
  };

  const handleSellClick = (price: GoldPrice) => {
    setSelectedPrice(price);
    setSellUnits('');
    setIsSellDialogOpen(true);
  };

  const handleBuySubmit = async () => {
    if (!selectedPrice || !moneyAmount) return;
  
    const moneyNum = parseFloat(moneyAmount);
    
    if (moneyNum > balance) {
      toast.error('จำนวนเงินเกินยอดคงเหลือในบัญชี');
      return;
    }
  
    setIsBuyProcessing(true);
  
    try {
      const baseAskPrice = typeof selectedPrice.ask === 'string' ? 
        parseFloat(selectedPrice.ask) : selectedPrice.ask;
      
      const units = moneyNum / baseAskPrice;
  
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goldType: GOLD_TYPE,
          amount: units,
          pricePerUnit: baseAskPrice,
          totalPrice: moneyNum,
          type: 'buy'
        })
      });
  
      if (!response.ok) {
        throw new Error('Failed to process purchase');
      }
  
      const data = await response.json();
      setBalance(data.balance);
      await fetchData();
      
      setTransactionSummary({
        goldType: GOLD_TYPE,
        units,
        price: baseAskPrice,
        total: moneyNum,
        averageCost: data.averageCost || 0,
        totalCost: data.totalCost || 0
      });
      
      setIsBuyDialogOpen(false);
      setShowSummaryDialog(true);
      toast.success('ซื้อทองสำเร็จ');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการซื้อทอง');
    } finally {
      setIsBuyProcessing(false);
    }
  };

  const handleSellSubmit = async () => {
    if (!selectedPrice || !sellUnits) return;
  
    setIsSellProcessing(true);
  
    try {
      const bathAmount = calculateBaht(Number(sellUnits));
      const baseBidPrice = typeof selectedPrice.bid === 'string' ? 
        parseFloat(selectedPrice.bid) : selectedPrice.bid;
      
      const totalAmount = Number(bathAmount);
      const finalTotal = totalAmount * baseBidPrice;
  
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goldType: GOLD_TYPE,
          amount: bathAmount,
          pricePerUnit: baseBidPrice,
          totalPrice: finalTotal,
          type: 'sell'
        })
      });
  
      if (!response.ok) {
        throw new Error('Failed to process sale');
      }
  
      const data = await response.json();
      setBalance(data.balance);
      await fetchData();
  
      setTransactionSummary({
        goldType: GOLD_TYPE,
        units: Number(bathAmount),
        price: baseBidPrice,
        total: finalTotal,
        isSell: true,
        averageCost: data.averageCost || 0,
        totalCost: data.totalCost || 0,
        previousAvgCost: data.previousAvgCost,
        previousTotalCost: data.previousTotalCost
      });
  
      setIsSellDialogOpen(false);
      setShowSummaryDialog(true);
      toast.success('ขายทองสำเร็จ');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการขายทอง');
    } finally {
      setIsSellProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className={`${theme === 'dark' ? 'bg-[#151515] border-[#2A2A2A]' : 'bg-white'}`}>
        <CardContent className="p-6">
          <div className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-80">เงินสดในพอร์ต</p>
                <p className="text-3xl font-bold">฿{balance.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm -mt-2 mb-2`}>
        อัพเดทล่าสุด: {lastUpdate.toLocaleString('th-TH')}
      </div>

      {prices.map((price, index) => {
        const summary = getPortfolioSummary(GOLD_TYPE);

        return (
          <div key={index} className={`${theme === 'dark' ? 'bg-[#151515] border-[#2A2A2A]' : 'bg-white'} rounded-lg border overflow-hidden`}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-14 h-14 ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-yellow-50'} rounded-full flex items-center justify-center`}>
                    <Image
                      src="/gold.png"
                      alt="Gold"
                      width={32}
                      height={32}
                      className={theme === 'dark' ? 'brightness-[10]' : ''}
                    />
                  </div>
                  <div>
                    <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{GOLD_TYPE}</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      1 บาท = {BAHT_TO_GRAM} กรัม
                    </p>
                    {summary.units > 0.0001 && (
                      <div>
                        <p className="text-sm text-[#4CAF50]">
                          พอร์ต: {summary.units.toFixed(4)} บาท
                        </p>
                        <p className="text-sm text-[#4CAF50]">
                          ({calculateGrams(summary.units)} กรัม)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleBuyClick(price)}
                    className="bg-[#4CAF50] hover:bg-[#45a049] text-white h-8 w-16"
                    size="sm"
                  >
                    ซื้อ
                  </Button>
                  <Button
                    onClick={() => handleSellClick(price)}
                    className="bg-[#ef5350] hover:bg-[#e53935] text-white h-8 w-16"
                    size="sm"
                  >
                    ขาย
                  </Button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>ราคารับซื้อ</p>
                  <p className={`text-md font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {Number(price.bid).toLocaleString()} บาท
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>ราคาขายออก</p>
                  <p className={`text-md font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {Number(price.ask).toLocaleString()} บาท
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Change</p>
                  <p className={`text-lg font-semibold ${Number(price.diff) > 0 ? 'text-[#4CAF50]' : 'text-[#ef5350]'}`}>
                    {Number(price.diff).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <Dialog open={isBuyDialogOpen} onOpenChange={setIsBuyDialogOpen}>
        <DialogContent className={theme === 'dark' ? 'bg-[#151515] border-[#2A2A2A] text-white' : ''}>
          <DialogHeader>
            <DialogTitle className={theme === 'dark' ? 'text-white' : ''}>ซื้อทอง</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className={theme === 'dark' ? 'text-white' : ''}>จำนวนเงิน</Label>
              <Input
                type="number"
                value={moneyAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || Number(value) <= balance) {
                    setMoneyAmount(value);
                  }
                }}
                placeholder="ระบุจำนวนเงินที่ต้องการซื้อ"
                className={theme === 'dark' ? 'bg-[#1a1a1a] border-[#333] text-white' : ''}
              />
            </div>
            {moneyAmount && selectedPrice && (
              <div className="space-y-2">
                <Label className={theme === 'dark' ? 'text-white' : ''}>จำนวนทอง</Label>
                <div className={`space-y-1 ${theme === 'dark' ? 'text-white' : ''}`}>
                  <p className="text-lg font-semibold">
                    {(Number(moneyAmount) / Number(selectedPrice.ask)).toFixed(4)} บาท
                  </p>
                  <p className="text-sm text-gray-500">
                    ({calculateGrams(Number(moneyAmount) / Number(selectedPrice.ask))} กรัม)
                  </p>
                </div>
              </div>
            )}
            <Button
              onClick={handleBuySubmit}
              className="w-full bg-[#4CAF50] hover:bg-[#45a049] text-white"
              disabled={!moneyAmount || Number(moneyAmount) <= 0 || Number(moneyAmount) > balance || isBuyProcessing}
            >
              {isBuyProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังทำรายการ...
                </>
              ) : (
                'ยืนยันคำสั่งซื้อ'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSellDialogOpen} onOpenChange={setIsSellDialogOpen}>
        <DialogContent className={theme === 'dark' ? 'bg-[#151515] border-[#2A2A2A] text-white' : ''}>
          <DialogHeader>
            <DialogTitle className={theme === 'dark' ? 'text-white' : ''}>ขายทอง</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedPrice && (() => {
              const summary = getPortfolioSummary(GOLD_TYPE);
              return summary.units > 0.0001 ? (
                <div className={`mb-4 p-3 ${
                  theme === 'dark' 
                    ? 'bg-[#1a1a1a]' 
                    : 'bg-gray-50'
                } rounded-lg`}>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>ทองในพอร์ต</p>
                  <p className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : ''}`}>
                    {summary.units.toFixed(4)} บาท
                  </p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    ({calculateGrams(summary.units)} กรัม)
                  </p>
                </div>
              ) : null;
            })()}
            <div className="space-y-2">
              <Label className={theme === 'dark' ? 'text-white' : ''}>จำนวนกรัมที่ต้องการขาย</Label>
              <Input
                type="number"
                value={sellUnits}
                onChange={(e) => {
                  const value = e.target.value;
                  if (selectedPrice) {
                    const summary = getPortfolioSummary(GOLD_TYPE);
                    const maxGrams = Number(calculateGrams(summary.units));
                    if (value === '' || Number(value) <= maxGrams) {
                      setSellUnits(value);
                    }
                  }
                }}
                placeholder="ระบุจำนวนกรัมที่ต้องการขาย"
                className={theme === 'dark' ? 'bg-[#1a1a1a] border-[#333] text-white' : ''}
              />
              {sellUnits && (
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  ({calculateBaht(Number(sellUnits))} บาท)
                </p>
              )}
              <Button
                type="button"
                onClick={() => {
                  if (selectedPrice) {
                    const summary = getPortfolioSummary(GOLD_TYPE);
                    const totalGrams = calculateGrams(summary.units);
                    setSellUnits(totalGrams);
                  }
                }}
                className="w-full bg-[#4CAF50] hover:bg-[#45a049] text-white mt-2"
              >
                ขายทั้งหมด
              </Button>
            </div>
            {sellUnits && selectedPrice && (
              <div className="space-y-2">
                <Label className={theme === 'dark' ? 'text-white' : ''}>จำนวนเงินที่จะได้รับ</Label>
                <p className="text-lg font-semibold text-[#4CAF50]">
                  ฿{(Number(calculateBaht(Number(sellUnits))) * Number(selectedPrice.bid)).toLocaleString()}
                </p>
              </div>
            )}
            <Button
              onClick={handleSellSubmit}
              className="w-full bg-[#ef5350] hover:bg-[#e53935] text-white"
              disabled={!sellUnits || Number(sellUnits) <= 0 || isSellProcessing}
            >
              {isSellProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังทำรายการ...
                </>
              ) : (
                'ยืนยันการขาย'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <DialogContent className={theme === 'dark' ? 'bg-[#151515] border-[#2A2A2A] text-white' : ''}>
          <DialogHeader>
            <DialogTitle className={theme === 'dark' ? 'text-white' : ''}>
              {transactionSummary?.isSell ? 'สรุปรายการขายทอง' : 'สรุปรายการซื้อทอง'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {transactionSummary && (
              <>
                <div className={`bg-[#4CAF50] bg-opacity-10 p-4 rounded-lg text-center mb-4`}>
                  <div className="text-[#4CAF50] text-xl mb-2">✓ ทำรายการสำเร็จ</div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>ประเภททอง</span>
                    <span className={theme === 'dark' ? 'text-white' : 'font-medium'}>{transactionSummary.goldType}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>จำนวนทอง</span>
                    <div className="text-right">
                      <span className={theme === 'dark' ? 'text-white' : 'font-medium'}>
                        {transactionSummary.units.toFixed(4)} บาท
                      </span>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        ({calculateGrams(transactionSummary.units)} กรัม)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>ราคาต่อหน่วย</span>
                    <span className={theme === 'dark' ? 'text-white' : 'font-medium'}>฿{transactionSummary.price.toLocaleString()}</span>
                  </div>

                  {transactionSummary.isSell && (
                    <>
                      <div className="flex justify-between">
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>ต้นทุนเฉลี่ยก่อนขาย</span>
                        <span className={theme === 'dark' ? 'text-white' : 'font-medium'}>฿{transactionSummary.previousAvgCost?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>ต้นทุนรวมก่อนขาย</span>
                        <span className={theme === 'dark' ? 'text-white' : 'font-medium'}>฿{transactionSummary.previousTotalCost?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>ต้นทุนเฉลี่ยหลังขาย</span>
                        <span className={theme === 'dark' ? 'text-white' : 'font-medium'}>฿{transactionSummary.averageCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>ต้นทุนรวมหลังขาย</span>
                        <span className={theme === 'dark' ? 'text-white' : 'font-medium'}>฿{transactionSummary.totalCost.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                  
                  <div className={`border-t ${theme === 'dark' ? 'border-[#333]' : 'border-gray-200'} pt-3`}>
                    <div className="flex justify-between text-lg font-semibold">
                      <span className={theme === 'dark' ? 'text-white' : ''}>{transactionSummary.isSell ? 'ได้รับเงิน' : 'ยอดชำระ'}</span>
                      <span className={transactionSummary.isSell ? 'text-[#4CAF50]' : 'text-[#ef5350]'}>
                        ฿{transactionSummary.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => setShowSummaryDialog(false)}
                  className={`w-full mt-4 ${theme === 'dark' ? 'bg-[#333] hover:bg-[#444] text-white' : ''}`}
                >
                  ปิด
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
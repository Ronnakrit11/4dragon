'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

interface GoldPrice {
  name: string;
  bid: string | number;
  ask: string | number;
  diff: string | number;
}

export function GoldPricesHome() {
  const [prices, setPrices] = useState<GoldPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const BAHT_TO_GRAM = 15.2; // 1 baht = 15.2 grams for 96.5% gold

  useEffect(() => {
    async function fetchPrices() {
      try {
        const response = await fetch('/api/gold');
        if (response.ok) {
          const data = await response.json();
          // Filter for only 96.5% gold
          const gold965 = data.find((price: GoldPrice) => price.name === '96.5%');
          setPrices(gold965 ? [gold965] : []);
        }
      } catch (error) {
        console.error('Error fetching gold prices:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPrices();
    const interval = setInterval(fetchPrices, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="text-center py-4 dark:text-gray-400">Loading prices...</div>;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {prices.map((price, index) => (
          <div key={index} className="bg-[#151515] rounded-lg border border-[#2A2A2A] overflow-hidden transform transition-all hover:scale-[1.02]">
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                  <Image 
                    src="/gold.png"
                    alt="Gold"
                    width={32}
                    height={32}
                    className="dark:brightness-[10] w-6 h-6 sm:w-8 sm:h-8"
                  />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">ทอง 96.5%</h3>
                  <p className="text-xs sm:text-sm text-gray-400">1 บาท = {BAHT_TO_GRAM} กรัม</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">ราคารับซื้อ</span>
                  <span className="font-medium text-white text-sm sm:text-base">
                    ฿{Number(price.bid).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">ราคาขายออก</span>
                  <span className="font-medium text-white text-sm sm:text-base">
                    ฿{Number(price.ask).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#2A2A2A]">
                  <span className="text-sm text-gray-400">Change</span>
                  <span className={`font-medium text-sm sm:text-base ${Number(price.diff) > 0 ? 'text-[#4CAF50]' : 'text-[#ef5350]'}`}>
                    {Number(price.diff) > 0 ? '+' : ''}{Number(price.diff).toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 py-2 px-3 sm:px-4 rounded-lg bg-[#4CAF50] hover:bg-[#45a049] text-white text-xs sm:text-sm font-medium transition-colors">
                    ซื้อ
                  </button>
                  <button className="flex-1 py-2 px-3 sm:px-4 rounded-lg bg-[#ef5350] hover:bg-[#e53935] text-white text-xs sm:text-sm font-medium transition-colors">
                    ขาย
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
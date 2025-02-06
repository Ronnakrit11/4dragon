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

  useEffect(() => {
    async function fetchPrices() {
      try {
        const response = await fetch('/api/gold');
        if (response.ok) {
          const data = await response.json();
          setPrices(data);
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {prices.map((price, index) => {
        const displayName = price.name === "สมาคมฯ" ? "ทองสมาคม" : 
                          price.name === "99.99%" ? "ทอง 99.99%" : 
                          price.name === "96.5%" ? "ทอง 96.5%" : 
                          "GoldSpot";

        return (
          <div key={index} className="bg-[#151515] rounded-lg border border-[#2A2A2A] overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 flex items-center justify-center">
                  <Image 
                    src="/gold.png"
                    alt="Gold"
                    width={32}
                    height={32}
                    className="dark:brightness-[10]"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{displayName}</h3>
                  <p className="text-sm text-gray-400">0.027 oz</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">ราคารับซื้อ</span>
                  <span className="font-medium text-white">
                    {price.name === "GoldSpot" ? 
                      `$${Number(price.bid).toLocaleString()}` : 
                      `${Number(price.bid).toLocaleString()} บาท`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">ราคาขายออก</span>
                  <span className="font-medium text-white">
                    {price.name === "GoldSpot" ? 
                      `$${Number(price.ask).toLocaleString()}` : 
                      `${Number(price.ask).toLocaleString()} บาท`}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#2A2A2A]">
                  <span className="text-gray-400">Change</span>
                  <span className={`font-medium ${Number(price.diff) > 0 ? 'text-[#4CAF50]' : 'text-[#ef5350]'}`}>
                    {Number(price.diff) > 0 ? '+' : ''}{Number(price.diff).toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 py-2 px-4 rounded-lg bg-[#4CAF50] hover:bg-[#45a049] text-white text-sm font-medium">
                    ซื้อ
                  </button>
                  <button className="flex-1 py-2 px-4 rounded-lg bg-[#ef5350] hover:bg-[#e53935] text-white text-sm font-medium">
                    ขาย
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins } from 'lucide-react';
import { GoldPrices } from './gold-prices';
import { GoldChart } from '@/components/GoldChart';

export default function GoldPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Gold Dashboard
      </h1>
      <div className="mb-8">
      <GoldChart />
      <br />
        <GoldPrices />
      </div>
      
     

      
    </section>
  );
}
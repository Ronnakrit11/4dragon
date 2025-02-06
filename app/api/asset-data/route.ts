import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { goldAssets, userBalances } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all data in parallel
    const [balanceData, assetsData] = await Promise.all([
      // Get user balance
      db.select()
        .from(userBalances)
        .where(eq(userBalances.userId, user.id))
        .limit(1),

      // Get gold assets
      db.select()
        .from(goldAssets)
        .where(eq(goldAssets.userId, user.id))
    ]);

    // Process gold assets
    const combinedAssets = assetsData.reduce((acc: { [key: string]: any }, asset) => {
      const amount = Number(asset.amount);
      if (amount <= 0.0001) return acc;

      if (!acc[asset.goldType]) {
        acc[asset.goldType] = {
          goldType: asset.goldType,
          amount: amount,
          totalValue: amount * Number(asset.purchasePrice),
          purchasePrice: Number(asset.purchasePrice)
        };
      } else {
        acc[asset.goldType].amount += amount;
        acc[asset.goldType].totalValue += amount * Number(asset.purchasePrice);
      }
      return acc;
    }, {});

    const formattedAssets = Object.values(combinedAssets).map((asset: any) => ({
      goldType: asset.goldType,
      amount: asset.amount.toString(),
      purchasePrice: (asset.totalValue / asset.amount).toString(),
      totalCost: asset.totalValue.toString(),
      averageCost: (asset.totalValue / asset.amount).toString()
    }));

    return NextResponse.json({
      balance: balanceData[0]?.balance || '0',
      assets: formattedAssets
    });
  } catch (error) {
    console.error('Error fetching asset data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch asset data' },
      { status: 500 }
    );
  }
}
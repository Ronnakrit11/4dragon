import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { withdrawalRequests, goldAssets } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { and, eq, sql } from 'drizzle-orm';
import { sendGoldWithdrawalNotification } from '@/lib/telegram/bot';

export async function POST(request: Request) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { goldType, amount, name, tel, address } = data;

    // Start a transaction to ensure data consistency
    const result = await db.transaction(async (tx) => {
      // Check if user has enough gold
      const [asset] = await tx
        .select()
        .from(goldAssets)
        .where(
          and(
            eq(goldAssets.userId, user.id),
            eq(goldAssets.goldType, goldType)
          )
        )
        .limit(1);

      if (!asset || Number(asset.amount) < Number(amount)) {
        throw new Error('Insufficient gold balance');
      }

      // Update gold asset amount
      await tx
        .update(goldAssets)
        .set({
          amount: sql`${goldAssets.amount} - ${amount}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(goldAssets.userId, user.id),
            eq(goldAssets.goldType, goldType)
          )
        );

      // Create withdrawal request
      await tx.insert(withdrawalRequests).values({
        userId: user.id,
        goldType,
        amount,
        name,
        tel,
        address,
        status: 'pending'
      });

      // Get updated gold balance
      const [updatedAsset] = await tx
        .select()
        .from(goldAssets)
        .where(
          and(
            eq(goldAssets.userId, user.id),
            eq(goldAssets.goldType, goldType)
          )
        )
        .limit(1);

      // Send Telegram notification
      await sendGoldWithdrawalNotification({
        userName: user.name || user.email,
        goldType,
        amount: Number(amount),
        name,
        tel,
        address
      });

      return {
        success: true,
        remainingAmount: updatedAsset.amount
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating withdrawal request:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create withdrawal request'
      },
      { status: 500 }
    );
  }
}
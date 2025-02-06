import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { userBalances, goldAssets, transactions } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { sendGoldPurchaseNotification } from '@/lib/telegram/bot';

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
    const { goldType, amount, pricePerUnit, totalPrice } = data;

    // Start a transaction
    const result = await db.transaction(async (tx) => {
      // Update user balance
      await tx
        .update(userBalances)
        .set({
          balance: sql`${userBalances.balance} - ${totalPrice}`,
          updatedAt: new Date(),
        })
        .where(eq(userBalances.userId, user.id));

      // Always create a new gold asset record for each purchase
      await tx.insert(goldAssets).values({
        userId: user.id,
        goldType,
        amount,
        purchasePrice: pricePerUnit,
      });

      // Record the transaction
      await tx.insert(transactions).values({
        userId: user.id,
        goldType,
        amount,
        pricePerUnit,
        totalPrice,
        type: 'buy',
      });

      // Return updated balances
      const [newBalance] = await tx
        .select()
        .from(userBalances)
        .where(eq(userBalances.userId, user.id))
        .limit(1);

      const [newAsset] = await tx
        .select()
        .from(goldAssets)
        .where(eq(goldAssets.userId, user.id))
        .orderBy(sql`${goldAssets.createdAt} DESC`)
        .limit(1);

      return {
        balance: newBalance.balance,
        goldAmount: newAsset.amount
      };
    });

    // Send Telegram notification after transaction is complete
    // Use Promise.allSettled to prevent notification errors from affecting the response
    await Promise.allSettled([
      sendGoldPurchaseNotification({
        userName: user.name || user.email,
        goldType,
        amount: Number(amount),
        totalPrice: Number(totalPrice),
        pricePerUnit: Number(pricePerUnit)
      })
    ]);

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error processing gold purchase:', error);
    return NextResponse.json(
      { error: 'Failed to process purchase' },
      { status: 500 }
    );
  }
}
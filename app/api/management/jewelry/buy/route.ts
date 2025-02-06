import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { userBalances, transactions, goldProducts, goldAssets } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, sql } from 'drizzle-orm';

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
    const { productId, name, amount, totalPrice } = data;

    // Start a transaction
    const result = await db.transaction(async (tx) => {
      // Check user balance
      const [currentBalance] = await tx
        .select()
        .from(userBalances)
        .where(eq(userBalances.userId, user.id))
        .limit(1);

      if (!currentBalance || Number(currentBalance.balance) < totalPrice) {
        throw new Error('Insufficient balance');
      }

      // Get product details
      const [product] = await tx
        .select()
        .from(goldProducts)
        .where(eq(goldProducts.id, productId))
        .limit(1);

      if (!product || product.status !== 'active') {
        throw new Error('Product not found or not available');
      }

      // Update user balance
      await tx
        .update(userBalances)
        .set({
          balance: sql`${userBalances.balance} - ${totalPrice}`,
          updatedAt: new Date(),
        })
        .where(eq(userBalances.userId, user.id));

      // Record transaction
      await tx.insert(transactions).values({
        userId: user.id,
        goldType: name,
        amount: amount.toString(),
        pricePerUnit: (totalPrice / amount).toString(),
        totalPrice: totalPrice.toString(),
        type: 'buy',
      });

      // Add to user's gold assets
      await tx.insert(goldAssets).values({
        userId: user.id,
        goldType: name,
        amount: amount.toString(),
        purchasePrice: (totalPrice / amount).toString(),
      });

      // Update product status to inactive
      await tx
        .update(goldProducts)
        .set({
          status: 'inactive',
          updatedAt: new Date(),
        })
        .where(eq(goldProducts.id, productId));

      // Get updated balance
      const [newBalance] = await tx
        .select()
        .from(userBalances)
        .where(eq(userBalances.userId, user.id))
        .limit(1);

      return {
        success: true,
        balance: newBalance.balance,
        productId: productId
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing jewelry purchase:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process purchase'
      },
      { status: 500 }
    );
  }
}
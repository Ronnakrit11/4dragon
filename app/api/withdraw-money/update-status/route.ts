import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { withdrawalMoneyRequests, userBalances } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, sql } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const user = await getUser();
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id, status } = await request.json();

    if (!id || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    await db.transaction(async (tx) => {
      // Get the withdrawal request
      const [withdrawalRequest] = await tx
        .select()
        .from(withdrawalMoneyRequests)
        .where(eq(withdrawalMoneyRequests.id, id))
        .limit(1);

      if (!withdrawalRequest) {
        throw new Error('Withdrawal request not found');
      }

      // If rejecting, return the money to the user's balance
      if (status === 'rejected') {
        await tx
          .update(userBalances)
          .set({
            balance: sql`${userBalances.balance} + ${withdrawalRequest.amount}`,
            updatedAt: new Date(),
          })
          .where(eq(userBalances.userId, withdrawalRequest.userId));
      }

      // Update the withdrawal request status
      await tx
        .update(withdrawalMoneyRequests)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(withdrawalMoneyRequests.id, id));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating withdrawal status:', error);
    return NextResponse.json(
      { error: 'Failed to update withdrawal status' },
      { status: 500 }
    );
  }
}
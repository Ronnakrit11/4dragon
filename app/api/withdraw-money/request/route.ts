import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { userBalances, withdrawalMoneyRequests } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { sendWithdrawalRequestNotification } from '@/lib/telegram/bot';

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
    const { amount, bankAccount } = data;

    // Start a transaction
    const result = await db.transaction(async (tx) => {
      // Update user balance
      await tx
        .update(userBalances)
        .set({
          balance: sql`${userBalances.balance} - ${amount}`,
          updatedAt: new Date(),
        })
        .where(eq(userBalances.userId, user.id));

      // Create withdrawal request
      await tx.insert(withdrawalMoneyRequests).values({
        userId: user.id,
        amount: amount.toString(),
        bank: bankAccount.bank,
        accountNumber: bankAccount.accountNumber,
        accountName: bankAccount.accountName,
        status: 'pending'
      });

      // Get updated balance
      const [newBalance] = await tx
        .select()
        .from(userBalances)
        .where(eq(userBalances.userId, user.id))
        .limit(1);

      return {
        success: true,
        balance: newBalance.balance
      };
    });

    // Send Telegram notification after transaction is complete
    await sendWithdrawalRequestNotification({
      userName: user.name || user.email,
      amount: Number(amount),
      bank: bankAccount.bank,
      accountNumber: bankAccount.accountNumber,
      accountName: bankAccount.accountName
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return NextResponse.json(
      { error: 'Failed to process withdrawal' },
      { status: 500 }
    );
  }
}
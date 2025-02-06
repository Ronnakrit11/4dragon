import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { withdrawalMoneyRequests, users } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const user = await getUser();
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const requests = await db
      .select({
        id: withdrawalMoneyRequests.id,
        userId: withdrawalMoneyRequests.userId,
        amount: withdrawalMoneyRequests.amount,
        bank: withdrawalMoneyRequests.bank,
        accountNumber: withdrawalMoneyRequests.accountNumber,
        accountName: withdrawalMoneyRequests.accountName,
        status: withdrawalMoneyRequests.status,
        createdAt: withdrawalMoneyRequests.createdAt,
        user: {
          email: users.email,
          name: users.name,
        },
      })
      .from(withdrawalMoneyRequests)
      .leftJoin(users, eq(withdrawalMoneyRequests.userId, users.id))
      .orderBy(desc(withdrawalMoneyRequests.createdAt));

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawal requests' },
      { status: 500 }
    );
  }
}
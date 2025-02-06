import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { withdrawalRequests, users } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';

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
        id: withdrawalRequests.id,
        userId: withdrawalRequests.userId,
        goldType: withdrawalRequests.goldType,
        amount: withdrawalRequests.amount,
        name: withdrawalRequests.name,
        tel: withdrawalRequests.tel,
        address: withdrawalRequests.address,
        status: withdrawalRequests.status,
        createdAt: withdrawalRequests.createdAt,
        user: {
          email: users.email,
          name: users.name,
        },
      })
      .from(withdrawalRequests)
      .leftJoin(users, eq(withdrawalRequests.userId, users.id))
      .orderBy(withdrawalRequests.createdAt);

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawal requests' },
      { status: 500 }
    );
  }
}
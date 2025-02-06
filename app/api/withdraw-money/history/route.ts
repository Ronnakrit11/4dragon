import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { withdrawalMoneyRequests } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const requests = await db
      .select()
      .from(withdrawalMoneyRequests)
      .where(eq(withdrawalMoneyRequests.userId, user.id))
      .orderBy(desc(withdrawalMoneyRequests.createdAt));

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching withdrawal history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawal history' },
      { status: 500 }
    );
  }
}
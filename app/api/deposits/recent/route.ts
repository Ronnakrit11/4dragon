import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { verifiedSlips } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function GET() {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const recentDeposits = await db
      .select({
        id: verifiedSlips.id,
        amount: verifiedSlips.amount,
        verifiedAt: verifiedSlips.verifiedAt,
      })
      .from(verifiedSlips)
      .where(eq(verifiedSlips.userId, user.id))
      .orderBy(desc(verifiedSlips.verifiedAt))
      .limit(5);

    // Add status field to each deposit
    const depositsWithStatus = recentDeposits.map(deposit => ({
      ...deposit,
      status: 'completed' as const
    }));

    return NextResponse.json(depositsWithStatus);
  } catch (error) {
    console.error('Error fetching recent deposits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent deposits' },
      { status: 500 }
    );
  }
}
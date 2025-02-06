import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users, depositLimits } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's deposit limit
    const [userLimit] = await db
      .select({
        id: depositLimits.id,
        name: depositLimits.name,
        dailyLimit: depositLimits.dailyLimit,
        monthlyLimit: depositLimits.monthlyLimit,
      })
      .from(users)
      .leftJoin(depositLimits, eq(users.depositLimitId, depositLimits.id))
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userLimit || !userLimit.id) {
      // If no limit is set, get the default Level 1 limit
      const [defaultLimit] = await db
        .select()
        .from(depositLimits)
        .where(eq(depositLimits.name, 'Level 1'))
        .limit(1);

      if (defaultLimit) {
        // Assign default limit to user
        await db
          .update(users)
          .set({ depositLimitId: defaultLimit.id })
          .where(eq(users.id, user.id));

        return NextResponse.json({
          id: defaultLimit.id,
          name: defaultLimit.name,
          dailyLimit: defaultLimit.dailyLimit,
          monthlyLimit: defaultLimit.monthlyLimit,
        });
      }
    }

    return NextResponse.json(userLimit);
  } catch (error) {
    console.error('Error fetching deposit limit:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deposit limit' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId, limitId } = await request.json();

    await db
      .update(users)
      .set({ 
        depositLimitId: limitId,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating deposit limit:', error);
    return NextResponse.json(
      { error: 'Failed to update deposit limit' },
      { status: 500 }
    );
  }
}
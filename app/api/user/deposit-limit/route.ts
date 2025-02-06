import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users, depositLimits } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const currentUser = await getUser();
    
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId, limitId } = await request.json();

    // Verify user exists
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify deposit limit exists
    const [limit] = await db
      .select()
      .from(depositLimits)
      .where(eq(depositLimits.id, limitId))
      .limit(1);

    if (!limit) {
      return NextResponse.json(
        { error: 'Deposit limit not found' },
        { status: 404 }
      );
    }

    // Update user's deposit limit
    await db
      .update(users)
      .set({ 
        depositLimitId: limitId,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user deposit limit:', error);
    return NextResponse.json(
      { error: 'Failed to update user deposit limit' },
      { status: 500 }
    );
  }
}
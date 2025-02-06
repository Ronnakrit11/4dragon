import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { withdrawalRequests } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';

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

    // Update the withdrawal request status
    await db
      .update(withdrawalRequests)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(withdrawalRequests.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating withdrawal status:', error);
    return NextResponse.json(
      { error: 'Failed to update withdrawal status' },
      { status: 500 }
    );
  }
}
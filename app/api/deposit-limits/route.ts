import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { depositLimits } from '@/lib/db/schema';
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

    const limits = await db
      .select()
      .from(depositLimits)
      .orderBy(depositLimits.createdAt);

    return NextResponse.json(limits);
  } catch (error) {
    console.error('Error fetching deposit limits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deposit limits' },
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

    const { name, dailyLimit, monthlyLimit } = await request.json();

    const [newLimit] = await db
      .insert(depositLimits)
      .values({
        name,
        dailyLimit: dailyLimit.toString(),
        monthlyLimit: monthlyLimit.toString(),
        createdBy: user.id,
      })
      .returning();

    return NextResponse.json(newLimit);
  } catch (error) {
    console.error('Error creating deposit limit:', error);
    return NextResponse.json(
      { error: 'Failed to create deposit limit' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getUser();
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id, name, dailyLimit, monthlyLimit } = await request.json();

    const [updatedLimit] = await db
      .update(depositLimits)
      .set({
        name,
        dailyLimit: dailyLimit.toString(),
        monthlyLimit: monthlyLimit.toString(),
        updatedAt: new Date(),
      })
      .where(eq(depositLimits.id, id))
      .returning();

    return NextResponse.json(updatedLimit);
  } catch (error) {
    console.error('Error updating deposit limit:', error);
    return NextResponse.json(
      { error: 'Failed to update deposit limit' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getUser();
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    await db
      .delete(depositLimits)
      .where(eq(depositLimits.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting deposit limit:', error);
    return NextResponse.json(
      { error: 'Failed to delete deposit limit' },
      { status: 500 }
    );
  }
}
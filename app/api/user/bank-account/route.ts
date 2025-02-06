import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { bankAccounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
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

    const account = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.userId, user.id))
      .limit(1);

    return NextResponse.json(account[0] || {});
  } catch (error) {
    console.error('Error fetching bank account:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bank account' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { goldAssets, users } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const currentUser = await getUser();
    
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get total gold holdings grouped by type
    // Only include records where amount > 0 to avoid division by zero
    const goldHoldings = await db
      .select({
        goldType: goldAssets.goldType,
        totalAmount: sql<string>`COALESCE(sum(${goldAssets.amount}), '0')`,
        totalValue: sql<string>`COALESCE(sum(${goldAssets.amount} * ${goldAssets.purchasePrice}), '0')`,
        averagePrice: sql<string>`CASE 
          WHEN sum(${goldAssets.amount}) > 0 
          THEN sum(${goldAssets.amount} * ${goldAssets.purchasePrice}) / sum(${goldAssets.amount})
          ELSE '0'
        END`
      })
      .from(goldAssets)
      .where(sql`${goldAssets.amount} > 0`)
      .groupBy(goldAssets.goldType);

    // Get user-specific summaries
    // Only include records where amount > 0
    const userSummaries = await db
      .select({
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        goldType: goldAssets.goldType,
        totalAmount: sql<string>`COALESCE(sum(${goldAssets.amount}), '0')`,
        totalValue: sql<string>`COALESCE(sum(${goldAssets.amount} * ${goldAssets.purchasePrice}), '0')`
      })
      .from(goldAssets)
      .leftJoin(users, eq(goldAssets.userId, users.id))
      .where(sql`${goldAssets.amount} > 0`)
      .groupBy(users.id, users.name, users.email, goldAssets.goldType);

    return NextResponse.json({
      goldHoldings,
      userSummaries
    });
  } catch (error) {
    console.error('Error fetching savings summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch savings summary' },
      { status: 500 }
    );
  }
}
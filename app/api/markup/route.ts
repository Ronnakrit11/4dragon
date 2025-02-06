import { db } from '@/lib/db/drizzle';
import { markupSettings } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const settings = await db
      .select()
      .from(markupSettings)
      .orderBy(markupSettings.id)
      .limit(1);

    const data = settings[0] || {
      goldSpotBid: 0,
      goldSpotAsk: 0,
      gold9999Bid: 0,
      gold9999Ask: 0,
      gold965Bid: 0,
      gold965Ask: 0,
      goldAssociationBid: 0,
      goldAssociationAsk: 0,
    };

    return NextResponse.json({
      gold_spot_bid: data.goldSpotBid,
      gold_spot_ask: data.goldSpotAsk,
      gold_9999_bid: data.gold9999Bid,
      gold_9999_ask: data.gold9999Ask,
      gold_965_bid: data.gold965Bid,
      gold_965_ask: data.gold965Ask,
      gold_association_bid: data.goldAssociationBid,
      gold_association_ask: data.goldAssociationAsk,
    });
  } catch (error) {
    console.error('Error fetching markup settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch markup settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();

    const settings = await db
      .select()
      .from(markupSettings)
      .limit(1);

    if (settings.length === 0) {
      // Create initial settings if they don't exist
      await db.insert(markupSettings).values({
        goldSpotBid: data.goldSpot,
        goldSpotAsk: data.goldSpotAsk,
        gold9999Bid: data.gold9999,
        gold9999Ask: data.gold9999Ask,
        gold965Bid: data.gold965,
        gold965Ask: data.gold965Ask,
        goldAssociationBid: data.goldAssociation,
        goldAssociationAsk: data.goldAssociationAsk,
        updatedBy: user.id,
      });
    } else {
      // Update existing settings
      await db
        .update(markupSettings)
        .set({
          goldSpotBid: data.goldSpot,
          goldSpotAsk: data.goldSpotAsk,
          gold9999Bid: data.gold9999,
          gold9999Ask: data.gold9999Ask,
          gold965Bid: data.gold965,
          gold965Ask: data.gold965Ask,
          goldAssociationBid: data.goldAssociation,
          goldAssociationAsk: data.goldAssociationAsk,
          updatedAt: new Date(),
          updatedBy: user.id,
        })
        .where(eq(markupSettings.id, settings[0].id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating markup settings:', error);
    return NextResponse.json(
      { error: 'Failed to update markup settings' },
      { status: 500 }
    );
  }
}
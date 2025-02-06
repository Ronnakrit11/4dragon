import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { socialSettings } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const settings = await db
      .select()
      .from(socialSettings)
      .orderBy(socialSettings.id)
      .limit(1);

    const data = settings[0] || {
      facebookLink: '',
      lineOaLink: '',
      phoneNumber: ''
    };

    return NextResponse.json({
      facebook_link: data.facebookLink,
      line_oa_link: data.lineOaLink,
      phone_number: data.phoneNumber
    });
  } catch (error) {
    console.error('Error fetching social settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social settings' },
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

    const data = await request.json();
    const settings = await db
      .select()
      .from(socialSettings)
      .limit(1);

    if (settings.length === 0) {
      // Insert new settings
      await db.insert(socialSettings).values({
        facebookLink: data.facebook_link || '',
        lineOaLink: data.line_oa_link || '',
        phoneNumber: data.phone_number || '',
        updatedBy: user.id,
      });
    } else {
      // Update existing settings
      await db
        .update(socialSettings)
        .set({
          facebookLink: data.facebook_link || '',
          lineOaLink: data.line_oa_link || '',
          phoneNumber: data.phone_number || '',
          updatedAt: new Date(),
          updatedBy: user.id,
        })
        .where(eq(socialSettings.id, settings[0].id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating social settings:', error);
    return NextResponse.json(
      { error: 'Failed to update social settings' },
      { status: 500 }
    );
  }
}
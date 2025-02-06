import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';
import { authenticator } from 'otplib';

export async function POST() {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate new TOTP secret
    const secret = authenticator.generateSecret();

    // Store secret temporarily (not enabled yet until verified)
    await db
      .update(users)
      .set({ 
        twoFactorSecret: secret,
        twoFactorEnabled: false 
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({ 
      secret,
      success: true
    });
  } catch (error) {
    console.error('Error enabling 2FA:', error);
    return NextResponse.json(
      { error: 'Failed to enable 2FA' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { verifiedSlips, userBalances, users, depositLimits } from '@/lib/db/schema';
import { eq, and, sql, gte } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { sendDepositNotification } from '@/lib/telegram/bot';

const API_URL = 'https://developer.easyslip.com/api/v1/verify';
const API_KEY = process.env.EASYSLIP_API_KEY;

// Expected receiver details
const EXPECTED_RECEIVER = {
  name: {
    th: "นาย บรรณศาสตร์ ว",
    en: "MR. BANNASART W"
  },
  account: "XXX-X-XX245-7",
  type: "BANKAC"
};

if (!API_KEY) {
  throw new Error('EASYSLIP_API_KEY not configured');
}

// Define response type according to EasySlip API
type EasySlipResponse = {
  status: number;
  data?: {
    payload: string;
    transRef: string;
    date: string;
    countryCode: string;
    amount: {
      amount: number;
      local: {
        amount?: number;
        currency?: string;
      };
    };
    fee?: number;
    ref1?: string;
    ref2?: string;
    ref3?: string;
    sender: {
      bank: {
        id: string;
        name?: string;
        short?: string;
      };
      account: {
        name: {
          th?: string;
          en?: string;
        };
        bank?: {
          type: 'BANKAC' | 'TOKEN' | 'DUMMY';
          account: string;
        };
        proxy?: {
          type: 'NATID' | 'MSISDN' | 'EWALLETID' | 'EMAIL' | 'BILLERID';
          account: string;
        };
      };
    };
    receiver: {
      bank: {
        id: string;
        name?: string;
        short?: string;
      };
      account: {
        name: {
          th?: string;
          en?: string;
        };
        bank?: {
          type: 'BANKAC' | 'TOKEN' | 'DUMMY';
          account: string;
        };
        proxy?: {
          type: 'NATID' | 'MSISDN' | 'EWALLETID' | 'EMAIL' | 'BILLERID';
          account: string;
        };
      };
      merchantId?: string;
    };
  };
  message?: string;
}

function validateReceiver(data: EasySlipResponse): boolean {
  if (!data.data?.receiver?.account) {
    return false;
  }

  const receiver = data.data.receiver.account;

  // Check receiver name (both Thai and English)
  if (receiver.name?.th !== EXPECTED_RECEIVER.name.th || 
      receiver.name?.en !== EXPECTED_RECEIVER.name.en) {
    return false;
  }

  // Check bank account type and number
  if (receiver.bank?.type !== EXPECTED_RECEIVER.type || 
      receiver.bank?.account !== EXPECTED_RECEIVER.account) {
    return false;
  }

  return true;
}

async function checkSlipAlreadyUsed(transRef: string): Promise<boolean> {
  const existingSlip = await db
    .select()
    .from(verifiedSlips)
    .where(eq(verifiedSlips.transRef, transRef))
    .limit(1);

  return existingSlip.length > 0;
}

async function checkDepositLimits(userId: number, amount: number): Promise<{ allowed: boolean; message?: string }> {
  // Get user's deposit limit
  const [user] = await db
    .select({
      depositLimit: depositLimits
    })
    .from(users)
    .leftJoin(depositLimits, eq(users.depositLimitId, depositLimits.id))
    .where(eq(users.id, userId))
    .limit(1);

  if (!user.depositLimit) {
    return { allowed: false, message: 'No deposit limit set for user' };
  }

  // Get today's total deposits
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [dailyTotal] = await db
    .select({
      total: sql<string>`COALESCE(sum(${verifiedSlips.amount}), '0')`
    })
    .from(verifiedSlips)
    .where(
      and(
        eq(verifiedSlips.userId, userId),
        gte(verifiedSlips.verifiedAt, today)
      )
    );

  const dailyTotalAmount = Number(dailyTotal.total);
  const newDailyTotal = dailyTotalAmount + amount;
  const dailyLimit = Number(user.depositLimit.dailyLimit);

  if (newDailyTotal > dailyLimit) {
    return { 
      allowed: false, 
      message: `Deposit would exceed daily limit of ฿${dailyLimit.toLocaleString()}`
    };
  }

  return { allowed: true };
}

async function recordVerifiedSlip(transRef: string, amount: number, userId: number | null) {
  await db.transaction(async (tx) => {
    // Record the verified slip
    await tx.insert(verifiedSlips).values({
      transRef: transRef,
      amount: amount.toString(),
      userId: userId,
    });

    if (userId) {
      // Get current balance or create new balance record
      const currentBalance = await tx
        .select()
        .from(userBalances)
        .where(eq(userBalances.userId, userId))
        .limit(1);

      if (currentBalance.length === 0) {
        // Create new balance record
        await tx.insert(userBalances).values({
          userId: userId,
          balance: amount.toString(),
        });
      } else {
        // Update existing balance
        await tx
          .update(userBalances)
          .set({
            balance: (Number(currentBalance[0].balance) + amount).toString(),
            updatedAt: new Date(),
          })
          .where(eq(userBalances.userId, userId));
      }
    }
  });
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    const formData = await request.formData();
    const file = formData.get('slip') as File;

    if (!file) {
      return NextResponse.json(
        { status: 400, message: 'invalid_payload' },
        { status: 400 }
      );
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { status: 400, message: 'image_size_too_large' },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { status: 400, message: 'invalid_image' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        image: base64
      }),
      cache: 'no-store',
    });

    const data: EasySlipResponse = await response.json();

    // Handle different response statuses
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Validate receiver information
    if (!validateReceiver(data)) {
      return NextResponse.json(
        { 
          status: 400, 
          message: 'invalid_receiver',
          details: 'Transfer must be to นายบรรณศาสตร์  account only'
        },
        { status: 400 }
      );
    }

    // Check if slip has already been used
    if (data.data?.transRef) {
      const isUsed = await checkSlipAlreadyUsed(data.data.transRef);
      if (isUsed) {
        return NextResponse.json(
          {
            status: 400,
            message: 'slip_already_used',
            details: 'This transfer slip has already been used'
          },
          { status: 400 }
        );
      }

      // Check deposit limits if user is logged in
      if (user) {
        const depositCheck = await checkDepositLimits(user.id, data.data.amount.amount);
        if (!depositCheck.allowed) {
          return NextResponse.json(
            {
              status: 400,
              message: 'deposit_limit_exceeded',
              details: depositCheck.message
            },
            { status: 400 }
          );
        }
      }

      // Record the verified slip and update user balance
      await recordVerifiedSlip(
        data.data.transRef,
        data.data.amount.amount,
        user?.id || null
      );

      // Send Telegram notification
      if (user) {
        await sendDepositNotification({
          userName: user.name || user.email,
          amount: data.data.amount.amount,
          transRef: data.data.transRef
        });
      }
    }

    return NextResponse.json({ status: 200, message: 'success' });
  } catch (error) {
    console.error('Error verifying slip:', error);
    return NextResponse.json(
      { status: 500, message: 'server_error' },
      { status: 500 }
    );
  }
}
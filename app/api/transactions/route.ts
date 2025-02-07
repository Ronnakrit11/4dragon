import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { userBalances, goldAssets, transactions, users } from '@/lib/db/schema';
import { eq, and, sql, ne } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { sendGoldPurchaseNotification, sendGoldSaleNotification } from '@/lib/telegram/bot';
import { pusherServer } from '@/lib/pusher';

const GOLD_TYPE = 'ทองสมาคม 96.5%';
const ADMIN_EMAIL = 'adminfortest@gmail.com';

export async function POST(request: Request) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { goldType, amount, pricePerUnit, totalPrice, type } = data;

    // Start a transaction
    const result = await db.transaction(async (tx) => {
      if (type === 'sell') {
        // Calculate total gold holdings and average cost before the sale
        const [totalGold] = await tx
          .select({
            total: sql<string>`sum(${goldAssets.amount})`,
            totalCost: sql<string>`sum(${goldAssets.amount} * ${goldAssets.purchasePrice})`,
            avgCost: sql<string>`CASE 
              WHEN sum(${goldAssets.amount}) > 0 
              THEN sum(${goldAssets.amount} * ${goldAssets.purchasePrice}) / sum(${goldAssets.amount})
              ELSE 0 
            END`
          })
          .from(goldAssets)
          .where(
            and(
              eq(goldAssets.userId, user.id),
              eq(goldAssets.goldType, goldType)
            )
          );

        const currentBalance = Number(totalGold?.total || 0);
        const currentTotalCost = Number(totalGold?.totalCost || 0);
        const currentAvgCost = Number(totalGold?.avgCost || 0);
        
        if (currentBalance < amount) {
          throw new Error(`Insufficient gold balance. You have ${currentBalance} units available.`);
        }

        // Get all gold assets for this type
        const assets = await tx
          .select()
          .from(goldAssets)
          .where(
            and(
              eq(goldAssets.userId, user.id),
              eq(goldAssets.goldType, goldType)
            )
          )
          .orderBy(goldAssets.createdAt);

        let remainingAmountToSell = Number(amount);
        
        // Process each asset until we've sold the requested amount
        for (const asset of assets) {
          const assetAmount = Number(asset.amount);
          if (assetAmount <= 0) continue;

          const amountToSellFromAsset = Math.min(assetAmount, remainingAmountToSell);
          
          if (amountToSellFromAsset > 0) {
            await tx
              .update(goldAssets)
              .set({
                amount: sql`${goldAssets.amount} - ${amountToSellFromAsset}`,
                updatedAt: new Date(),
              })
              .where(eq(goldAssets.id, asset.id));

            remainingAmountToSell -= amountToSellFromAsset;
          }

          if (remainingAmountToSell <= 0) break;
        }

        // Update user balance
        await tx
          .update(userBalances)
          .set({
            balance: sql`${userBalances.balance} + ${totalPrice}`,
            updatedAt: new Date(),
          })
          .where(eq(userBalances.userId, user.id));

        // Record the transaction
        await tx.insert(transactions).values({
          userId: user.id,
          goldType,
          amount,
          pricePerUnit,
          totalPrice,
          type: 'sell',
        });

        // Get updated balance
        const [newBalance] = await tx
          .select()
          .from(userBalances)
          .where(eq(userBalances.userId, user.id))
          .limit(1);

        // Calculate admin's remaining stock
        const [adminStock] = await tx
          .select({
            total: sql<string>`COALESCE(sum(${goldAssets.amount}), '0')`
          })
          .from(goldAssets)
          .leftJoin(users, eq(goldAssets.userId, users.id))
          .where(
            and(
              eq(users.email, ADMIN_EMAIL),
              eq(goldAssets.goldType, GOLD_TYPE)
            )
          );

        // Calculate total user holdings (excluding admin)
        const [userHoldings] = await tx
          .select({
            total: sql<string>`COALESCE(sum(${goldAssets.amount}), '0')`
          })
          .from(goldAssets)
          .leftJoin(users, eq(goldAssets.userId, users.id))
          .where(
            and(
              ne(users.email, ADMIN_EMAIL),
              eq(goldAssets.goldType, GOLD_TYPE)
            )
          );

        const adminStockAmount = Number(adminStock?.total || 0);
        const userHoldingsAmount = Number(userHoldings?.total || 0);
        const availableStock = adminStockAmount - userHoldingsAmount;

        // Get new total gold amount after sale for user
        const [newTotalGold] = await tx
          .select({
            total: sql<string>`sum(${goldAssets.amount})`,
            totalCost: sql<string>`sum(${goldAssets.amount} * ${goldAssets.purchasePrice})`,
            avgCost: sql<string>`CASE 
              WHEN sum(${goldAssets.amount}) > 0 
              THEN sum(${goldAssets.amount} * ${goldAssets.purchasePrice}) / sum(${goldAssets.amount})
              ELSE 0 
            END`
          })
          .from(goldAssets)
          .where(
            and(
              eq(goldAssets.userId, user.id),
              eq(goldAssets.goldType, goldType)
            )
          );

        const remainingAmount = Number(newTotalGold.total || 0);
        const remainingTotalCost = Number(newTotalGold.totalCost || 0);
        const remainingAvgCost = Number(newTotalGold.avgCost || 0);
        const profitLoss = totalPrice - (Number(amount) * currentAvgCost);

        // Get total balance across all users AFTER the transaction
        const [totalUserBalance] = await tx
          .select({
            total: sql<string>`COALESCE(sum(${userBalances.balance}), '0')`
          })
          .from(userBalances)
          .where(ne(users.role, 'admin'))
          .leftJoin(users, eq(userBalances.userId, users.id));

        // Send Telegram notification with correct remaining amount and total balance
        await Promise.allSettled([
          sendGoldSaleNotification({
            userName: user.name || user.email,
            goldType,
            amount: Number(amount),
            totalPrice: Number(totalPrice),
            pricePerUnit: Number(pricePerUnit),
            profitLoss,
            remainingAmount: availableStock,
            totalUserBalance: Number(totalUserBalance.total)
          })
        ]);

        return {
          balance: newBalance.balance,
          goldAmount: remainingAmount.toString(),
          averageCost: remainingAvgCost,
          totalCost: remainingTotalCost,
          previousAvgCost: currentAvgCost,
          previousTotalCost: currentTotalCost
        };
      } else {
        // Buy transaction
        // Update user balance for buy
        await tx
          .update(userBalances)
          .set({
            balance: sql`${userBalances.balance} - ${totalPrice}`,
            updatedAt: new Date(),
          })
          .where(eq(userBalances.userId, user.id));

        // Create new gold asset record
        await tx.insert(goldAssets).values({
          userId: user.id,
          goldType,
          amount,
          purchasePrice: pricePerUnit,
        });

        // Record buy transaction
        await tx.insert(transactions).values({
          userId: user.id,
          goldType,
          amount,
          pricePerUnit,
          totalPrice,
          type: 'buy',
        });

        // Get updated balance
        const [newBalance] = await tx
          .select()
          .from(userBalances)
          .where(eq(userBalances.userId, user.id))
          .limit(1);

        // Calculate admin's remaining stock
        const [adminStock] = await tx
          .select({
            total: sql<string>`COALESCE(sum(${goldAssets.amount}), '0')`
          })
          .from(goldAssets)
          .leftJoin(users, eq(goldAssets.userId, users.id))
          .where(
            and(
              eq(users.email, ADMIN_EMAIL),
              eq(goldAssets.goldType, GOLD_TYPE)
            )
          );

        // Calculate total user holdings (excluding admin)
        const [userHoldings] = await tx
          .select({
            total: sql<string>`COALESCE(sum(${goldAssets.amount}), '0')`
          })
          .from(goldAssets)
          .leftJoin(users, eq(goldAssets.userId, users.id))
          .where(
            and(
              ne(users.email, ADMIN_EMAIL),
              eq(goldAssets.goldType, GOLD_TYPE)
            )
          );

        const adminStockAmount = Number(adminStock?.total || 0);
        const userHoldingsAmount = Number(userHoldings?.total || 0);
        const availableStock = adminStockAmount - userHoldingsAmount;

        // Get total balance across all users AFTER the transaction
        const [totalUserBalance] = await tx
          .select({
            total: sql<string>`COALESCE(sum(${userBalances.balance}), '0')`
          })
          .from(userBalances)
          .where(ne(users.role, 'admin'))
          .leftJoin(users, eq(userBalances.userId, users.id));

        // Send Telegram notification with correct remaining amount and total balance
        await Promise.allSettled([
          sendGoldPurchaseNotification({
            userName: user.name || user.email,
            goldType,
            amount: Number(amount),
            totalPrice: Number(totalPrice),
            pricePerUnit: Number(pricePerUnit),
            remainingAmount: availableStock,
            totalUserBalance: Number(totalUserBalance.total)
          })
        ]);

        return {
          balance: newBalance.balance,
          goldAmount: availableStock.toString()
        };
      }
    });

    // After successful transaction, trigger Pusher event
    await pusherServer.trigger('gold-transactions', 'transaction', {
      type,
      amount,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error processing transaction:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process transaction' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { goldProducts } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const products = await db
      .select({
        id: goldProducts.id,
        categoryId: goldProducts.categoryId,
        code: goldProducts.code,
        name: goldProducts.name,
        description: goldProducts.description,
        weight: goldProducts.weight,
        weightUnit: goldProducts.weightUnit,
        purity: goldProducts.purity,
        sellingPrice: goldProducts.sellingPrice,
        workmanshipFee: goldProducts.workmanshipFee,
        imageUrl: goldProducts.imageUrl,
        status: goldProducts.status,
        createdAt: goldProducts.createdAt,
        updatedAt: goldProducts.updatedAt
      })
      .from(goldProducts)
      .orderBy(desc(goldProducts.createdAt));

    return new NextResponse(JSON.stringify(products), {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
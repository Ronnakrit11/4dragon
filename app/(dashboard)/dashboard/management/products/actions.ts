'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { goldProducts, productCategories } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { validatedActionWithUser } from '@/lib/auth/middleware';

const productSchema = z.object({
  categoryId: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string(),
  weight: z.string().min(1, 'Weight is required'),
  weightUnit: z.enum(['gram', 'baht']),
  purity: z.string().min(1, 'Purity is required'),
  sellingPrice: z.string().min(1, 'Selling price is required'),
  workmanshipFee: z.string().min(1, 'Workmanship fee is required'),
  imageUrl: z.string().optional(),
});

export async function getProducts() {
  const user = await getUser();
  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  return db
    .select()
    .from(goldProducts)
    .orderBy(desc(goldProducts.createdAt));
}

export async function getCategories() {
  const user = await getUser();
  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  return db
    .select()
    .from(productCategories)
    .orderBy(productCategories.name);
}

export const createProduct = validatedActionWithUser(
  productSchema,
  async (data, _, user) => {
    if (user.role !== 'admin') {
      return { error: 'Unauthorized' };
    }

    try {
      // Generate unique product code
      const code = `GLD${Date.now().toString(36).toUpperCase()}`;

      await db.insert(goldProducts).values({
        code,
        categoryId: Number(data.categoryId),
        name: data.name,
        description: data.description,
        weight: data.weight,
        weightUnit: data.weightUnit,
        purity: data.purity,
        sellingPrice: data.sellingPrice,
        workmanshipFee: data.workmanshipFee,
        imageUrl: data.imageUrl || null,
      });

      revalidatePath('/dashboard/management/products');
      return { success: 'Product created successfully' };
    } catch (error) {
      console.error('Error creating product:', error);
      return { error: 'Failed to create product' };
    }
  }
);

export const updateProduct = validatedActionWithUser(
  productSchema.extend({ id: z.string() }),
  async (data, _, user) => {
    if (user.role !== 'admin') {
      return { error: 'Unauthorized' };
    }

    try {
      await db
        .update(goldProducts)
        .set({
          categoryId: Number(data.categoryId),
          name: data.name,
          description: data.description,
          weight: data.weight,
          weightUnit: data.weightUnit,
          purity: data.purity,
          sellingPrice: data.sellingPrice,
          workmanshipFee: data.workmanshipFee,
          imageUrl: data.imageUrl || null,
          updatedAt: new Date(),
        })
        .where(eq(goldProducts.id, Number(data.id)));

      revalidatePath('/dashboard/management/products');
      return { success: 'Product updated successfully' };
    } catch (error) {
      console.error('Error updating product:', error);
      return { error: 'Failed to update product' };
    }
  }
);

export const deleteProduct = validatedActionWithUser(
  z.object({ id: z.string() }),
  async (data, _, user) => {
    if (user.role !== 'admin') {
      return { error: 'Unauthorized' };
    }

    try {
      await db
        .delete(goldProducts)
        .where(eq(goldProducts.id, Number(data.id)));

      revalidatePath('/dashboard/management/products');
      return { success: 'Product deleted successfully' };
    } catch (error) {
      console.error('Error deleting product:', error);
      return { error: 'Failed to delete product' };
    }
  }
);
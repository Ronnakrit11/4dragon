'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { productCategories } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { validatedActionWithUser } from '@/lib/auth/middleware';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string(),
});

export async function getCategories() {
  const user = await getUser();
  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  return db
    .select()
    .from(productCategories)
    .orderBy(desc(productCategories.createdAt));
}

export const createCategory = validatedActionWithUser(
  categorySchema,
  async (data, _, user) => {
    if (user.role !== 'admin') {
      return { error: 'Unauthorized' };
    }

    try {
      await db.insert(productCategories).values({
        name: data.name,
        description: data.description,
      });

      revalidatePath('/dashboard/management/catalog');
      return { success: 'Category created successfully' };
    } catch (error) {
      console.error('Error creating category:', error);
      return { error: 'Failed to create category' };
    }
  }
);

export const updateCategory = validatedActionWithUser(
  categorySchema.extend({ id: z.string() }),
  async (data, _, user) => {
    if (user.role !== 'admin') {
      return { error: 'Unauthorized' };
    }

    try {
      await db
        .update(productCategories)
        .set({
          name: data.name,
          description: data.description,
          updatedAt: new Date(),
        })
        .where(eq(productCategories.id, Number(data.id)));

      revalidatePath('/dashboard/management/catalog');
      return { success: 'Category updated successfully' };
    } catch (error) {
      console.error('Error updating category:', error);
      return { error: 'Failed to update category' };
    }
  }
);

export const deleteCategory = validatedActionWithUser(
  z.object({ id: z.string() }),
  async (data, _, user) => {
    if (user.role !== 'admin') {
      return { error: 'Unauthorized' };
    }

    try {
      await db
        .delete(productCategories)
        .where(eq(productCategories.id, Number(data.id)));

      revalidatePath('/dashboard/management/catalog');
      return { success: 'Category deleted successfully' };
    } catch (error) {
      console.error('Error deleting category:', error);
      return { error: 'Failed to delete category' };
    }
  }
);
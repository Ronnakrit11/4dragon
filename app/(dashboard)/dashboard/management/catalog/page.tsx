'use client';

import { useState, useEffect, startTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';
import { useTheme } from '@/lib/theme-provider';
import { useActionState } from 'react';
import { createCategory, updateCategory, deleteCategory, getCategories } from './actions';
import type { ProductCategory } from '@/lib/db/schema';

export default function CatalogPage() {
  const { user } = useUser();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const [createState, createAction, isCreatePending] = useActionState(createCategory, {});
  const [updateState, updateAction, isUpdatePending] = useActionState(updateCategory, {});
  const [deleteState, deleteAction, isDeletePending] = useActionState(deleteCategory, {});

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (createState.success || updateState.success || deleteState.success) {
      toast.success(createState.success || updateState.success || deleteState.success);
      setIsDialogOpen(false);
      resetForm();
      fetchCategories();
    }

    if (createState.error || updateState.error || deleteState.error) {
      toast.error(createState.error || updateState.error || deleteState.error);
    }
  }, [createState, updateState, deleteState]);

  if (!user || user.role !== 'admin') {
    redirect('/dashboard');
  }

  async function fetchCategories() {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const formDataObj = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      formDataObj.append(key, value);
    });

    if (selectedCategory) {
      formDataObj.append('id', selectedCategory.id.toString());
      startTransition(() => {
        updateAction(formDataObj);
      });
    } else {
      startTransition(() => {
        createAction(formDataObj);
      });
    }
  }

  async function handleDelete(categoryId: number) {
    if (!confirm('Are you sure you want to delete this category?')) return;

    const formData = new FormData();
    formData.append('id', categoryId.toString());

    startTransition(() => {
      deleteAction(formData);
    });
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
    });
    setSelectedCategory(null);
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-lg lg:text-2xl font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Catalog Management
        </h1>
        <Button 
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <Card className={isDark ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
        <CardHeader>
          <CardTitle className={isDark ? 'text-white' : ''}>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : categories.length > 0 ? (
            <div className="space-y-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    isDark 
                      ? 'bg-[#1a1a1a] border-[#2A2A2A] hover:bg-[#202020]' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <h3 className={`font-medium ${isDark ? 'text-white' : ''}`}>
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {category.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCategory(category);
                        setFormData({
                          name: category.name,
                          description: category.description || '',
                        });
                        setIsDialogOpen(true);
                      }}
                      className={isDark ? 'border-[#2A2A2A] hover:bg-[#202020]' : ''}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
                      className={`text-red-500 ${
                        isDark 
                          ? 'border-[#2A2A2A] hover:bg-[#202020]' 
                          : 'hover:bg-red-50'
                      }`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              No categories found. Click "Add Category" to create one.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={isDark ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
          <DialogHeader>
            <DialogTitle className={isDark ? 'text-white' : ''}>
              {selectedCategory ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className={isDark ? 'text-white' : ''}>Category Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={isDark ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className={isDark ? 'text-white' : ''}>Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className={isDark ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isCreatePending || isUpdatePending}
            >
              {isCreatePending || isUpdatePending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Category'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
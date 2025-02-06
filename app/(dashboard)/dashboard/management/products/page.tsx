'use client';

import { useState, useEffect, startTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, ImagePlus, Loader2 } from 'lucide-react';
import { useUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';
import { useTheme } from '@/lib/theme-provider';
import Image from 'next/image';
import { useActionState } from 'react';
import { createProduct, updateProduct, deleteProduct, getProducts, getCategories } from './actions';
import type { ProductCategory } from '@/lib/db/schema';

interface Product {
  id: number;
  categoryId: number | null;
  code: string;
  name: string;
  description: string | null;
  weight: string;
  weightUnit: string;
  purity: string;
  sellingPrice: string;
  workmanshipFee: string;
  imageUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProductsPage() {
  const { user } = useUser();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    name: '',
    description: '',
    weight: '',
    weightUnit: 'gram',
    purity: '',
    sellingPrice: '',
    workmanshipFee: '',
    imageUrl: '',
  });

  const [createState, createAction, isCreatePending] = useActionState(createProduct, {});
  const [updateState, updateAction, isUpdatePending] = useActionState(updateProduct, {});
  const [deleteState, deleteAction, isDeletePending] = useActionState(deleteProduct, {});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (createState.success || updateState.success || deleteState.success) {
      toast.success(createState.success || updateState.success || deleteState.success);
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    }

    if (createState.error || updateState.error || deleteState.error) {
      toast.error(createState.error || updateState.error || deleteState.error);
    }
  }, [createState, updateState, deleteState]);

  if (!user || user.role !== 'admin') {
    redirect('/dashboard');
  }

  async function fetchData() {
    try {
      const [productsData, categoriesData] = await Promise.all([
        getProducts(),
        getCategories()
      ]);
      
      // Filter to show only active products
      const activeProducts = productsData.filter(product => product.status === 'active');
      
      // Convert the raw data to match our Product interface
      const formattedProducts: Product[] = activeProducts.map(product => ({
        id: product.id,
        categoryId: product.categoryId,
        code: product.code,
        name: product.name,
        description: product.description,
        weight: String(product.weight),
        weightUnit: product.weightUnit,
        purity: String(product.purity),
        sellingPrice: String(product.sellingPrice),
        workmanshipFee: String(product.workmanshipFee),
        imageUrl: product.imageUrl,
        status: product.status,
        createdAt: new Date(product.createdAt).toISOString(),
        updatedAt: new Date(product.updatedAt).toISOString()
      }));

      setProducts(formattedProducts);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
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

    if (selectedProduct) {
      formDataObj.append('id', selectedProduct.id.toString());
      startTransition(() => {
        updateAction(formDataObj);
      });
    } else {
      startTransition(() => {
        createAction(formDataObj);
      });
    }
  }

  async function handleDelete(productId: number) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const formData = new FormData();
    formData.append('id', productId.toString());

    startTransition(() => {
      deleteAction(formData);
    });
  }

  function resetForm() {
    setFormData({
      categoryId: '',
      name: '',
      description: '',
      weight: '',
      weightUnit: 'gram',
      purity: '',
      sellingPrice: '',
      workmanshipFee: '',
      imageUrl: '',
    });
    setSelectedProduct(null);
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-lg lg:text-2xl font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Product Management
        </h1>
        <Button 
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <Card className={isDark ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
        <CardHeader>
          <CardTitle className={isDark ? 'text-white' : ''}>Products</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : products.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`border rounded-lg p-4 ${
                    isDark 
                      ? 'bg-[#1a1a1a] border-[#2A2A2A] hover:bg-[#202020]' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="aspect-square relative mb-4 rounded-lg overflow-hidden bg-gray-100">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImagePlus className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <h3 className={`font-medium ${isDark ? 'text-white' : ''}`}>{product.name}</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Code: {product.code}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {product.weight} {product.weightUnit} | {product.purity}% purity
                  </p>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>ราคาสินค้า:</span>
                      <span className="font-medium">฿{Number(product.sellingPrice).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>ค่ากำเหน็จ:</span>
                      <span className="font-medium">฿{Number(product.workmanshipFee).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : ''}`}>ราคารวม:</span>
                      <span className="font-bold text-orange-500">
                        ฿{(Number(product.sellingPrice) + Number(product.workmanshipFee)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProduct(product);
                        setFormData({
                          categoryId: product.categoryId?.toString() || '',
                          name: product.name,
                          description: product.description || '',
                          weight: product.weight,
                          weightUnit: product.weightUnit,
                          purity: product.purity,
                          sellingPrice: product.sellingPrice,
                          workmanshipFee: product.workmanshipFee,
                          imageUrl: product.imageUrl || '',
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
                      onClick={() => handleDelete(product.id)}
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
              No products found. Click "Add Product" to create one.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={isDark ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
          <DialogHeader>
            <DialogTitle className={isDark ? 'text-white' : ''}>
              {selectedProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="category" className={isDark ? 'text-white' : ''}>Category</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
              >
                <SelectTrigger className={isDark ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className={isDark ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}>
                  {categories.map((category) => (
                    <SelectItem 
                      key={category.id} 
                      value={category.id.toString()}
                      className={isDark ? 'text-white focus:bg-[#252525]' : ''}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="name" className={isDark ? 'text-white' : ''}>Product Name</Label>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight" className={isDark ? 'text-white' : ''}>Weight</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.0001"
                  value={formData.weight}
                  onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                  className={isDark ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}
                  required
                />
              </div>
              <div>
                <Label htmlFor="weightUnit" className={isDark ? 'text-white' : ''}>Unit</Label>
                <Select
                  value={formData.weightUnit}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, weightUnit: value as 'gram' | 'baht' }))}
                >
                  <SelectTrigger className={isDark ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={isDark ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}>
                    <SelectItem value="gram">Gram</SelectItem>
                    <SelectItem value="baht">Baht</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="purity" className={isDark ? 'text-white' : ''}>Purity (%)</Label>
              <Input
                id="purity"
                type="number"
                step="0.01"
                value={formData.purity}
                onChange={(e) => setFormData(prev => ({ ...prev, purity: e.target.value }))}
                className={isDark ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}
                required
              />
            </div>

            <div>
              <Label htmlFor="sellingPrice" className={isDark ? 'text-white' : ''}>Selling Price</Label>
              <Input
                id="sellingPrice"
                type="number"
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: e.target.value }))}
                className={isDark ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}
                required
              />
            </div>

            <div>
              <Label htmlFor="workmanshipFee" className={isDark ? 'text-white' : ''}>Workmanship Fee</Label>
              <Input
                id="workmanshipFee"
                type="number"
                step="0.01"
                value={formData.workmanshipFee}
                onChange={(e) => setFormData(prev => ({ ...prev, workmanshipFee: e.target.value }))}
                className={isDark ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}
                required
              />
            </div>

            <div>
              <Label htmlFor="imageUrl" className={isDark ? 'text-white' : ''}>Image URL</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                className={isDark ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}
                placeholder="https://example.com/image.jpg"
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
                'Save Product'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ImagePlus, Loader2, AlertCircle } from 'lucide-react';
import { useTheme } from '@/lib/theme-provider';
import Image from 'next/image';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Product {
  id: number;
  categoryId: number;
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
}

export default function GoldJewelryPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [productsResponse, balanceResponse] = await Promise.all([
        fetch('/api/management/products', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }),
        fetch('/api/user/balance')
      ]);

      if (productsResponse.ok && balanceResponse.ok) {
        const [productsData, balanceData] = await Promise.all([
          productsResponse.json(),
          balanceResponse.json()
        ]);

        // Filter for active jewelry products (categoryId 1)
        const jewelryProducts = productsData.filter((product: Product) => 
          product.categoryId === 1 && 
          product.status === 'active'
        );

        console.log('Fetched products:', jewelryProducts); // Debug log
        setProducts(jewelryProducts);
        setBalance(Number(balanceData.balance));
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }

  const calculateTotalPrice = (product: Product) => {
    return Number(product.sellingPrice) + Number(product.workmanshipFee);
  };

  const handleBuyClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handlePurchase = async () => {
    if (!selectedProduct) return;

    const totalPrice = calculateTotalPrice(selectedProduct);

    if (totalPrice > balance) {
      toast.error('ยอดเงินในบัญชีไม่เพียงพอ');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/management/jewelry/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          name: selectedProduct.name,
          amount: Number(selectedProduct.weight),
          totalPrice: totalPrice
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process purchase');
      }

      const data = await response.json();
      
      // Update balance
      setBalance(Number(data.balance));
      
      // Remove the purchased product from the list
      setProducts(prevProducts => 
        prevProducts.filter(product => product.id !== selectedProduct.id)
      );
      
      toast.success('ซื้อสินค้าสำเร็จ');
      setIsDialogOpen(false);
      setSelectedProduct(null);
      
      // Refresh the products list
      fetchData();
    } catch (error) {
      console.error('Error processing purchase:', error);
      toast.error('เกิดข้อผิดพลาดในการซื้อสินค้า');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className={`text-lg lg:text-2xl font-medium mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        ทองรูปพรรณ
      </h1>

      <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-[#151515] border-[#2A2A2A]' : 'bg-white border border-gray-200'}`}>
        <div className="flex justify-between items-center">
          <div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>ยอดเงินในบัญชี</p>
            <p className="text-2xl font-bold text-orange-500">฿{balance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <Card className={isDark ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingBag className="h-6 w-6 text-orange-500" />
            <span className={isDark ? 'text-white' : ''}>สินค้าทองรูปพรรณ</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : products.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`border rounded-lg overflow-hidden ${
                    isDark 
                      ? 'bg-[#1a1a1a] border-[#2A2A2A] hover:bg-[#202020]' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="aspect-square relative">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-100">
                        <ImagePlus className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className={`font-medium ${isDark ? 'text-white' : ''}`}>
                      {product.name}
                    </h3>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      รหัสสินค้า: {product.code}
                    </p>
                    {product.description && (
                      <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {product.description}
                      </p>
                    )}
                    <div className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <p>น้ำหนัก: {product.weight} {product.weightUnit}</p>
                      <p>ความบริสุทธิ์: {product.purity}%</p>
                    </div>
                    <div className="mt-4">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>ราคาสินค้า:</span>
                          <span className="font-medium">฿{Number(product.sellingPrice).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>ค่ากำเหน็จ:</span>
                          <span className="font-medium">฿{Number(product.workmanshipFee).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                          <span className={`text-sm font-medium ${isDark ? 'text-white' : ''}`}>ราคารวม:</span>
                          <span className="text-lg font-bold text-orange-500">
                            ฿{calculateTotalPrice(product).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <Button 
                        className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => handleBuyClick(product)}
                      >
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        ซื้อ
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              ไม่พบสินค้าทองรูปพรรณในขณะนี้
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={isDark ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
          <DialogHeader>
            <DialogTitle className={isDark ? 'text-white' : ''}>
              ยืนยันการซื้อสินค้า
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
                <h3 className={`font-medium ${isDark ? 'text-white' : ''}`}>
                  {selectedProduct.name}
                </h3>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  รหัสสินค้า: {selectedProduct.code}
                </p>
                <div className={`mt-4 space-y-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div className="flex justify-between">
                    <span>น้ำหนัก:</span>
                    <span>{selectedProduct.weight} {selectedProduct.weightUnit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ความบริสุทธิ์:</span>
                    <span>{selectedProduct.purity}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ราคาสินค้า:</span>
                    <span>฿{Number(selectedProduct.sellingPrice).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ค่ากำเหน็จ:</span>
                    <span>฿{Number(selectedProduct.workmanshipFee).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="font-medium">ราคารวมทั้งสิ้น:</span>
                    <span className="font-bold text-orange-500">
                      ฿{calculateTotalPrice(selectedProduct).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {calculateTotalPrice(selectedProduct) > balance && (
                <div className={`p-4 rounded-lg bg-red-100 ${isDark ? 'bg-red-900/20' : ''}`}>
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                      ยอดเงินในบัญชีไม่เพียงพอ กรุณาเติมเงินก่อนทำรายการ
                    </p>
                  </div>
                </div>
              )}

              <Button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                onClick={handlePurchase}
                disabled={isProcessing || calculateTotalPrice(selectedProduct) > balance}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังดำเนินการ...
                  </>
                ) : (
                  'ยืนยันการซื้อ'
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
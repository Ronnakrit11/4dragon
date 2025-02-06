'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShieldAlert, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';
import { useTheme } from '@/lib/theme-provider';

interface DepositLimit {
  id: number;
  name: string;
  dailyLimit: string;
  monthlyLimit: string;
  createdAt: string;
}

export default function DepositLimitsPage() {
  const { user } = useUser();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [limits, setLimits] = useState<DepositLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLimit, setSelectedLimit] = useState<DepositLimit | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dailyLimit: '',
  });

  useEffect(() => {
    fetchLimits();
  }, []);

  if (!user || user.role !== 'admin') {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <Card className={isDark ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShieldAlert className="h-12 w-12 text-orange-500 mb-4" />
            <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Access Denied</h2>
            <p className={`text-center max-w-md ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Only administrators have access to deposit limits management.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  async function fetchLimits() {
    try {
      const response = await fetch('/api/deposit-limits');
      if (response.ok) {
        const data = await response.json();
        setLimits(data);
      }
    } catch (error) {
      console.error('Error fetching deposit limits:', error);
      toast.error('Failed to fetch deposit limits');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const response = await fetch('/api/deposit-limits', {
        method: selectedLimit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedLimit?.id,
          name: formData.name,
          dailyLimit: formData.dailyLimit,
          monthlyLimit: formData.dailyLimit, // Set monthly limit same as daily for simplification
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save deposit limit');
      }

      toast.success(selectedLimit ? 'Limit updated successfully' : 'Limit added successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchLimits();
    } catch (error) {
      console.error('Error saving deposit limit:', error);
      toast.error('Failed to save deposit limit');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this limit?')) return;

    try {
      const response = await fetch(`/api/deposit-limits?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete deposit limit');
      }

      toast.success('Limit deleted successfully');
      fetchLimits();
    } catch (error) {
      console.error('Error deleting deposit limit:', error);
      toast.error('Failed to delete deposit limit');
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      dailyLimit: '',
    });
    setSelectedLimit(null);
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-lg lg:text-2xl font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          ตั้งค่าเพดานเงินฝาก
        </h1>
        <Button 
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มเพดานเงินฝาก
        </Button>
      </div>

      <Card className={isDark ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
        <CardHeader>
          <CardTitle className={isDark ? 'text-white' : ''}>Deposit Limits</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : limits.length > 0 ? (
            <div className="space-y-4">
              {limits.map((limit) => (
                <div
                  key={limit.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    isDark 
                      ? 'bg-[#1a1a1a] border-[#2A2A2A] hover:bg-[#202020]' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <h3 className={`font-medium ${isDark ? 'text-white' : ''}`}>
                      {limit.name}
                    </h3>
                    <div className={`mt-1 space-y-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <p>จำนวนเงิน: ฿{Number(limit.dailyLimit).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedLimit(limit);
                        setFormData({
                          name: limit.name,
                          dailyLimit: limit.dailyLimit,
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
                      onClick={() => handleDelete(limit.id)}
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
              ยังไม่มีการตั้งค่าเพดานเงินฝาก คลิก "เพิ่มเพดานเงินฝาก" เพื่อเพิ่ม
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={isDark ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
          <DialogHeader>
            <DialogTitle className={isDark ? 'text-white' : ''}>
              {selectedLimit ? 'แก้ไขเพดานเงินฝาก' : 'เพิ่มเพดานเงินฝาก'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className={isDark ? 'text-white' : ''}>ชื่อระดับ</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="เช่น Bronze, Silver, Gold"
                className={isDark ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}
                required
              />
            </div>

            <div>
              <Label htmlFor="dailyLimit" className={isDark ? 'text-white' : ''}>จำนวนเงิน (บาท)</Label>
              <Input
                id="dailyLimit"
                type="number"
                value={formData.dailyLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, dailyLimit: e.target.value }))}
                placeholder="ใส่จำนวนเงิน"
                className={isDark ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}
                required
                min="0"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                'บันทึก'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
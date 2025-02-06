'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldAlert, Mail, Shield, UserPlus, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTheme } from '@/lib/theme-provider';

interface Admin {
  id: number;
  email: string;
  name: string | null;
  createdAt: string;
}

const MAIN_ADMIN_EMAIL = 'ronnakritnook1@gmail.com';

export default function AdminPage() {
    const { user } = useUser();
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      password: '',
    });
    const { theme } = useTheme();
    const isDark = theme === 'dark';
  
    useEffect(() => {
      fetchAdmins();
    }, []);
  
    if (!user) {
      redirect('/sign-in');
    }
  
    if (user.role !== 'admin') {
      return (
        <section className="flex-1 p-4 lg:p-8">
          <Card className={isDark ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShieldAlert className="h-12 w-12 text-orange-500 mb-4" />
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Access Denied</h2>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-center max-w-md`}>
                Only administrators have access to this page.
              </p>
            </CardContent>
          </Card>
        </section>
      );
    }

  async function fetchAdmins() {
    try {
      const response = await fetch('/api/admin/list');
      if (response.ok) {
        const data = await response.json();
        setAdmins(data);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to fetch admin information');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch('/api/admin/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create admin');
      }

      toast.success('Admin created successfully');
      setIsDialogOpen(false);
      setFormData({ name: '', email: '', password: '' });
      fetchAdmins();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create admin');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-lg lg:text-2xl font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Admin Management
        </h1>
        <Button 
          onClick={() => setIsDialogOpen(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Admin
        </Button>
      </div>

      <Card className={isDark ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-orange-500" />
            <span className={isDark ? 'text-white' : ''}>Administrators</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  isDark 
                    ? 'bg-[#000000] border-[#2A2A2A] hover:bg-[#151515]' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-2 ${isDark ? 'bg-[#151515]' : 'bg-orange-100'} rounded-full`}>
                    <Mail className={`h-5 w-5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                  </div>
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {admin.name || 'Unnamed Admin'}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{admin.email}</p>
                  </div>
                </div>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Added {new Date(admin.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={isDark ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
          <DialogHeader>
            <DialogTitle className={isDark ? 'text-white' : ''}>Add New Administrator</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className={isDark ? 'text-white' : ''}>Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter admin name"
                required
                className={isDark ? 'bg-[#000000] border-[#2A2A2A] text-white placeholder:text-gray-500' : ''}
              />
            </div>
            <div>
              <Label htmlFor="email" className={isDark ? 'text-white' : ''}>Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter admin email"
                required
                className={isDark ? 'bg-[#000000] border-[#2A2A2A] text-white placeholder:text-gray-500' : ''}
              />
            </div>
            <div>
              <Label htmlFor="password" className={isDark ? 'text-white' : ''}>Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter admin password"
                required
                minLength={8}
                className={isDark ? 'bg-[#121212] border-[#2A2A2A] text-white placeholder:text-gray-500' : ''}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Admin'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
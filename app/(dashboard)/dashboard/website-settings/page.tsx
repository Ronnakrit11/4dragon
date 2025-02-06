'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Settings, ShieldAlert, Save } from 'lucide-react';
import { useUser } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { redirect } from 'next/navigation';
import { useTheme } from '@/lib/theme-provider';

export default function WebsiteSettingsPage() {
  const { user } = useUser();
  const [settings, setSettings] = useState({
    facebookLink: '',
    lineOaLink: '',
    phoneNumber: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/social-settings');
        if (response.ok) {
          const data = await response.json();
          setSettings({
            facebookLink: data.facebook_link || '',
            lineOaLink: data.line_oa_link || '',
            phoneNumber: data.phone_number || ''
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    }

    fetchSettings();
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
              Only administrators have access to website settings. Please contact an administrator for assistance.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/social-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          facebook_link: settings.facebookLink,
          line_oa_link: settings.lineOaLink,
          phone_number: settings.phoneNumber
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className={`text-lg lg:text-2xl font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
        Website Settings
      </h1>
      <Card className={isDark ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-6 w-6 text-orange-500" />
            <span className={isDark ? 'text-white' : ''}>Social Media Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="facebook" className={isDark ? 'text-white' : ''}>Facebook Link</Label>
                <Input
                  id="facebook"
                  value={settings.facebookLink}
                  onChange={(e) => setSettings(prev => ({ ...prev, facebookLink: e.target.value }))}
                  placeholder="https://facebook.com/your-page"
                  className={isDark ? 'bg-[#000000] border-[#2A2A2A] text-white placeholder:text-gray-500' : ''}
                />
              </div>

              <div>
                <Label htmlFor="line" className={isDark ? 'text-white' : ''}>Line OA Link</Label>
                <Input
                  id="line"
                  value={settings.lineOaLink}
                  onChange={(e) => setSettings(prev => ({ ...prev, lineOaLink: e.target.value }))}
                  placeholder="https://line.me/your-account"
                  className={isDark ? 'bg-[#000000] border-[#2A2A2A] text-white placeholder:text-gray-500' : ''}
                />
              </div>

              <div>
                <Label htmlFor="phone" className={isDark ? 'text-white' : ''}>Phone Number</Label>
                <Input
                  id="phone"
                  value={settings.phoneNumber}
                  onChange={(e) => setSettings(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="+66123456789"
                  className={isDark ? 'bg-[#000000] border-[#2A2A2A] text-white placeholder:text-gray-500' : ''}
                />
              </div>
            </div>

            {message.text && (
              <p className={`text-sm ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                {message.text}
              </p>
            )}

            <Button 
              type="submit" 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Settings className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
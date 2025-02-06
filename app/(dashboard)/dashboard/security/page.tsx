'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Lock, Trash2, Loader2 } from 'lucide-react';
import { startTransition, useActionState } from 'react';
import { updatePassword, deleteAccount } from '@/app/(login)/actions';
import { useTheme } from '@/lib/theme-provider';

type ActionState = {
  error?: string;
  success?: string;
};

export default function SecurityPage() {
  const { theme } = useTheme();
  const [passwordState, passwordAction, isPasswordPending] = useActionState<
    ActionState,
    FormData
  >(updatePassword, { error: '', success: '' });

  const [deleteState, deleteAction, isDeletePending] = useActionState<
    ActionState,
    FormData
  >(deleteAccount, { error: '', success: '' });

  const handlePasswordSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    startTransition(() => {
      passwordAction(new FormData(event.currentTarget));
    });
  };

  const handleDeleteSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    startTransition(() => {
      deleteAction(new FormData(event.currentTarget));
    });
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className={`text-lg lg:text-2xl font-medium bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        Security Settings
      </h1>
      <Card className={`mb-8 ${theme === 'dark' ? 'bg-[#151515] border-[#2A2A2A]' : ''}`}>
        <CardHeader>
          <CardTitle className={theme === 'dark' ? 'text-white' : ''}>Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handlePasswordSubmit}>
            <div>
              <Label htmlFor="current-password" className={theme === 'dark' ? 'text-white' : ''}>
                Current Password
              </Label>
              <Input
                id="current-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                maxLength={100}
                className={theme === 'dark' ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}
              />
            </div>
            <div>
              <Label htmlFor="new-password" className={theme === 'dark' ? 'text-white' : ''}>
                New Password
              </Label>
              <Input
                id="new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={100}
                className={theme === 'dark' ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}
              />
            </div>
            <div>
              <Label htmlFor="confirm-password" className={theme === 'dark' ? 'text-white' : ''}>
                Confirm New Password
              </Label>
              <Input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                maxLength={100}
                className={theme === 'dark' ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}
              />
            </div>
            {passwordState.error && (
              <p className="text-red-500 text-sm">{passwordState.error}</p>
            )}
            {passwordState.success && (
              <p className="text-green-500 text-sm">{passwordState.success}</p>
            )}
            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isPasswordPending}
            >
              {isPasswordPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Update Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

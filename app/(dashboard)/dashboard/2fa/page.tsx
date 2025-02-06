'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QrCode, Loader2, Key, ShieldCheck, ShieldOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useUser } from '@/lib/auth';
import Image from 'next/image';
import { useTheme } from '@/lib/theme-provider';

export default function TwoFactorAuthPage() {
  const { theme } = useTheme();
  const { user } = useUser();
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');

  useEffect(() => {
    if (user?.twoFactorEnabled) {
      setIs2FAEnabled(true);
    }
  }, [user]);

  const handleEnable2FA = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/2fa/enable', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to enable 2FA');
      }

      const data = await response.json();
      setSecret(data.secret);
      
      const otpauthUrl = `otpauth://totp/Gold%20Trading%20System:${encodeURIComponent(user?.email || '')}?secret=${data.secret}&issuer=Gold%20Trading%20System&algorithm=SHA1&digits=6&period=30`;
      
      setShowQRCode(true);
      toast.success('กรุณาคัดลอก และกรอกรหัสยืนยัน');
    } catch (error) {
      toast.error('ไม่สามารถเปิดใช้งาน 2FA ได้');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/2fa/disable', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to disable 2FA');
      }

      setIs2FAEnabled(false);
      setShowQRCode(false);
      setSecret('');
      toast.success('ปิดการใช้งาน 2FA เรียบร้อยแล้ว');
    } catch (error) {
      toast.error('ไม่สามารถปิดการใช้งาน 2FA ได้');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationCode }),
      });

      if (!response.ok) {
        throw new Error('Invalid verification code');
      }

      setIs2FAEnabled(true);
      setShowQRCode(false);
      toast.success('เปิดใช้งาน 2FA สำเร็จ');
    } catch (error) {
      toast.error('รหัสยืนยันไม่ถูกต้อง');
    } finally {
      setIsLoading(false);
      setVerificationCode('');
    }
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className={`text-lg lg:text-2xl font-medium text-gray-900 mb-6 ${theme === 'dark' ? 'text-white' : ''}`}>
        ตั้งค่าการยืนยันตัวตนสองชั้น (2FA)
      </h1>

      <Card className={theme === 'dark' ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
        <CardHeader>
          <CardTitle className={`flex items-center space-x-2 ${theme === 'dark' ? 'text-white' : ''}`}>
            <Key className="h-6 w-6 text-orange-500" />
            <span>การยืนยันตัวตนสองชั้น</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : ''}`}>
                  {is2FAEnabled ? 'เปิดใช้งาน 2FA แล้ว' : 'ยังไม่ได้เปิดใช้งาน 2FA'}
                </h3>
                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  การยืนยันตัวตนสองชั้นช่วยเพิ่มความปลอดภัยให้กับบัญชีของคุณ
                </p>
              </div>
              {is2FAEnabled ? (
                <Button
                  variant="destructive"
                  onClick={handleDisable2FA}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังปิดการใช้งาน...
                    </>
                  ) : (
                    <>
                      <ShieldOff className="mr-2 h-4 w-4" />
                      ปิดการใช้งาน 2FA
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={handleEnable2FA}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังเปิดใช้งาน...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      เปิดใช้งาน 2FA
                    </>
                  )}
                </Button>
              )}
            </div>

            {showQRCode && (
              <div className="space-y-6">
                <div className={`border rounded-lg p-6 ${theme === 'dark' ? 'bg-[#1a1a1a] border-[#2A2A2A]' : 'bg-gray-50'}`}>
                  <div className="flex flex-col items-center justify-center mb-4">
                    {qrCodeUrl && (
                      <Image
                        src={qrCodeUrl}
                        alt="2FA QR Code"
                        width={300}
                        height={300}
                        className="rounded-lg mb-4"
                      />
                    )}
                    {secret && (
                      <div className="text-center">
                        <p className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : ''}`}>รหัสลับสำหรับตั้งค่าด้วยตนเอง:</p>
                        <code className={`px-3 py-1 rounded text-sm ${theme === 'dark' ? 'bg-[#252525] text-white' : 'bg-gray-100'}`}>{secret}</code>
                      </div>
                    )}
                  </div>
                  <p className={`text-sm text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    สแกน QR Code นี้ด้วยแอพ Authenticator เช่น Google Authenticator หรือ Microsoft Authenticator
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="verification-code" className={theme === 'dark' ? 'text-white' : ''}>รหัสยืนยัน</Label>
                    <Input
                      id="verification-code"
                      type="text"
                      placeholder="กรอกรหัส 6 หลักจากแอพ Authenticator"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      className={theme === 'dark' ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}
                    />
                  </div>
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={handleVerifyCode}
                    disabled={verificationCode.length !== 6 || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        กำลังตรวจสอบ...
                      </>
                    ) : (
                      'ยืนยันรหัส'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {is2FAEnabled && (
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-green-900/20 border border-green-900' : 'bg-green-50 border border-green-200'}`}>
                <div className="flex items-center">
                  <ShieldCheck className={`h-5 w-5 mr-2 ${theme === 'dark' ? 'text-green-400' : 'text-green-500'}`} />
                  <p className={theme === 'dark' ? 'text-green-400' : 'text-green-700'}>
                    การยืนยันตัวตนสองชั้นกำลังทำงาน บัญชีของคุณได้รับการป้องกันเพิ่มเติม
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

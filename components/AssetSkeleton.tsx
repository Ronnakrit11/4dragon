"use client"
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/lib/theme-provider";

export function AssetSkeleton() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      {/* Account Value Card Skeleton */}
      <Card className={isDark ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
        <CardHeader>
          <Skeleton className={`h-6 w-32 ${isDark ? 'bg-[#1a1a1a]' : ''}`} />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <Skeleton className={`h-8 w-48 mb-2 ${isDark ? 'bg-[#1a1a1a]' : ''}`} />
              <Skeleton className={`h-4 w-32 ${isDark ? 'bg-[#1a1a1a]' : ''}`} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Balance Card Skeleton */}
        <Card className={isDark ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
          <CardHeader>
            <Skeleton className={`h-6 w-32 ${isDark ? 'bg-[#1a1a1a]' : ''}`} />
          </CardHeader>
          <CardContent>
            <div className="mt-2">
              <Skeleton className={`h-8 w-36 mb-2 ${isDark ? 'bg-[#1a1a1a]' : ''}`} />
              <Skeleton className={`h-4 w-40 ${isDark ? 'bg-[#1a1a1a]' : ''}`} />
            </div>
          </CardContent>
        </Card>

        {/* Asset Distribution Card Skeleton */}
        <Card className={`md:col-span-2 ${isDark ? 'bg-[#151515] border-[#2A2A2A]' : ''}`}>
          <CardHeader>
            <Skeleton className={`h-6 w-32 ${isDark ? 'bg-[#1a1a1a]' : ''}`} />
          </CardHeader>
          <CardContent>
            <div className="mt-2">
              <Skeleton className={`h-8 w-48 mb-2 ${isDark ? 'bg-[#1a1a1a]' : ''}`} />
              <Skeleton className={`h-4 w-64 ${isDark ? 'bg-[#1a1a1a]' : ''}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Holdings Card Skeleton */}
      <Card className={isDark ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
        <CardHeader>
          <Skeleton className={`h-6 w-32 ${isDark ? 'bg-[#1a1a1a]' : ''}`} />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`p-4 border rounded-lg ${isDark ? 'border-[#2A2A2A]' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Skeleton className={`h-6 w-32 mb-2 ${isDark ? 'bg-[#1a1a1a]' : ''}`} />
                    <Skeleton className={`h-4 w-24 ${isDark ? 'bg-[#1a1a1a]' : ''}`} />
                  </div>
                  <div className="text-right">
                    <Skeleton className={`h-6 w-32 mb-2 ${isDark ? 'bg-[#1a1a1a]' : ''}`} />
                    <Skeleton className={`h-4 w-40 ${isDark ? 'bg-[#1a1a1a]' : ''}`} />
                  </div>
                </div>
                <div className="flex justify-between">
                  <div>
                    <Skeleton className={`h-4 w-36 mb-1 ${isDark ? 'bg-[#1a1a1a]' : ''}`} />
                    <Skeleton className={`h-4 w-32 ${isDark ? 'bg-[#1a1a1a]' : ''}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

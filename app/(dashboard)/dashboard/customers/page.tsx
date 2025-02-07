import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/db/drizzle';
import { users, depositLimits } from '@/lib/db/schema';
import { CustomerList } from './customer-list';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { desc, isNull } from 'drizzle-orm';
import { ShieldAlert } from 'lucide-react';
import { useTheme } from '@/lib/theme-provider';

export default async function CustomersPage() {
  const currentUser = await getUser();
  
  if (!currentUser) {
    redirect('/sign-in');
  }

  if (currentUser.role !== 'admin') {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <Card className="dark:bg-[#151515] dark:border-[#2A2A2A]">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShieldAlert className="h-12 w-12 text-orange-500 mb-4" />
            <h2 className="text-xl font-semibold dark:text-white text-gray-900 mb-2">Access Denied</h2>
            <p className="text-center max-w-md dark:text-gray-400 text-gray-500">
              Only administrators have access to the customer list. Please contact an administrator for assistance.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  // Get all users except deleted ones and admins
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      createdAt: users.createdAt,
      depositLimitId: users.depositLimitId,
    })
    .from(users)
    .where(isNull(users.deletedAt))
    .orderBy(desc(users.createdAt));

  // Get all deposit limits for the dropdown
  const depositLimitsList = await db
    .select()
    .from(depositLimits)
    .orderBy(depositLimits.name);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium dark:text-white text-gray-900 mb-6">
        Customers
      </h1>
      <Card className="dark:bg-[#151515] dark:border-[#2A2A2A]">
        <CardHeader>
          <CardTitle className="dark:text-white">Customer List</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerList users={allUsers} depositLimits={depositLimitsList} />
        </CardContent>
      </Card>
    </section>
  );
}
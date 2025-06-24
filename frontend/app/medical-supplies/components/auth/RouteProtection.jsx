"use client";
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMSAuth } from '../../hooks/useMSAuth';

export default function RouteProtection({ children }) {
  const { user, loading } = useMSAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Define your public paths that don't require authentication
  const publicPaths = [
    '/medical-supplies/auth/login', 
    '/medical-supplies/auth/signup',
    '/medical-supplies/'
  ];

  useEffect(() => {
    // Skip redirection during loading state to prevent flashing
    if (loading) return;

    // If user is not logged in and trying to access a protected route
    if (!user && !publicPaths.includes(pathname) && !pathname.startsWith('/medical-supplies/')) {
      console.log('Unauthenticated access, redirecting to home');
      router.push('/medical-supplies/');
    }
  }, [user, loading, pathname, router]);

  // Show loading state while checking authentication
  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  return children;
}
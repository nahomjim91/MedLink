"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMSAuth } from './MSAuthContext'; // Adjust import path as needed

export default function RouteGuard({ children }) {
  const { user, loading, canAccessRoute } = useMSAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Authentication check happens in the AuthProvider
    // Here we just do additional route permission checking

    // Skip during loading or on public routes
    if (loading) return;

    const publicPaths = [
      '/medical-supplies/',
      '/medical-supplies/auth/login',
      '/medical-supplies/auth/signup',
      '/medical-supplies/auth/registering'
    ];

    // Allow public paths for everyone
    if (publicPaths.some(path => pathname === path || pathname.startsWith(path))) {
      return;
    }

    // If authenticated but on a route not allowed for their role
    if (user && !canAccessRoute(pathname)) {
      console.log(`User with role ${user.role} attempted to access ${pathname} - redirecting`);
      
      // Redirect to appropriate role dashboard
      const rolePath = user.role === 'admin' 
        ? '/medical-supplies/admin/' 
        : `/medical-supplies/${user.role}/`;
        
      router.push(rolePath);
    }
    
    // If not authenticated and trying to access protected route
    if (!user && !publicPaths.includes(pathname)) {
      router.push('/medical-supplies/auth/login');
    }
    
  }, [user, loading, pathname, router, canAccessRoute]);

  return children;
}
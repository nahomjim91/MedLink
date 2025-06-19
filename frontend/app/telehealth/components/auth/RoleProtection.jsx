"use client";

import { useAuth } from "../../../../hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function RoleProtection({
  children,
  allowedRoles,
  redirectPath = "/telehealth/dashboard",
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If authentication completed (not loading) and user isn't logged in
    if (!loading && !user) {
      router.push("/telehealth/auth/login");
      return;
    }

    // If user is logged in but profile isn't complete, redirect to registration
    if (!loading && user && !user.profileComplete) {
      router.push("/telehealth/auth/registering");
      return;
    }

    // If user is logged in with complete profile but doesn't have the required role
    if (!loading && user && user.profileComplete) {
      // Case-insensitive role check
      const userRole = user.role?.toLowerCase();
      const allowedRolesLower = allowedRoles.map((role) => role.toLowerCase());

      if (!allowedRolesLower.includes(userRole)) {
        router.push(redirectPath);
        return;
      }
    }
  }, [user, loading, router, allowedRoles, redirectPath, pathname]);

  // Show loading state while checking auth
  const userRole = user?.role?.toLowerCase();
  const allowedRolesLower = allowedRoles.map((role) => role.toLowerCase());

  if (
    loading ||
    !user ||
    !user.profileComplete ||
    !allowedRolesLower.includes(userRole)
  ) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}

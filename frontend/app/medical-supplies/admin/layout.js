"use client";

import { useMSAuth } from "../hooks/useMSAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SharedLayout from "../components/layout/SharedLayout";

export default function AdminLayout({ children }) {
  const { user, loading } = useMSAuth();
  const router = useRouter();

  // Check if user is an admin
  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Not authenticated
      router.push("/medical-supplies/auth/login");
      return;
    }

    // Verify that the user is an admin
    if (user.role !== "admin") {
      console.log(
        `User with role ${user.role} attempted to access admin route - redirecting`
      );

      // Redirect to their correct role path
      const correctRolePath = `/medical-supplies/${user.role}`;
      router.push(correctRolePath);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If user is not admin, don't render anything while redirecting
  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen ">
      <SharedLayout>
        <main className="pl-2">
          {children}
        </main>
      </SharedLayout>
    </div>
  );
}

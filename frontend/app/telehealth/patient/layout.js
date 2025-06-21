"use client";

import { useAuth } from "../hooks/useAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SharedLayout from "../components/layout/SharedLayout";

export default function PatientLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Check if user is an admin
  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Not authenticated
      router.push("/telehealth/auth/login");
      return;
    }

    // Verify that the user is an admin
    if (user.role !== "patient") {
      console.log(
`        User with role ${user.role} attempted to access admin route - redirecting`
      );

      // Redirect to their correct role path
      const correctRolePath = `/telehealth/${user.role}`;
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
  if (!user || user.role !== "patient") {
    return null;
  }

  return (
    <div className="min-h-screen ">
      <SharedLayout allowedRoles={["PATIENT", "patient"]}>
        <main className="container mx-auto px-4">{children}</main>
      </SharedLayout>
    </div>
  );
}
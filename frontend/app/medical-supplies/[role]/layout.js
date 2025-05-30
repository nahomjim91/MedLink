"use client";

import { useParams } from "next/navigation";
import { useMSAuth } from "../hooks/useMSAuth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SharedLayout from "../components/layout/SharedLayout";
import { auth } from "../api/firebase/config";
import { SocketProvider } from "../context/SocketContext";

export default function RoleLayout({ children }) {
  const { user, loading } = useMSAuth();
  const router = useRouter();
  const params = useParams();
  const { role } = params;

  // Check if user is accessing the correct role-based route
  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Not authenticated
      router.push("/medical-supplies/auth/login");
      return;
    }

    // Verify that the user's role matches the URL role parameter
    if (user.role !== role) {
      console.log(
        `User with role ${user.role} attempted to access ${role} route - redirecting`
      );

      // Redirect to their correct role path
      const correctRolePath =
        user.role === "admin"
          ? "/medical-supplies/admin/"
          : `/medical-supplies/${user.role}/`;

      router.push(correctRolePath);
    }
  }, [user, loading, role, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If user doesn't match this role path, don't render anything while redirecting
  if (!user || user.role !== role) {
    return null;
  }

  // if not apprved, show waiting for approval
  // if (!user.isApproved) {
  //   console.log("user" , user)
  //  return router.push('/medical-supplies/'+user.role+'/waiting-for-approval');
  // }

  return (
    <div className="min-h-screen ">
      <SharedLayout>
        <SocketProvider>
          <main className="">{children}</main>
        </SocketProvider>
      </SharedLayout>
    </div>
  );
}

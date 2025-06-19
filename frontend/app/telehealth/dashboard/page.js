"use client";

import { useAuth } from "../../../hooks/useAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/telehealth/auth/login");
      } else if (!user.profileComplete) {
        router.push("/telehealth/auth/registering");
      } else if (user.role?.toLowerCase() === "admin") {
        router.push("/telehealth/admin");
      } else if (user.role?.toLowerCase() === "doctor") {
        router.push("/telehealth/doctor");
      } else if (user.role?.toLowerCase() === "patient") {
        router.push("/telehealth/patient");
      } else {
        // Handle unknown role - could be a fallback or error page
        console.error("Unknown user role:", user.role);
        // For now, redirect to registration in case role info is missing
        router.push("/telehealth/auth/registering");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}
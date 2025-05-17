"use client";

import { useParams } from "next/navigation";
import { useMSAuth } from "../../hooks/useMSAuth"; // Adjust path as needed
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MarketplaceLayout({ children }) {
  const { user, loading } = useMSAuth();
  const router = useRouter();
  const params = useParams();
  const { role } = params;

  // Check if user is accessing the correct role-based route
  useEffect(() => {
    if (loading) return;

    // Verify that the user's role matches the URL role parameter
    if (user.role === "importers") {
      console.log(
        `User with role ${user.role} attempted to access ${role} route - redirecting`
      );

      const correctRolePath = `/medical-supplies/${user.role}/`;

      router.push(correctRolePath);
    }
  }, [user, loading, role, router]);

  return <div>{children}</div>;
}

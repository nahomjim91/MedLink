"use client";

import SharedLayout from "../components/layout/SharedLayout";

export default function DoctorLayout({ children }) {
  return (
    <SharedLayout allowedRoles={["DOCTOR", "doctor"]}>
      {children}
    </SharedLayout>
  );
}
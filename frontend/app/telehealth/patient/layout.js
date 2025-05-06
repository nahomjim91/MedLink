"use client";

import SharedLayout from "../components/SharedLayout";

export default function PatientLayout({ children }) {
  return (
    <SharedLayout allowedRoles={["PATIENT", "patient"]}>
      {children}
    </SharedLayout>
  );
}
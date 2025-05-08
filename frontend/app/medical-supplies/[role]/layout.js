"use client";

import SharedLayout from "../components/layout/SharedLayout";

export default function AdminLayout({ children }) {
  return (
    <SharedLayout >
      {children}
    </SharedLayout>
  );
}
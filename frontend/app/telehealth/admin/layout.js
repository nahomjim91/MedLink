"use client";

import RoleProtection from "@/components/RoleProtection";
import { useAuth } from "@/app/api/auth/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/telehealth/admin" },
    { name: "Analytics", href: "/telehealth/admin/analytics" },
    { name: "Patients", href: "/telehealth/admin/patients" },
    { name: "Doctors", href: "/telehealth/admin/doctors" },
    { name: "Profile", href: "/telehealth/admin/profile" },
  ];

  return (
    <RoleProtection allowedRoles={["ADMIN"]}>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <div className="w-64 bg-blue-800 text-white p-4">
          <div className="text-xl font-bold mb-8">Telehealth Admin</div>
          
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={`block p-2 rounded ${
                  pathname === item.href 
                    ? "bg-blue-700 font-medium" 
                    : "hover:bg-blue-700"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          
          <div className="absolute bottom-4">
            <button 
              onClick={logout}
              className="p-2 hover:bg-blue-700 rounded"
            >
              Sign out
            </button>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <header className="bg-white shadow p-4">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-semibold">Admin Portal</h1>
              <div className="flex items-center gap-4">
                <span>{user?.firstName} {user?.lastName}</span>
                <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center">
                  {user?.photoURL ? (
                    <Image src={user.photoURL} alt="Profile" width={32} height={32} className="w-8 h-8 rounded-full" />
                  ) : (
                    <span>{user?.firstName?.[0] || user?.email?.[0]}</span>
                  )}
                </div>
              </div>
            </div>
          </header>
          
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </RoleProtection>
  );
}
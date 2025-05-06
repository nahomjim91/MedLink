"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { 
  Menu, 
  X, 
  Search, 
  Home, 
  BarChart2, 
  Clock, 
  Calendar, 
  MessageCircle, 
  Settings, 
  User, 
  Users, 
  LogOut,
  Bell
} from "lucide-react";

export default function SharedLayout({ children, allowedRoles = [] }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userType, setUserType] = useState("patient"); // Default to patient
  const [unseenChats, setUnseenChats] = useState(2);
  const [unseenNotifications, setUnseenNotifications] = useState(3);

  // Set user type based on user info
  useEffect(() => {
    if (user) {
      // Convert user role to lowercase for consistency
      const role = user.role?.toLowerCase() || user.type?.toLowerCase() || "patient";
      
      // Map role to user type
      if (role.includes("admin")) {
        setUserType("admin");
      } else if (role.includes("doctor")) {
        setUserType("doctor");
      } else {
        setUserType("patient");
      }
    }
  }, [user]);

  // Close mobile menu when changing route
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scrolling when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  // Navigation items based on user type
  const navigationItems = {
    doctor: [
      { name: "Home", path: "/doctor", icon: <Home size={24} /> },
      { name: "Analytics", path: "/doctor/analytics", icon: <BarChart2 size={24} /> },
      { name: "History", path: "/doctor/history", icon: <Clock size={24} /> },
      { name: "Appointments", path: "/doctor/appointments", icon: <Calendar size={24} /> },
      { name: "Chats", path: "/doctor/chats", icon: <MessageCircle size={24} /> },
      { name: "Calendar", path: "/doctor/calendar", icon: <Calendar size={24} /> },
    ],
    patient: [
      { name: "Home", path: "/patient", icon: <Home size={24} /> },
      { name: "Analytics", path: "/patient/analytics", icon: <BarChart2 size={24} /> },
      { name: "History", path: "/patient/history", icon: <Clock size={24} /> },
      { name: "Appointments", path: "/patient/appointments", icon: <Calendar size={24} /> },
      { name: "Chats", path: "/patient/chats", icon: <MessageCircle size={24} /> },
      { name: "Settings", path: "/patient/settings", icon: <Settings size={24} /> },
    ],
    admin: [
      { name: "Home", path: "/admin", icon: <Home size={24} /> },
      { name: "Analytics", path: "/admin/analytics", icon: <BarChart2 size={24} /> },
      { name: "History", path: "/admin/history", icon: <Clock size={24} /> },
      { name: "Patients", path: "/admin/patients", icon: <Users size={24} /> },
      { name: "Doctors", path: "/admin/doctors", icon: <User size={24} /> },
      { name: "Settings", path: "/admin/settings", icon: <Settings size={24} /> },
    ],
  };

  // Get current nav items based on user type
  const currentNavItems = navigationItems[userType] || navigationItems.patient;

  // Check if a path is active
  const isActive = (path) => {
    if (path === `/${userType}`) {
      return pathname === `/${userType}`;
    }
    return pathname.startsWith(path);
  };
  
  // Role protection check
  const isAuthorized = () => {
    if (allowedRoles.length === 0) return true; // No roles specified means everyone is allowed
    if (!user || !user.role) return false;
    
    const userRole = user.role.toUpperCase();
    return allowedRoles.some(role => role.toUpperCase() === userRole);
  };

  if (!isAuthorized()) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2">You don't have permission to access this page.</p>
          <Link href="/" className="mt-4 inline-block px-4 py-2 bg-primary text-white rounded-lg">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:flex-col md:w-64 bg-white shadow-md">
        {/* Logo area */}
        <div className="flex items-center justify-center h-16 md:h-20 border-b">
          <Link href={`/${userType}`} className="text-2xl font-bold text-secondary">
            MedLink
            <span className="text-primary text-xl ml-1">Telehealth</span>
          </Link>
        </div>

        {/* Navigation links */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          <nav className="flex-1 px-4 py-6 space-y-2">
            {currentNavItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center px-4 py-3 text-lg rounded-lg transition-colors ${
                  isActive(item.path)
                    ? "bg-primary text-white"
                    : "text-secondary hover:bg-gray-100"
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
                {item.name === "Chats" && unseenChats > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {unseenChats}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Bottom section with profile and logout */}
          <div className="p-4 border-t mt-auto">
            <Link 
              href={`/${userType}/profile`} 
              className="flex items-center px-4 py-3 text-lg text-secondary rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden mr-3">
                {user && user.image ? (
                  <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={20} />
                )}
              </div>
              Profile
            </Link>
            
            <button 
              onClick={logout}
              className="flex items-center w-full px-4 py-3 mt-2 text-lg text-secondary rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="mr-3"><LogOut size={24} /></span>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="bg-white shadow-md z-10">
          <div className="flex items-center justify-between px-4 py-4">
            {/* Mobile menu button */}
            <button
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-secondary hover:text-secondary hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">
                {isMobileMenuOpen ? "Close menu" : "Open menu"}
              </span>
              <AnimatePresence mode="wait" initial={false}>
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X size={24} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu size={24} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {/* Current page name - Mobile only */}
            <div className="md:hidden text-xl font-bold text-secondary">
              {currentNavItems.find(item => isActive(item.path))?.name || "MedLink"}
            </div>

            {/* Page title - Desktop only */}
            <div className="hidden md:block">
              <h1 className="text-2xl font-bold text-secondary">
                {currentNavItems.find(item => isActive(item.path))?.name || "MedLink"}
              </h1>
            </div>

            {/* Search Bar, Chat and Notification Icons */}
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative rounded-lg hidden md:block">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={20} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-primary focus:border-primary"
                  placeholder="Search anything..."
                />
              </div>

              {/* Icons Section */}
              <div className="flex items-center space-x-4">
                {/* Chat Icon */}
                <Link href={`/${userType}/chats`} className="relative">
                  <MessageCircle size={24} className="text-secondary" />
                  {unseenChats > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {unseenChats}
                    </span>
                  )}
                </Link>

                {/* Notification Icon */}
                <Link href={`/${userType}/notifications`} className="relative">
                  <Bell size={24} className="text-secondary" />
                  {unseenNotifications > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {unseenNotifications}
                    </span>
                  )}
                </Link>

                {/* Profile Icon - Mobile Only */}
                <div className="md:hidden">
                  <Link href={`/${userType}/profile`} className="block">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                      {user && user.image ? (
                        <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User size={20} />
                      )}
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="fixed inset-0 bg-white md:hidden z-40 h-screen w-full"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="flex flex-col h-full">
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between px-4 py-4 border-b">
                  <div className="text-2xl font-bold text-secondary">
                    MedLink
                    <span className="text-primary text-xl ml-1">Telehealth</span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-md text-secondary hover:bg-gray-100"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Mobile Search */}
                <div className="p-4 border-b">
                  <div className="relative rounded-lg">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={20} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-primary focus:border-primary"
                      placeholder="Search anything..."
                    />
                  </div>
                </div>

                {/* Mobile Navigation */}
                <div className="flex-1 overflow-y-auto p-4">
                  <nav className="space-y-2">
                    {currentNavItems.map((item) => (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={`flex items-center px-4 py-3 text-lg rounded-lg transition-colors ${
                          isActive(item.path)
                            ? "bg-primary text-white"
                            : "text-secondary hover:bg-gray-100"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="mr-3">{item.icon}</span>
                        {item.name}
                        {item.name === "Chats" && unseenChats > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {unseenChats}
                          </span>
                        )}
                      </Link>
                    ))}
                  </nav>
                </div>

                {/* Mobile Menu Footer */}
                <div className="mt-auto border-t p-4">
                  <Link 
                    href={`/${userType}/profile`} 
                    className="flex items-center px-4 py-3 text-lg text-secondary rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden mr-3">
                      {user && user.image ? (
                        <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User size={20} />
                      )}
                    </div>
                    Profile
                  </Link>
                  
                  <button 
                    onClick={logout}
                    className="flex items-center w-full px-4 py-3 mt-2 text-lg text-secondary rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="mr-3"><LogOut size={24} /></span>
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
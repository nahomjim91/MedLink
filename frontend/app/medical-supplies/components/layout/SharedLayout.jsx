"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useMSAuth } from "../../hooks/useMSAuth";
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
  Bell,
  ClipboardList,
  Package,
  HistoryIcon,
  ShoppingBag,
  ShoppingCart,
} from "lucide-react";
import { SearchBar } from "../ui/Input";
import { IconButton, ImageIconButton } from "../ui/Button";
import { FaQuestion } from "react-icons/fa";

export default function SharedLayout({ children, allowedRoles = [] }) {
  const { user, logout } = useMSAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userType, setUserType] = useState("healthFacility"); // Default to patient
  const [unseenChats, setUnseenChats] = useState(2);
  const [unseenNotifications, setUnseenNotifications] = useState(0);

  // Set user type based on user info
  useEffect(() => {
    if (user) {
      // Convert user role to lowercase for consistency
      const role =
        user.role?.toLowerCase() ||
        user.type?.toLowerCase() ||
        "healthFacility";

      // Map role to user type
      if (role.includes("admin")) {
        setUserType("admin");
      } else if (role.includes("importer")) {
        setUserType("importer");
      } else if (role.includes("supplier")) {
        setUserType("supplier");
      } else {
        setUserType("healthFacility");
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
    importer: [
      { name: "Home", path: "/medical-supplies/" + user.role + "/", icon: <Home /> },
      {
        name: "Inventory",
        path: "/medical-supplies/" +user.role+"/inventory",
        icon: <Package />,
      },
      {
        name: "Analytics",
        path: "/medical-supplies/" +user.role+"/analytics",
        icon: <BarChart2 />,
      },
      {
        name: "Orders",
        path: "/medical-supplies/" +user.role+"/orders",
        icon: <ClipboardList />,
      },
      {
        name: "History",
        path: "/medical-supplies/" +user.role+"/history",
        icon: <HistoryIcon />,
      },

      {
        name: "Chats",
        path: "/medical-supplies/" +user.role+"/chats",
        icon: <MessageCircle />,
      },

      {
        name: "Settings",
        path: "/medical-supplies/" +user.role+"/settings",
        icon: <Settings />,
      },
      {
        name: "Helps",
        path: "/medical-supplies/" +user.role+"/helps",
        icon: <FaQuestion />,
      },
    ],
    supplier: [
      { name: "Home", path: "/medical-supplies/" + user.role + "/", icon: <Home /> },
      {
        name: "Inventory",
        path: "/medical-supplies/" +user.role+"/inventory",
        icon: <Package />,
      },
      {
        name: "Analytics",
        path: "/medical-supplies/" +user.role+"/analytics",
        icon: <BarChart2 />,
      },
      {
        name: "Marketplace",
        path: "/medical-supplies/" +user.role+"/marketplace",
        icon: <ShoppingBag />,
      },
      {
        name: "Orders",
        path: "/medical-supplies/" +user.role+"/orders",
        icon: <ClipboardList />,
      },
      {
        name: "History",
        path: "/medical-supplies/" +user.role+"/history",
        icon: <HistoryIcon />,
      },

      {
        name: "Chats",
        path: "/medical-supplies/" +user.role+"/chats",
        icon: <MessageCircle />,
      },

      {
        name: "Settings",
        path: "/medical-supplies/" +user.role+"/settings",
        icon: <Settings />,
      },
      {
        name: "Helps",
        path: "/medical-supplies/" +user.role+"/helps",
        icon: <FaQuestion />,
      },
    ],
    healthFacility: [
      { name: "Home", path: "/medical-supplies/" + user.role + "/", icon: <Home /> },

      {
        name: "Analytics",
        path: "/medical-supplies/" +user.role+"/analytics",
        icon: <BarChart2 />,
      },
      {
        name: "Marketplace",
        path: "/medical-supplies/" +user.role+"/marketplace",
        icon: <ShoppingBag />,
      },
      {
        name: "Orders",
        path: "/medical-supplies/" +user.role+"/orders",
        icon: <ClipboardList />,
      },
      {
        name: "History",
        path: "/medical-supplies/" +user.role+"/history",
        icon: <HistoryIcon />,
      },
      {
        name: "Chats",
        path: "/medical-supplies/" +user.role+"/chats",
        icon: <MessageCircle />,
      },

      {
        name: "Settings",
        path: "/medical-supplies/" +user.role+"/settings",
        icon: <Settings />,
      },
      {
        name: "Helps",
        path: "/medical-supplies/" +user.role+"/helps",
        icon: <FaQuestion />,
      },
    ],
    admin: [
      { name: "Home", path: "/medical-supplies/admin", icon: <Home /> },
      {
        name: "Analytics",
        path: "/medical-supplies/" +user.role+"/analytics",
        icon: <BarChart2 />,
      },
      {
        name: "Pending Users",
        path: "/medical-supplies/" +user.role+"/pending-users",
        icon: <ClipboardList />,
      },

      {
        name: "History",
        path: "/medical-supplies/" +user.role+"/history",
        icon: <HistoryIcon />,
      },
      {
        name: "Users",
        path: "/medical-supplies/" +user.role+"/users",
        icon: <Users />,
      },
      {
        name: "Settings",
        path: "/medical-supplies/" +user.role+"/settings",
        icon: <Settings />,
      },
      {
        name: "Helps",
        path: "/medical-supplies/" +user.role+"/helps",
        icon: <FaQuestion />,
      },
    ],
  };

  // Get current nav items based on user type
  const currentNavItems =
    navigationItems[userType] || navigationItems.healthFacility;

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
    return allowedRoles.some((role) => role.toUpperCase() === userRole);
  };

  if (!isAuthorized()) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2">You don't have permission to access this page.</p>
          <Link
            href="/"
            className="mt-4 inline-block px-4 py-2 bg-primary text-white rounded-lg"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen p-0 md:pr-10 ">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:flex-col  ">
        {/* Logo area */}

        <div className="flex justify-center pt-6 pb-8">
          <div className="w-8 h-8">
            <Link
              href={`${userType}`}
              className="text-2xl font-bold text-secondary"
            >
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M50 10 L50 90 M10 50 L90 50 M20 20 L80 80 M20 80 L80 20"
                  stroke="#20D5BE"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Navigation links */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="bg-white mx-6 rounded-full shadow-sm flex flex-col items-center ">
            <nav className="flex-1 py-3 px-1 flex flex-col items-center gap-y-2  ">
              {currentNavItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center text-lg rounded-lg transition-colors cursor-pointer ${
                    item.name === "Settings" ? "mt-12" : ""
                  }`}
                >
                  <IconButton
                    icon={item.icon}
                    isActive={isActive(item.path)}
                    badge={item.badge}
                  />
                </Link>
              ))}
            </nav>
          </div>
          {/* Bottom section with profile and logout */}
          <div className="p-4 mt-auto flex flex-col items-center">
            <div
              onClick={logout}
              className="flex justify-center w-full px-4 py-3 mt-2 text-lg text-secondary rounded-lg hover:bg-gray-100 transition-colors"
            >
              <LogOut />
            </div>
            <Link
              href={`${userType}/profile`}
              className="flex items-center px-4 py-3 text-lg text-secondary rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ImageIconButton
                imageUrl={user.image || "/image/trees.jpg"}
                isActive={false}
                alt="Profile"
              />
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Navigation Bar */}
        <header>
          <div className="flex items-center justify-between px-4 py-4 md:pl-4 md:pr-0">
            {/* Current page name - Mobile only */}
            <div className="md:hidden text-xl font-bold text-secondary">
              {currentNavItems.find((item) => isActive(item.path))?.name ||
                "MedLink"}
            </div>

            {/* Page title - Desktop only */}
            <div className="hidden md:block">
              {(() => {
                const lastPath = pathname.split("/").filter(Boolean).pop();
                const isDashboard = lastPath === user.role;

                return (
                  <>
                    <h1 className="text-2xl font-bold text-secondary">
                      {isDashboard
                        ? "MedLink"
                        : lastPath.charAt(0).toUpperCase() + lastPath.slice(1)}
                    </h1>
                    {isDashboard && (
                      <p className="text-base text-secondary/50">
                        Explore information and activity about you properties
                      </p>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Search Bar, Chat and Notification Icons */}
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="hidden md:block ">
                <SearchBar />
              </div>

              {/* Icons Section */}
              <div className="flex items-center gap-2 md:gap-4 ">
                {/* Chat Icon */}
                <Link
                  href={`${userType}/chats`}
                  className="hidden md:block relative"
                >
                  <IconButton
                    icon={<MessageCircle />}
                    isActive={false}
                    badge={unseenChats}
                  />
                </Link>

                {/* Chat Icon */}
                <Link
                  href={`${userType}/carts`}
                  className="hidden md:block relative"
                >
                  <IconButton
                    icon={<ShoppingCart />}
                    isActive={false}
                    badge={unseenChats}
                  />
                </Link>

                {/* Notification Icon */}
                <Link href={`${userType}/notifications`} className="relative">
                  <IconButton
                    icon={<Bell />}
                    isActive={false}
                    badge={unseenNotifications}
                  />
                </Link>

                {/* Profile Icon - Mobile Only
                <div className="md:hidden">
                  <Link href={`/${userType}/profile`} className="block">
                    <ImageIconButton
                      imageUrl={user.image || "/image/trees.jpg"}
                      isActive={false}
                      alt="Profile"
                    />
                  </Link>
                </div> */}
                {/* Mobile menu button */}
                <motion.button
                  className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-secondary hover:text-secondary hover:bg-gray-100 z-50"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-expanded={isMobileMenuOpen}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
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
                </motion.button>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="fixed inset-0 bg-white md:hidden z-40 h-screen w-full"
              initial={{ clipPath: "circle(0% at 95% 5%)" }}
              animate={{ clipPath: "circle(150% at 95% 5%)" }}
              exit={{ clipPath: "circle(0% at 95% 5%)" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex flex-col h-full">
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between px-4 py-4 ">
                  <div className="text-2xl font-bold text-secondary">
                    MedLink
                    <span className="text-primary text-xl ml-1">
                      Telehealth
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-md text-secondary hover:bg-gray-100"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Mobile Search */}
                <div className="p-4 ">
                  <SearchBar />
                </div>

                {/* Mobile Navigation */}
                <div className="flex-1 overflow-y-auto p-4">
                  <nav className="space-y-2">
                    {currentNavItems.map((item) => (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={`flex items-center px-4 py-3 text-lg rounded-full transition-colors ${
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
                <div className="mt-auto p-4 flex items-center justify-between">
                  <div
                    onClick={logout}
                    className="flex items-center px-4 py-3 mt-2 text-lg text-secondary rounded-lg hover:bg-primary transition-colors cursor-pointer"
                  >
                    <LogOut size={24} className="hover:text-white" />
                  </div>
                  <Link href={`${userType}/profile`} className="block">
                    <ImageIconButton
                      imageUrl={user.image || "/image/trees.jpg"}
                      isActive={false}
                      alt="Profile"
                    />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto px-2">
          {children}
        </main>
      </div>
    </div>
  );
}

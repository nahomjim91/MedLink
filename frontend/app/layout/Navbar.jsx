"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageSelector from "../medical-supplies/components/ui/LanguageSelector";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMSAuth } from "../medical-supplies/hooks/useMSAuth";
import { useAuth } from "../telehealth/hooks/useAuth";

export default function Navbar({ service = "medical-supply" }) {
  // Use appropriate auth hook based on service
  const authHook = service !== "telehealth" ? useMSAuth : useAuth;
  const { user, logout } = authHook();
  
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Check if we're in the specific service section
  const isInServiceSection = service === "telehealth" 
    ? pathname.startsWith("/telehealth") 
    : !pathname.startsWith("/telehealth");

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when changing route
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Dynamic route generation based on service type
  const getRoute = (path) => {
    if (service === "telehealth") {
      return `/telehealth${path === "/" ? "" : path}`;
    }
    return '/medical-supplies'+ path;
  };

  // Check if a path is active, accounting for service prefix
  const isActive = (path) => {
    if (path === "/") {
      return service === "telehealth" 
        ? (pathname === "/" || pathname === "/telehealth")
        : (pathname === "/" && !pathname.startsWith("/telehealth"));
    }
    return service === "telehealth" 
      ? pathname === `/telehealth${path}` 
      : pathname === path;
  };

  // Prevent body scrolling when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  // Service-specific configurations
  const serviceConfig = {
    "medical-supply": {
      title: "MedLink",
      subtitle: null,
      primaryColor: "#25C8B1",
      primaryColorHover: "#22B8A5",
      showLanguageSelector: false,
      otherService: "telehealth",
      otherServiceLabel: "Telehealth",
      otherServiceRoute: "/telehealth"
    },
    "telehealth": {
      title: "MedLink",
      subtitle: "Telehealth",
      primaryColor: "#25C8B1",
      primaryColorHover: "#22B8A5",
      showLanguageSelector: true,
      otherService: "medical-supply",
      otherServiceLabel: "Medical Supply",
      otherServiceRoute: "/"
    }
  };

  const config = serviceConfig[service];

  return (
    <>
      {/* Enhanced Navbar with backdrop blur */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? "bg-white/90 backdrop-blur-xl shadow-lg border-b border-gray-100/50" 
            : "bg-transparent"
        }`}
      >
        <div className=" mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Section with Enhanced Styling */}
            <motion.div 
              className="flex items-center gap-12"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Link
                href={getRoute("/")}
                className="flex-shrink-0 group"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="text-3xl md:text-4xl font-bold"
                >
                  <span className={`${scrolled ? 'text-gray-900' : 'text-gray-900'} transition-colors duration-300`}>
                    {config.title}
                  </span>
                  {config.subtitle && (
                    <motion.span 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-xl ml-2 font-semibold"
                      style={{ color: config.primaryColor }}
                    >
                      {config.subtitle}
                    </motion.span>
                  )}
                </motion.div>
              </Link>

              {/* Desktop Navigation with Modern Styling */}
              <motion.div 
                className="hidden lg:flex lg:items-center lg:space-x-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                {/* Service Navigation Links */}
                {['/', '/about-us', '/contact-us'].map((path, index) => {
                  const labels = ['Home', 'About Us', 'Contact Us'];
                  return (
                    <motion.div key={path} whileHover={{ y: -2 }}>
                      <Link
                        href={getRoute(path)}
                        className={`relative px-4 py-2 text-lg font-medium transition-all duration-300 group ${
                          isActive(path)
                            ? `text-[${config.primaryColor}]`
                            : scrolled 
                              ? `text-gray-600 hover:text-[${config.primaryColor}]` 
                              : `text-gray-700 hover:text-[${config.primaryColor}]`
                        }`}
                        style={{
                          color: isActive(path) ? config.primaryColor : undefined
                        }}
                      >
                        {labels[index]}
                        {/* Active indicator with primary color */}
                        <motion.div
                          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                          style={{ backgroundColor: config.primaryColor }}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: isActive(path) ? 1 : 0 }}
                          whileHover={{ scaleX: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      </Link>
                    </motion.div>
                  );
                })}

                {/* Service Switcher */}
                <motion.div whileHover={{ y: -2 }}>
                  <Link
                    href={config.otherServiceRoute}
                    className={`relative px-4 py-2 text-lg font-medium transition-all duration-300 group text-gray-600 hover:text-[${config.primaryColor}]`}
                  >
                    {config.otherServiceLabel}
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                      style={{ backgroundColor: config.primaryColor }}
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Right Side Items */}
            <motion.div
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {/* Language Selector - only show for telehealth */}
              {config.showLanguageSelector && (
                <div className="hidden md:block">
                  <LanguageSelector />
                </div>
              )}

              {/* Desktop Authentication Buttons */}
              {user ? (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="hidden lg:block"
                >
                  <button
                    onClick={() => logout()}
                    className="relative px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl overflow-hidden group hover:shadow-lg transition-all duration-300"
                  >
                    <span className="relative z-10">Log out</span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </button>
                </motion.div>
              ) : (
                <div className="hidden lg:flex items-center space-x-3">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Link href={getRoute("/auth/login")}>
                      <div 
                        className="relative px-6 py-3 text-base font-semibold border-2 rounded-xl transition-all duration-300 group overflow-hidden hover:text-white"
                        style={{ 
                          color: config.primaryColor,
                          borderColor: config.primaryColor 
                        }}
                      >
                        <span className="relative z-10">Log in</span>
                        <motion.div
                          className="absolute inset-0"
                          style={{ backgroundColor: config.primaryColor }}
                          initial={{ x: "-100%" }}
                          whileHover={{ x: 0 }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </Link>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Link href={getRoute("/auth/signup")}>
                      <div 
                        className="relative px-6 py-3 text-base font-semibold text-white rounded-xl overflow-hidden group hover:shadow-lg transition-all duration-300"
                        style={{ backgroundColor: config.primaryColor }}
                      >
                        <span className="relative z-10">Sign up</span>
                        <motion.div
                          className="absolute inset-0"
                          style={{ backgroundColor: config.primaryColorHover }}
                          initial={{ x: "-100%" }}
                          whileHover={{ x: 0 }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </Link>
                  </motion.div>
                </div>
              )}

              {/* Mobile Menu Button */}
              <motion.button
                className="lg:hidden relative p-3 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -180, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 180, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <X size={24} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 180, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -180, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Menu size={24} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Enhanced Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm lg:hidden z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <motion.div
              className="fixed top-0 right-0 h-screen w-80 bg-white/95 backdrop-blur-xl lg:hidden z-50 shadow-2xl border-l border-gray-100"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <span className="text-xl font-bold text-gray-900">
                    Menu
                  </span>
                  <motion.button
                    onClick={() => setIsMenuOpen(false)}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                  >
                    <X size={20} />
                  </motion.button>
                </div>

                {/* Language Selector for Mobile - only show for telehealth */}
                {config.showLanguageSelector && (
                  <div className="px-6 py-4 border-b border-gray-100">
                    <LanguageSelector />
                  </div>
                )}

                {/* Navigation Items */}
                <motion.div
                  className="flex-1 px-6 py-8"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1,
                        delayChildren: 0.2
                      }
                    }
                  }}
                >
                  <div className="space-y-6">
                    {[
                      { path: '/', label: 'Home' },
                      { path: '/about-us', label: 'About Us' },
                      { path: '/contact-us', label: 'Contact Us' }
                    ].map(({ path, label }) => (
                      <motion.div
                        key={path}
                        variants={{
                          hidden: { x: 30, opacity: 0 },
                          visible: { x: 0, opacity: 1 }
                        }}
                      >
                        <Link
                          href={getRoute(path)}
                          className={`block px-4 py-3 text-lg font-medium rounded-xl transition-all duration-200 ${
                            isActive(path)
                              ? "text-white shadow-lg"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          style={{
                            backgroundColor: isActive(path) ? config.primaryColor : undefined
                          }}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {label}
                        </Link>
                      </motion.div>
                    ))}

                    {/* Service Switcher in Mobile Menu */}
                    <motion.div
                      variants={{
                        hidden: { x: 30, opacity: 0 },
                        visible: { x: 0, opacity: 1 }
                      }}
                    >
                      <Link
                        href={config.otherServiceRoute}
                        className="block px-4 py-3 text-lg font-medium rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100 border-t border-gray-200 mt-4 pt-6"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Switch to {config.otherServiceLabel}
                      </Link>
                    </motion.div>
                  </div>

                  {/* Mobile Auth Buttons */}
                  <motion.div
                    className="mt-8 pt-6 border-t border-gray-100 space-y-4"
                    variants={{
                      hidden: { x: 30, opacity: 0 },
                      visible: { x: 0, opacity: 1 }
                    }}
                  >
                    {user ? (
                      <motion.button
                        onClick={() => {
                          logout();
                          setIsMenuOpen(false);
                        }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl hover:shadow-lg transition-all duration-300"
                      >
                        Log out
                      </motion.button>
                    ) : (
                      <div className="space-y-3">
                        <motion.div whileTap={{ scale: 0.95 }}>
                          <Link
                            href={getRoute("/auth/login")}
                            className="block w-full px-6 py-3 text-base font-semibold border-2 rounded-xl text-center transition-all duration-300 hover:text-white"
                            style={{ 
                              color: config.primaryColor,
                              borderColor: config.primaryColor 
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = config.primaryColor;
                              e.target.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = 'transparent';
                              e.target.style.color = config.primaryColor;
                            }}
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Log in
                          </Link>
                        </motion.div>
                        <motion.div whileTap={{ scale: 0.95 }}>
                          <Link
                            href={getRoute("/auth/signup")}
                            className="block w-full px-6 py-3 text-base font-semibold text-white rounded-xl hover:shadow-lg text-center transition-all duration-300"
                            style={{ backgroundColor: config.primaryColor }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = config.primaryColorHover;
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = config.primaryColor;
                            }}
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Sign up
                          </Link>
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
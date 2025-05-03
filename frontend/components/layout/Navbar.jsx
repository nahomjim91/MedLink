"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageSelector from "../ui/LanguageSelector";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isTelehealth = pathname.startsWith("/telehealth");

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

  // Dynamic route generation based on whether we're in telehealth section
  const getRoute = (path) => {
    if (isTelehealth) {
      return `/telehealth${path === '/' ? '' : path}`;
    }
    return path;
  };

  // Check if a path is active, accounting for telehealth prefix
  const isActive = (path) => {
    if (path === '/') {
      return pathname === '/' || pathname === '/telehealth';
    }
    return isTelehealth ? pathname === `/telehealth${path}` : pathname === path;
  };

  // Prevent body scrolling when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  return (
    <nav
      className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-md" : "bg-transparent"
      }`}
    >
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-10">
            <Link href={isTelehealth ? "/telehealth" : "/"} className="flex-shrink-0 text-2xl md:text-4xl font-bold text-secondary">
              MedLink
              {isTelehealth && <span className="text-primary text-xl ml-1">Telehealth</span>}
            </Link>
        
            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-8">
              <Link
                href={getRoute("/")}
                className={`inline-flex items-center px-1 pt-1 text-lg font-medium ${
                  isActive("/")
                    ? "text-secondary border-b-2 border-secondary"
                    : "text-secondary/50 hover:text-secondary"
                }`}
              >
                Home
              </Link>
              <Link
                href={getRoute("/about-us")}
                className={`inline-flex items-center px-1 pt-1 text-lg font-medium ${
                  isActive("/about-us")
                    ? "text-secondary border-b-2 border-secondary"
                    : "text-secondary/50 hover:text-secondary"
                }`}
              >
                About Us
              </Link>
              <Link
                href={getRoute("/contact-us")}
                className={`inline-flex items-center px-1 pt-1 text-lg font-medium ${
                  isActive("/contact-us")
                    ? "text-secondary border-b-2 border-secondary"
                    : "text-secondary/50 hover:text-secondary"
                }`}
              >
                Contact Us
              </Link>
            </div>
          </div>

          {/* Right side items (language selector, login/signup) with animations */}
          <motion.div 
            className="flex items-center space-x-2 md:space-x-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="">
              {isTelehealth && <LanguageSelector />}
            </div>

            {/* Desktop auth buttons with hover animations */}
            <div className="hidden md:flex items-center space-x-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Link href={getRoute("/auth/login")}>
                  <div className="flex items-center border-2 border-primary px-4 py-2 text-sm lg:px-6 lg:py-3 lg:text-base text-primary rounded-xl hover:bg-primary/5 transition-colors">
                    Log in
                  </div>
                </Link>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Link href={getRoute("/auth/signup")}>
                  <div className="flex items-center px-4 py-2 text-sm lg:px-6 lg:py-3 lg:text-base text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors">
                    Sign up
                  </div>
                </Link>
              </motion.div>
            </div>

            {/* Mobile menu button with animation */}
            <motion.button
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-secondary hover:text-secondary hover:bg-gray-100 z-50"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <span className="sr-only">{isMenuOpen ? "Close menu" : "Open menu"}</span>
              <AnimatePresence mode="wait" initial={false}>
                {isMenuOpen ? (
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
          </motion.div>
        </div>
      </div>

      {/* Full screen mobile menu with animation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            className="fixed inset-0 bg-white md:hidden z-40 h-screen w-full"
            initial={{ clipPath: "circle(0% at 95% 5%)" }}
            animate={{ clipPath: "circle(150% at 95% 5%)" }}
            exit={{ clipPath: "circle(0% at 95% 5%)" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex flex-col justify-center items-center h-full w-full px-4">
              <motion.div 
                className="w-full max-w-md space-y-8 text-center"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { 
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1
                    }
                  }
                }}
              >
                <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
                  <Link
                    href={getRoute("/")}
                    className={`block px-3 py-4 text-2xl font-medium ${
                      isActive("/")
                        ? "text-primary"
                        : "text-secondary hover:text-primary"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Home
                  </Link>
                </motion.div>
                
                <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
                  <Link
                    href={getRoute("/about-us")}
                    className={`block px-3 py-4 text-2xl font-medium ${
                      isActive("/about-us")
                        ? "text-primary"
                        : "text-secondary hover:text-primary"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    About Us
                  </Link>
                </motion.div>
                
                <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
                  <Link
                    href={getRoute("/contact-us")}
                    className={`block px-3 py-4 text-2xl font-medium ${
                      isActive("/contact-us")
                        ? "text-primary"
                        : "text-secondary hover:text-primary"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Contact Us
                  </Link>
                </motion.div>
                
                <div className="space-y-6 pt-10 ">
                  <motion.div 
                    variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link href={getRoute("/auth/login")} className="block" onClick={() => setIsMenuOpen(false)}>
                      <div className="flex items-center justify-center border-2 border-primary px-6 py-4 text-lg mb-3 md:mb-0 text-primary rounded-xl hover:bg-primary/5 transition-colors mx-auto max-w-xs">
                        Log in
                      </div>
                    </Link>
                  </motion.div>
                  
                  <motion.div 
                    variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link href={getRoute("/auth/signup")} className="block" onClick={() => setIsMenuOpen(false)}>
                      <div className="flex items-center justify-center px-6 py-4 text-lg text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors mx-auto max-w-xs">
                        Sign up
                      </div>
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
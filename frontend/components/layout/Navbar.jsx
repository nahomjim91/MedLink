"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageSelector from "../ui/LanguageSelector";
import { Menu, X } from "lucide-react";

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
    return `/medical-supplies${path === '/' ? '' : path}`;;
  };

  // Check if a path is active, accounting for telehealth prefix
  const isActive = (path) => {
    if (path === '/') {
      return pathname === '/' || pathname === '/telehealth';
    }
    return isTelehealth ? pathname === `/telehealth${path}` : pathname === path;
  };

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

          {/* Right side items (language selector, login/signup) */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="">
             {isTelehealth && <LanguageSelector />}
            </div>

            {/* Desktop auth buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Link href={getRoute("/auth/login")}>
                <div className="flex items-center border-2 border-primary px-4 py-2 text-sm lg:px-6 lg:py-3 lg:text-base text-primary rounded-xl hover:bg-primary/5 transition-colors">
                  Log in
                </div>
              </Link>
              <Link href={getRoute("/auth/signup")}>
                <div className="flex items-center px-4 py-2 text-sm lg:px-6 lg:py-3 lg:text-base text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors">
                  Sign up
                </div>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-secondary hover:text-secondary hover:bg-gray-100"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">{isMenuOpen ? "Close menu" : "Open menu"}</span>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-lg absolute left-0 right-0">
          <div className="px-4 pt-2 pb-6 space-y-5">            
            <div className="space-y-4">
              <Link
                href={getRoute("/")}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive("/")
                    ? "text-secondary bg-gray-100"
                    : "text-secondary/60 hover:bg-gray-100"
                }`}
              >
                Home
              </Link>
              <Link
                href={getRoute("/about-us")}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive("/about-us")
                    ? "text-secondary bg-gray-100"
                    : "text-secondary/60 hover:bg-gray-100"
                }`}
              >
                About Us
              </Link>
              <Link
                href={getRoute("/contact-us")}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive("/contact-us")
                    ? "text-secondary bg-gray-100"
                    : "text-secondary/60 hover:bg-gray-100"
                }`}
              >
                Contact Us
              </Link>
            </div>
            
            <div className="space-y-3 pt-3">
              <Link href={getRoute("/auth/login")} className="block">
                <div className="flex items-center justify-center border-2 border-primary px-4 py-3 text-base text-primary rounded-xl hover:bg-primary/5 transition-colors w-full">
                  Log in
                </div>
              </Link>
              <Link href={getRoute("/auth/signup")} className="block">
                <div className="flex items-center justify-center px-4 py-3 text-base text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors w-full">
                  Sign up
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
// app/not-found.js
'use client';
import { Home } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 lg:p-0">
      {/* Image Container - Responsive sizing */}
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mb-0 sm:mb-8">
        <Image
          src="/image/404 Error.svg"
          alt="Page not found"
          width={600}
          height={400}
          priority
          className="w-full h-auto"
          sizes="(max-width: 640px) 320px, (max-width: 768px) 384px, (max-width: 1024px) 448px, (max-width: 1280px) 512px, 576px"
        />
      </div>

      {/* Text Content - Responsive typography */}
      <div className="text-center mb-0 sm:mb-10 px-4">
       
        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>

      {/* Button - Responsive sizing and spacing */}
      <Link
        href="/"
        className="w-full max-w-xs sm:max-w-sm flex items-center justify-center space-x-2 sm:space-x-3 
                   px-4 sm:px-6 md:px-8 py-3 sm:py-4 
                   border-2 border-primary/50 rounded-xl 
                   text-primary hover:bg-primary hover:text-white 
                   transition-all duration-200 font-semibold
                   text-sm sm:text-base md:text-lg
                   hover:scale-105 active:scale-95
                   focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        <Home className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
        <span>Go Home</span>
      </Link>

      
    </div>
  );
}
// components/common/LoadingSpinner.js
import { motion } from "framer-motion";

export default function LoadingSpinner({ size = "default", message = "Loading..." }) {
  const sizeClasses = {
    small: "h-4 w-4",
    default: "h-8 w-8",
    large: "h-12 w-12"
  };

  const containerClasses = {
    small: "h-20",
    default: "h-32",
    large: "h-64"
  };

  return (
    <div className={`flex flex-col justify-center items-center ${containerClasses[size]} space-y-4`}>
      <motion.div
        className="relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Outer ring */}
        <div className={`${sizeClasses[size]} rounded-full border-4 border-gray-200`}></div>
        
        {/* Inner spinning ring */}
        <motion.div
          className={`absolute top-0 left-0 ${sizeClasses[size]} rounded-full border-4 border-transparent border-t-primary`}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Center dot */}
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
      
      {message && (
        <motion.p
          className="text-sm text-gray-600 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}
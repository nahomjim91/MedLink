// /components/ui/admin/PendingDoctorCard.js
"use client";

import Image from "next/image";
import { 
  CheckCircle, 
  XCircle, 
  FileText, 
  Info, 
  Mail, 
  Calendar, 
  Award,
  ExternalLink,
  Clock,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";

export default function PendingDoctorCard({
  doctor,
  onApprove,
  onReject,
  isApproving,
  isRejectedView,
}) {
  const { user, specialization, experienceYears, certificates, rejectionReason } = doctor;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  const buttonVariants = {
    hover: { scale: 1.02 },
    tap: { scale: 0.98 }
  };

  return (
    <motion.div 
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -2 }}
      className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-300 hover:shadow-md ${
        isRejectedView 
          ? "border-red-200 bg-red-50/30" 
          : "border-gray-200 hover:border-primary/30"
      }`}
    >
      <div className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Profile Section */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <Image
                  src={
                    (process.env.NEXT_PUBLIC_TELEHEALTH_API_URL + user.profileImageUrl) || 
                    "/img/default-avatar.png"
                  }
                  alt={`${user.firstName} ${user.lastName}`}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>
              {!isRejectedView && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Clock className="w-3 h-3 text-white" />
                </div>
              )}
              {isRejectedView && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <XCircle className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Doctor Information */}
          <div className="flex-grow space-y-4">
            {/* Header */}
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">
                Dr. {user.firstName} {user.lastName}
              </h3>
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{user.email}</span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Specialization */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-gray-700">Specialization</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {specialization?.length > 0 ? (
                    specialization.map((spec, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium"
                      >
                        {spec}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">Not specified</span>
                  )}
                </div>
              </div>

              {/* Experience */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-gray-700">Experience</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-bold text-gray-900">{experienceYears}</span>
                  <span className="text-sm text-gray-600">years</span>
                </div>
              </div>
            </div>

            {/* Certificates */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-gray-700">Certificates</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {certificates?.length || 0}
                </span>
              </div>
              
              {certificates?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {certificates.map((cert, index) => (
                    <motion.a
                      key={index}
                      href={process.env.NEXT_PUBLIC_TELEHEALTH_API_URL + cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                    >
                      <div className="p-2 bg-white rounded-md shadow-sm">
                        <FileText className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {cert.name}
                        </p>
                        <p className="text-xs text-gray-500">Click to view</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                    </motion.a>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">No certificates provided</span>
                </div>
              )}
            </div>

            {/* Rejection Reason */}
            {isRejectedView && rejectionReason && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-red-100 rounded-full">
                    <Info className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex-grow">
                    <p className="font-medium text-red-800 text-sm mb-1">
                      Rejection Reason
                    </p>
                    <p className="text-red-700 text-sm leading-relaxed">
                      {rejectionReason}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Action Buttons */}
          {!isRejectedView && (
            <div className="flex-shrink-0 lg:w-48">
              <div className="flex flex-col gap-3">
                <motion.button
                  onClick={onApprove}
                  disabled={isApproving}
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {isApproving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>Approve</span>
                </motion.button>
                
                <motion.button
                  onClick={onReject}
                  disabled={isApproving}
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
// /pages/telehealth/admin/pending-doctors.js
"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_PENDING_DOCTORS } from "../../api/graphql/admin/queries";
import {
  APPROVE_DOCTOR_PROFILE,
  REJECT_DOCTOR_PROFILE,
} from "../../api/graphql/admin/mutations";
import PendingDoctorCard from "../../components/ui/admin/PendingUserCard";
import RejectionModal from "../../components/ui/admin/RejectionModal";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ErrorMessage from "../../components/ui/ErrorMessage";
import { useAuth } from "../../hooks/useAuth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, UserX, Users, Filter } from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function AdminPendingDoctorsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isPending, setIsPending] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const { loading, error, data, refetch } = useQuery(GET_PENDING_DOCTORS, {
    variables: {
      limit: ITEMS_PER_PAGE,
      offset,
    },
    fetchPolicy: "cache-and-network",
  });

  const [approveDoctorProfile, { loading: approveLoading }] = useMutation(
    APPROVE_DOCTOR_PROFILE,
    {
      onCompleted: () => refetch(),
      onError: (error) => {
        console.error("Error approving doctor:", error);
        alert(`Error approving doctor: ${error.message}`);
      },
    }
  );

  const [rejectDoctorProfile, { loading: rejectLoading }] = useMutation(
    REJECT_DOCTOR_PROFILE,
    {
      onCompleted: () => {
        refetch();
        setIsRejectionModalOpen(false);
        setSelectedDoctor(null);
      },
      onError: (error) => {
        console.error("Error rejecting doctor:", error);
        alert(`Error rejecting doctor: ${error.message}`);
      },
    }
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(
        "/telehealth/auth/login?redirectTo=/telehealth/admin/pending-doctors"
      );
    } else if (user.role !== "admin") {
      console.warn("Non-admin user attempted to access admin page.");
      router.push("/telehealth/");
    }
  }, [user, authLoading, router]);

  const handleApprove = (doctorId) => {
    if (
      window.confirm("Are you sure you want to approve this doctor's profile?")
    ) {
      approveDoctorProfile({ variables: { doctorId } });
    }
  };

  const handleOpenRejectionModal = (doctorToReject) => {
    setSelectedDoctor(doctorToReject);
    setIsRejectionModalOpen(true);
  };

  const handleCloseRejectionModal = () => {
    setSelectedDoctor(null);
    setIsRejectionModalOpen(false);
  };

  const handleReject = (reason) => {
    if (selectedDoctor) {
      rejectDoctorProfile({
        variables: {
          doctorId: selectedDoctor.doctorId,
          reason,
        },
      });
    }
  };

  const allFetchedDoctors = data?.getPendingDoctors || [];
  const trulyPendingDoctors = allFetchedDoctors.filter(
    (d) => !d.rejectionReason
  );
  const rejectedDoctors = allFetchedDoctors.filter((d) => !!d.rejectionReason);

  const activeList = isPending ? trulyPendingDoctors : rejectedDoctors;

  // Filter doctors based on search term
  const filteredDoctors = activeList.filter((doctor) =>
    `${doctor.user.firstName} ${doctor.user.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    doctor.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialization?.some(spec => 
      spec.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleNextPage = () => {
    if (data?.searchDoctors?.hasMore) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  if (loading && !data) return <LoadingSpinner />;
  if (error)
    return <ErrorMessage message={`Error loading doctors: ${error.message}`} />;

  const renderDoctorList = (doctors, listType) => {
    if (loading) return <LoadingSpinner />;
    if (doctors.length === 0) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center space-y-6 py-16"
        >
          <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              {listType === "pending" ? (
                <Clock className="w-16 h-16 text-gray-400" />
              ) : (
                <UserX className="w-16 h-16 text-gray-400" />
              )}
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">0</span>
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No {listType} doctors found
            </h3>
            <p className="text-gray-500 max-w-md">
              {listType === "pending" 
                ? "All doctor applications have been processed. New submissions will appear here."
                : "No rejected applications at this time."
              }
            </p>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {doctors.map((doc, index) => (
          <motion.div
            key={doc.doctorId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <PendingDoctorCard
              doctor={doc}
              onApprove={() => handleApprove(doc.doctorId)}
              onReject={
                !doc.rejectionReason
                  ? () => handleOpenRejectionModal(doc)
                  : undefined
              }
              isApproving={approveLoading}
              isRejectedView={!!doc.rejectionReason}
            />
          </motion.div>
        ))}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Doctor Applications
          </h1>
          <p className="text-gray-600">
            Review and manage pending doctor applications
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-primary">
                  {trulyPendingDoctors.length}
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Clock className="w-6 h-6 text-primary" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-500">
                  {rejectedDoctors.length}
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-full">
                <UserX className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-700">
                  {allFetchedDoctors.length}
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded-full">
                <Users className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-8">
              <motion.button
                onClick={() => setIsPending(true)}
                className={`relative px-4 py-2 font-medium transition-colors ${
                  isPending 
                    ? "text-primary" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Pending Applications
                <span className="ml-2 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                  {trulyPendingDoctors.length}
                </span>
                {isPending && (
                  <motion.div
                    className="absolute bottom-[-25px] left-0 right-0 h-0.5 bg-primary"
                    layoutId="activeTab"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
              
              <motion.button
                onClick={() => setIsPending(false)}
                className={`relative px-4 py-2 font-medium transition-colors ${
                  !isPending 
                    ? "text-primary" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Rejected Applications
                <span className="ml-2 px-2 py-1 text-xs bg-red-50 text-red-600 rounded-full">
                  {rejectedDoctors.length}
                </span>
                {!isPending && (
                  <motion.div
                    className="absolute bottom-[-25px] left-0 right-0 h-0.5 bg-primary"
                    layoutId="activeTab"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search doctors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isPending ? "pending" : "rejected"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            {isPending
              ? renderDoctorList(filteredDoctors, "pending")
              : renderDoctorList(filteredDoctors, "rejected")}
          </motion.div>
        </AnimatePresence>

        {/* Pagination */}
        {filteredDoctors.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-between items-center mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <motion.button
              onClick={handlePrevPage}
              disabled={currentPage === 1 || loading}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Previous
            </motion.button>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Page {currentPage} of {Math.ceil(filteredDoctors.length / ITEMS_PER_PAGE)}
              </span>
              <span className="text-sm text-gray-500">
                ({filteredDoctors.length} total)
              </span>
            </div>
            
            <motion.button
              onClick={handleNextPage}
              disabled={!data?.searchDoctors?.hasMore || loading}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Next
            </motion.button>
          </motion.div>
        )}

        {/* Rejection Modal */}
        {selectedDoctor && isRejectionModalOpen && (
          <RejectionModal
            isOpen={isRejectionModalOpen}
            onClose={handleCloseRejectionModal}
            onSubmit={handleReject}
            userName={`${selectedDoctor.user.firstName} ${selectedDoctor.user.lastName}`}
            isLoading={rejectLoading}
          />
        )}
      </div>
    </div>
  );
}
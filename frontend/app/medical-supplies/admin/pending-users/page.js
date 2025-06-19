// pages/medical-supplies/admin/pending-users.js
"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_PENDING_APPROVAL_USERS } from "../../api/graphql/queries"; // Assuming this fetches users with isApproved=false
import { APPROVE_MS_USER, REJECT_MS_USER } from "../../api/graphql/mutations";
import PendingUserCard from "../../components/ui/admin/PendingUserCard";
import RejectionModal from "../../components/ui/admin/RejectionModal";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ErrorMessage from "../../components/ui/ErrorMessage";
import { useMSAuth } from "../../../../hooks/useMSAuth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion"; // Import motion and AnimatePresence

const ITEMS_PER_PAGE = 10;

export default function AdminPendingUsersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const { user, loading: authLoading } = useMSAuth();
  const router = useRouter();
  const [isPending, setIsPending] = useState(true); // State to toggle between Pending and Rejected tabs

  // Calculate offset based on current page
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // Fetch pending approval users (assuming this fetches users where isApproved is false)
  // It might include both truly pending and already rejected users.
  const { loading, error, data, refetch } = useQuery(
    GET_PENDING_APPROVAL_USERS,
    {
      variables: { limit: ITEMS_PER_PAGE, offset },
      fetchPolicy: "cache-and-network",
    }
  );

  // Setup approve mutation
  const [approveUser, { loading: approveLoading }] = useMutation(
    APPROVE_MS_USER,
    {
      onCompleted: () => {
        refetch(); // Refetch data after approval
      },
      onError: (error) => {
        console.error("Error approving user:", error);
        alert(`Error approving user: ${error.message}`);
      },
    }
  );

  // Setup reject mutation
  const [rejectUser, { loading: rejectLoading }] = useMutation(REJECT_MS_USER, {
    onCompleted: () => {
      refetch(); // Refetch data after rejection
      setIsRejectionModalOpen(false);
      setSelectedUser(null); // Clear selected user after rejection
    },
    onError: (error) => {
      console.error("Error rejecting user:", error);
      alert(`Error rejecting user: ${error.message}`);
    },
  });

  // Redirect non-admins (improved check)
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // Redirect to login if no user
      router.push("/medical-supplies/auth/login?redirectTo=/medical-supplies/admin/pending-users");
    } else if (user.role !== 'admin') {
      // Redirect to home or user dashboard if not admin
       console.warn("Non-admin user attempted to access admin page.");
      router.push("/medical-supplies/"); // Or user dashboard
    }
  }, [user, authLoading, router]);


  // Handle user approval (only relevant for pending users)
  const handleApprove = (userId) => {
    if (window.confirm("Are you sure you want to approve this user?")) {
      approveUser({ variables: { userId } });
    }
  };

  // Handle rejection modal opening (only relevant for pending users)
  const handleOpenRejectionModal = (userToReject) => {
    setSelectedUser(userToReject);
    setIsRejectionModalOpen(true);
  };

  const handleCloseRejectionModal = () => {
    setSelectedUser(null);
    setIsRejectionModalOpen(false);
  };

  // Handle user rejection with reason
  const handleReject = (reason) => {
    if (selectedUser) {
      rejectUser({
        variables: {
          userId: selectedUser.userId,
          reason,
        },
      });
      // Rejection modal is closed in onCompleted
    }
  };

  // --- Filtering Logic ---
  const allFetchedUsers = data?.pendingApprovalUsers || [];
  const trulyPendingUsers = allFetchedUsers.filter(u => !u.rejectionReason);
  const rejectedUsers = allFetchedUsers.filter(u => !!u.rejectionReason);

  // Determine which list is currently active for display and pagination logic
  const activeList = isPending ? trulyPendingUsers : rejectedUsers;

  // Handle pagination
  // Note: Pagination operates on the fetched data (which includes both pending and rejected).
  // The 'Next' button is disabled based on the total fetched count for the current page,
  // not the filtered count in the active tab. This is simpler but might feel slightly
  // inconsistent if one list is much shorter than the other on the same fetched page.
  const handleNextPage = () => {
     // Check total fetched users, not just the active list length
    if (allFetchedUsers.length === ITEMS_PER_PAGE) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  // --- Render Logic ---
  // Render loading state (only show initially)
  if (loading && !data && currentPage === 1) return <LoadingSpinner />;

  // Render error state
  if (error)
    return (
      <ErrorMessage message={`Error loading users: ${error.message}`} />
    );

  // Function to render the list of users
  const renderUserList = (users, listType) => {
    if (loading) return <LoadingSpinner />; // Show spinner during refetch/pagination loading

    if (users.length === 0) {
       return (
         <div className="flex flex-col items-center justify-center space-y-4 py-10">
           <Image
             src={`/Image/${listType === 'pending' ? 'Waiting-pana.svg' : 'No data-cuate.svg'}`} // Assuming you have a 'No data-cuate.svg' for rejected
             alt={`No ${listType} users`}
             width={400}
             height={200}
             className="mx-auto"
           />
           <p className="text-xl text-secondary">
             No {listType} users found
           </p>
         </div>
       );
     }

    return (
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1 py-4">
        {users.map((u) => (
          <PendingUserCard
            key={u.userId}
            user={u}
            onApprove={() => handleApprove(u.userId)}
            // Only show reject button if the user is actually pending
            onReject={!u.rejectionReason ? () => handleOpenRejectionModal(u) : undefined}
            isApproving={approveLoading}
            // Pass a flag if needed by the card to change its appearance/actions for rejected users
            isRejectedView={!!u.rejectionReason}
          />
        ))}
      </div>
    );
  };


  return (
    <div className="text-secondary">
       {/* --- Tabs --- */}
      <div className="relative mb-6">
        <div className="flex items-center gap-6 border-b border-gray-300">
          {/* Pending Tab */}
          <motion.h1
            onClick={() => setIsPending(true)}
            className={`${
              isPending ? "text-primary" : "text-secondary opacity-60"
            } text-xl font-bold pb-2 cursor-pointer relative`} // Adjusted styling
             whileHover={{ scale: 1.05, opacity: 1 }}
             whileTap={{ scale: 0.95 }}
             transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            Pending Users
            {isPending && (
              <motion.div
                className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary" // Positioned correctly on border
                layoutId="activeTab" // Connects the animation between tabs
                initial={false} // Prevents initial animation on load
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.h1>

          {/* Rejected Tab */}
          <motion.h1
            onClick={() => setIsPending(false)}
            className={`${
              !isPending ? "text-primary" : "text-secondary opacity-60"
            } text-xl font-bold pb-2 cursor-pointer relative`} // Adjusted styling
             whileHover={{ scale: 1.05, opacity: 1 }}
             whileTap={{ scale: 0.95 }}
             transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            Rejected Users
            {!isPending && (
              <motion.div
                className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary" // Positioned correctly on border
                layoutId="activeTab" // Connects the animation between tabs
                 initial={false} // Prevents initial animation on load
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.h1>
        </div>
      </div>

       {/* --- Animated Content Area --- */}
      <AnimatePresence mode="wait"> {/* Use mode="wait" for smoother transitions */}
        <motion.div
          key={isPending ? "pending" : "rejected"} // Key change triggers animation
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {isPending ? renderUserList(trulyPendingUsers, 'pending') : renderUserList(rejectedUsers, 'rejected')}
        </motion.div>
      </AnimatePresence>

       {/* --- Pagination controls --- */}
       {/* Only show pagination if there are users in the *currently viewed* list */}
       {activeList.length > 0 && (
         <div className="flex justify-between items-center mt-8">
           <button
             onClick={handlePrevPage}
             disabled={currentPage === 1 || loading} // Disable while loading
             className={`px-4 py-2 rounded ${
               currentPage === 1 || loading
                 ? "bg-gray-300 cursor-not-allowed"
                 : "bg-blue-500 hover:bg-blue-600 text-white"
             }`}
           >
             Previous
           </button>
           <span>Page {currentPage}</span>
           <button
             onClick={handleNextPage}
             // Disable if loading OR if the total fetched users (not just filtered) is less than ITEMS_PER_PAGE
             disabled={allFetchedUsers.length < ITEMS_PER_PAGE || loading}
             className={`px-4 py-2 rounded ${
               allFetchedUsers.length < ITEMS_PER_PAGE || loading
                 ? "bg-gray-300 cursor-not-allowed"
                 : "bg-blue-500 hover:bg-blue-600 text-white"
             }`}
           >
             Next
           </button>
         </div>
       )}

      {/* --- Rejection Reason Modal --- */}
      {/* Ensure selectedUser exists before rendering modal */}
      {selectedUser && isRejectionModalOpen && (
        <RejectionModal
          isOpen={isRejectionModalOpen}
          onClose={handleCloseRejectionModal}
          onSubmit={handleReject}
          userName={
            selectedUser.contactName ||
            selectedUser.companyName ||
            selectedUser.email
          }
          isLoading={rejectLoading}
        />
      )}
    </div>
  );
}
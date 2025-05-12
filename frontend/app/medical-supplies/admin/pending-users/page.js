// pages/medical-supplies/admin/pending-users.js
'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { 
  GET_PENDING_APPROVAL_USERS,

} from '../../api/graphql/queries';
import {  APPROVE_MS_USER,
  REJECT_MS_USER } from '../../api/graphql/mutations';
import Head from 'next/head';
import PendingUserCard from '../../components/ui/admin/PendingUserCard';
import RejectionModal from '../../components/ui/admin/RejectionModal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import { useMSAuth } from '../../hooks/useMSAuth';
import { useRouter } from 'next/navigation';

const ITEMS_PER_PAGE = 10;

export default function AdminPendingUsersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const { user, loading: authLoading } = useMSAuth();
  const router = useRouter();

  // Calculate offset based on current page
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // Fetch pending approval users
  const { loading, error, data, refetch } = useQuery(GET_PENDING_APPROVAL_USERS, {
    variables: { limit: ITEMS_PER_PAGE, offset },
    fetchPolicy: 'cache-and-network'
  });

  // Setup approve mutation
  const [approveUser, { loading: approveLoading }] = useMutation(APPROVE_MS_USER, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Error approving user:', error);
      alert(`Error approving user: ${error.message}`);
    }
  });

  // Setup reject mutation
  const [rejectUser, { loading: rejectLoading }] = useMutation(REJECT_MS_USER, {
    onCompleted: () => {
      refetch();
      setIsRejectionModalOpen(false);
    },
    onError: (error) => {
      console.error('Error rejecting user:', error);
      alert(`Error rejecting user: ${error.message}`);
    }
  });

  // Check if user is admin, redirect if not
  useEffect(() => {
    // Skip check if still loading auth
    if (authLoading) return;
    
    // Redirect if no user or not admin
    if (!user) {
      router.push('/login?redirectTo=/medical-supplies/admin');
    }
    // You would need a way to check if user is admin here
    // This implementation depends on how you store user roles
  }, [user, authLoading, router]);

  // Handle user approval
  const handleApprove = (userId) => {
    if (window.confirm('Are you sure you want to approve this user?')) {
      approveUser({ variables: { userId } });
    }
  };

  // Handle rejection modal
  const handleOpenRejectionModal = (user) => {
    setSelectedUser(user);
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
          reason 
        } 
      });
    }
  };

  // Handle pagination
  const handleNextPage = () => {
    if (data?.pendingApprovalUsers?.length === ITEMS_PER_PAGE) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Render loading state
  if (loading && !data) return <LoadingSpinner />;
  
  // Render error state
  if (error) return (

      <ErrorMessage message={`Error loading pending users: ${error.message}`} />
    
  );

  const pendingUsers = data?.pendingApprovalUsers || [];

  return (
<div>

      <Head>
        <title>Admin - Pending User Approvals | Medical Supplies</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Pending User Approvals</h1>
        
        {pendingUsers.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-xl text-gray-600">No pending users to approve</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
              {pendingUsers.map(user => (
                <PendingUserCard 
                  key={user.userId}
                  user={user}
                  onApprove={() => handleApprove(user.userId)}
                  onReject={() => handleOpenRejectionModal(user)}
                  isApproving={approveLoading}
                />
              ))}
            </div>

            {/* Pagination controls */}
            <div className="flex justify-between items-center mt-8">
              <button 
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded ${
                  currentPage === 1 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                Previous
              </button>
              <span>Page {currentPage}</span>
              <button 
                onClick={handleNextPage}
                disabled={pendingUsers.length < ITEMS_PER_PAGE}
                className={`px-4 py-2 rounded ${
                  pendingUsers.length < ITEMS_PER_PAGE 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* Rejection Reason Modal */}
      {selectedUser && (
        <RejectionModal
          isOpen={isRejectionModalOpen}
          onClose={handleCloseRejectionModal}
          onSubmit={handleReject}
          userName={selectedUser.contactName || selectedUser.companyName || selectedUser.email}
          isLoading={rejectLoading}
        />
      )}
    </div>

  );
}
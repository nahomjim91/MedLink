"use client";
import { AlertTriangle, Info } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/ui/Button";
// 1. Import the correct mutation
import { UPDATE_USER_PROFILE_STATUS } from "../../api/graphql/mutations"; 
import { useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";

export default function WaitingForApprovalPage() {
  const { user, loading, refetchUser } = useAuth();
  const router = useRouter();

  // 2. Use the new, correct mutation
  const [updateUserProfileStatus] = useMutation(UPDATE_USER_PROFILE_STATUS);

  const handleReSubmit = async () => {
    try {
      // 3. The goal is to set profileComplete to false to allow re-editing.
      // The backend should handle clearing the rejectionReason when the form is resubmitted.
      await updateUserProfileStatus({
        variables: {
          input: {
            profileComplete: false,
          },
        },
      });

      // Refetch user data to update the local state immediately
      await refetchUser();

      // 4. Redirect to the correct telehealth registration page
      router.push("/telehealth/auth/registering");

    } catch (error)
    {
      console.error("Error updating user profile status:", error);
      // Optional: Add user-facing error feedback here
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen font-primary">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mb-4 mx-auto"></div>
          <p className="text-lg text-[--color-secondary]">Loading user data...</p>
        </div>
      </div>
    );
  }

  // Handle cases where the user data might not be fully loaded yet
  if (!user || user.role !== 'doctor') {
    return (
        <div className="flex items-center justify-center h-screen font-primary">
            <p className="text-lg text-[--color-error]">Invalid access or user not found.</p>
        </div>
    )
  }

  // 5. Access rejectionReason from the nested doctorProfile object
  const rejectionReason = user.doctorProfile?.rejectionReason;
  console.log("user in waiting for approval page:", user);

  return (
    <div className="relative flex items-center justify-center h-[80vh]">
      <div className="absolute inset-0 flex items-center justify-center font-primary">
        <div className="flex items-center justify-center font-primary">
          {/* Check if there is no rejection reason */}
          {rejectionReason === null || rejectionReason === undefined ? (
            <div className="p-8 bg-white rounded-lg shadow-md text-center max-w-md">
              <Info className="h-24 w-24 text-primary mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-secondary mb-2">
                Your Profile is Pending Approval
              </h1>
              <p className="text-sm text-gray-600">
                Our team is currently reviewing your submitted information and certificates. 
                You will be notified once the review is complete. Thank you for your patience.
              </p>
            </div>
          ) : (
             // Display this block if the profile was rejected
            <div className="p-8 w-full max-w-md flex flex-col justify-center items-center bg-white rounded-lg shadow-md text-center">
              <AlertTriangle className="h-24 w-24 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-red-600 mb-2">
                Profile Submission Rejected
              </h1>
              <p className="text-sm text-secondary mb-1 font-semibold">Reason for Rejection:</p>
              <p className="text-sm text-gray-700 bg-red-50 p-3 rounded-md mb-6">
                {rejectionReason}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Please review the reason above and re-submit your profile with the corrected information.
              </p>
              <Button onClick={handleReSubmit}>
                Edit and Re-Submit Profile
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
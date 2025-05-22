"use client";
import { AlertTriangle, Info } from "lucide-react";
import { useMSAuth } from "../../hooks/useMSAuth";
import { Button } from "../../components/ui/Button";
import { UPDATE_MS_USER_PROFILE } from "../../api/graphql/mutations";
import { useMutation } from "@apollo/client";
import {  useRouter } from "next/navigation";

export default function WaitingForApprovalPage() {
  const { user, loading } = useMSAuth();
  const [updateUserProfile] = useMutation(UPDATE_MS_USER_PROFILE);
  const route = useRouter();

  const handleReSubmit = async () => {
    try {
      await updateUserProfile({
        variables: {
          input: {
            profileComplete: false,
            rejectionReason: null,
          },
        },
      });
      return route.push("/medical-supplies/auth/registering");
    } catch (error) {
      console.error("Error updating user profile:", error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen  font-primary">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mb-4 mx-auto"></div>
          <p className="text-lg text-[--color-secondary]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center h-[80vh] ">

    <div className="absolute inset-0 flex items-center justify-center font-primary">
      <div className="flex items-center justify-center  font-primary">
        {user.rejectionReason === null ? (
          <div className="p-8 bg-white rounded-lg shadow-md text-center">
           <Info className="h-24 w-24 text-primary mx-auto mb-4" />
            <p className="text-lg font-semibold text-secondary mb-2">
              Your Account is Pending Approval
            </p>
            <p className="text-sm text-gray-600">
              We are currently reviewing your account. Please check back later
              or contact support.
            </p>
          </div>
        ) : (
          <div className="h-96 w-96 flex flex-col justify-center items-center bg-white rounded-lg shadow-md text-center">
                    <AlertTriangle className="h-24 w-24 text-primary mx-auto mb-4" />
 
            <p className="text-lg font-semibold text-[--color-error] mb-2">
              Account Rejected
            </p>
            <p className="text-sm text-secondary mb-4">
              Reason: {user.rejectionReason}
            </p>
            <Button onClick={handleReSubmit}>
              Re-Submit 
            </Button>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

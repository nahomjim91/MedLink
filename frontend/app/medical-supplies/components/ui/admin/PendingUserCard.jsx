// components/medical-supplies/admin/PendingUserCard.js
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Button } from "../Button";

export default function PendingUserCard({
  user,
  onApprove,
  onReject,
  isApproving,
}) {
  // Format creation date
  const formattedDate = user.createdAt
    ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })
    : "Unknown date";

  // Determine user display name (prioritize company name, then contact name, then email)
  const displayName = user.companyName || user.contactName || user.email;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-primary/20 overflow-hidden flex-shrink-0">
              {user.profileImageUrl ? (
                <Image
                  alt={displayName}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-primary text-lg font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-secondary">
                {displayName}
              </h3>
              <p className="text-sm text-secondary/60">{user.email}</p>
              <p className="text-xs text-secondary/60">
                Applied {formattedDate}
              </p>
              <div className="mt-2">
                <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                  Role: {user.role || "Not specified"}
                </span>
              </div>
            </div>
          </div>

       
          {!user.rejectionReason && (
            <div className="flex flex-col space-y-2">
              <Button
                onClick={onApprove}
                disabled={isApproving}
                className="px-10 py-2"
              >
                {isApproving ? "Approving..." : "Approve"}
              </Button>
             
              <Button
                variant="fill"
                color="error"
                onClick={onReject}
                className="px-10 py-2"
              >
                Reject
              </Button>
            </div>
          )}
          {user.rejectionReason && (
            <div className="flex flex-col space-y-2">
              <span className="text-sm text-red-600 font-semibold">
                Rejected
              </span>
              <p className="text-sm text-secondary/60">
                Reason: {user.rejectionReason}
              </p>
            </div>
          )}
        </div>

        {/* Additional details section */}
        <div className="mt-4 border-t border-secondary/30 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-secondary/80">
                Contact Information
              </h4>
              <p className="text-sm text-secondary/60">
                {user.contactName && (
                  <span className="block">Contact: {user.contactName}</span>
                )}
                {user.phoneNumber && (
                  <span className="block">Phone: {user.phoneNumber}</span>
                )}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-secondary/80">
                Documents
              </h4>
              <div className="flex flex-col space-y-1 mt-1">
                {console.log("user", user)}
                {user.efdaLicenseUrl && (
                  <a
                    href={process.env.NEXT_PUBLIC_MEDICAL_SUPPLIES_API_URL+user.efdaLicenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    EFDA License
                  </a>
                )}
                {user.businessLicenseUrl && (
                  <a
                    href={process.env.NEXT_PUBLIC_MEDICAL_SUPPLIES_API_URL+user.businessLicenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    Business License
                  </a>
                )}
                {!user.efdaLicenseUrl && !user.businessLicenseUrl && (
                  <span className="text-sm text-secondary">
                    No documents uploaded
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

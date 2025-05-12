// components/medical-supplies/admin/PendingUserCard.js
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

export default function PendingUserCard({ user, onApprove, onReject, isApproving }) {
  // Format creation date
  const formattedDate = user.createdAt 
    ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) 
    : 'Unknown date';

  // Determine user display name (prioritize company name, then contact name, then email)
  const displayName = user.companyName || user.contactName || user.email;
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {user.profileImageUrl ? (
                <Image
                  src={user.profileImageUrl}
                  alt={displayName}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-500 text-lg font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{displayName}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
              <p className="text-xs text-gray-400">Applied {formattedDate}</p>
              <div className="mt-2">
                <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                  Role: {user.role || 'Not specified'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <button
              onClick={onApprove}
              disabled={isApproving}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded transition duration-200 disabled:bg-green-300"
            >
              {isApproving ? 'Approving...' : 'Approve'}
            </button>
            <button
              onClick={onReject}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded transition duration-200"
            >
              Reject
            </button>
          </div>
        </div>
        
        {/* Additional details section */}
        <div className="mt-4 border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700">Contact Information</h4>
              <p className="text-sm text-gray-600">
                {user.contactName && <span className="block">Contact: {user.contactName}</span>}
                {user.phoneNumber && <span className="block">Phone: {user.phoneNumber}</span>}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700">Documents</h4>
              <div className="flex flex-col space-y-1 mt-1">
                {user.efdaLicenseUrl && (
                  <a 
                    href={user.efdaLicenseUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm"
                  >
                    EFDA License
                  </a>
                )}
                {user.businessLicenseUrl && (
                  <a 
                    href={user.businessLicenseUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm"
                  >
                    Business License
                  </a>
                )}
                {!user.efdaLicenseUrl && !user.businessLicenseUrl && (
                  <span className="text-sm text-gray-500">No documents uploaded</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
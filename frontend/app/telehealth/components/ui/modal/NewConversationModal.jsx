// /modal/NewConversationModal.jsx
"use client";
import { useState, useEffect } from "react";
import { Search, MessageCircle, X, User, Loader2 } from "lucide-react";
import { useQuery } from "@apollo/client";
import { SEARCH_DOCTORS } from "../../api/graphql/queries";
import Image from "next/image";
import { Button } from "../ui/Button";

export const NewConversationModal = ({
  isOpen,
  onClose,
  onSelectUser,
  createConversation,
  loading,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // GraphQL query with skip condition when no search query
  const {
    data,
    loading: searchLoading,
    error,
  } = useQuery(SEARCH_DOCTORS, {
    variables: {
      searchQuery: debouncedQuery,
    },
    skip: !debouncedQuery || debouncedQuery.trim().length < 2,
    fetchPolicy: "cache-and-network",
  });

  const doctors = data?.searchDoctors || [];

  const handleUserSelect = async (selectedUser) => {
    if (creating || !createConversation) return;

    try {
      setCreating(true);
      const newConversation = await createConversation([selectedUser.doctorId]);

      if (newConversation) {
        onSelectUser(newConversation);
        onClose();
        setSearchQuery(""); // Reset search when successful
        setSelectedUsers([]);
      }
    } catch (error) {
      console.error("Failed to create conversation:", error);
      // Show error to doctor
      alert("Failed to create conversation. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    if (creating) return; // Prevent closing while creating
    onClose();
    setSearchQuery(""); // Reset search when closing
    setSelectedUsers([]);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const isLoading = searchLoading || creating || loading;

  return (
    <div className="fixed inset-0 bg-background/40 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-secondary">
            New Conversation
          </h2>
          <button
            onClick={handleClose}
            disabled={creating}
            className={`p-1 hover:bg-red-500 hover:text-white rounded-full transition-colors ${
              creating ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-primary" />
            <input
              type="text"
              placeholder="Search by company, contact, or state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={creating}
              className={`pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                creating ? "opacity-50 cursor-not-allowed" : ""
              }`}
              autoFocus
            />
          </div>
          {searchLoading && (
            <div className="mt-2 text-xs text-gray-500">Searching...</div>
          )}
          {creating && (
            <div className="mt-2 text-xs text-blue-500">
              Creating conversation...
            </div>
          )}
          {error && (
            <div className="mt-2 text-xs text-red-500">
              Error searching users. Please try again.
            </div>
          )}
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto">
          {!debouncedQuery || debouncedQuery.trim().length < 2 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                Start typing to search
              </h3>
              <p className="text-xs text-gray-500">
                Enter at least 2 characters to search for users
              </p>
            </div>
          ) : doctors.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {doctors.map((doctor) => (
                <div
                  key={doctor.doctorId}
                  className={`px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    creating ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={() => !creating && handleUserSelect(doctor)}
                >
                  <div className="flex items-center">
                    {/* Profile Image */}
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      {doctor.user.profileImageUrl ? (
                        <img
                          src={process.env.NEXT_PUBLIC_TELEHEALTH_API_URL + doctor.user.profileImageUrl}
                          alt={ "Dr." + doctor.user.firstName || "User"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary/20  flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {"Dr." + doctor.user.firstName || "User"}
                        </h3>
                        {!doctor.isApproved && (
                          <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            Pending
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center text-xs text-gray-500">
                        {doctor.user.firstName && doctor.user.lastName && (
                          <span className="truncate mr-2">
                            { "Dr." + doctor.user.firstName} {doctor.user.lastName}
                          </span>
                        )}
                        {doctor.user.gender && (
                          <span className="flex items-center">
                            <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                            {doctor.user.gender}
                          </span>
                        )}
                      </div>

                      {doctor.specialization && (
                        <div className="mt-1 text-xs text-gray-400 truncate">
                          {doctor.specialization.join(", ")}
                        </div>
                      )}
                    </div>

                    {/* Message Icon */}
                    <div className="ml-4 flex-shrink-0">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        <MessageCircle className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                No users found
              </h3>
              <p className="text-xs text-gray-500">
                Try adjusting your search terms
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <Button
            onClick={handleClose}
            disabled={creating}
            className={` ${creating ? "opacity-50 cursor-not-allowed" : ""} w-full`}
          >
            {creating ? "Creating..." : "Cancel"}
          </Button>
        </div>
      </div>
    </div>
  );
};

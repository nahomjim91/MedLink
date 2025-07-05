"use client";
import { Button, StepButtons } from "../../ui/Button";
import { StepProgressIndicator } from "../../ui/StepProgressIndicator";

export default function ConfirmationStep({
  userData,
  onNext,
  onPrevious,
  isLoading
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-center">Review Your Information</h2>
      <p className="text-gray-600 text-center mb-6">
        Please review the information below before completing your registration.
      </p>

      <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
        <div>
          <h3 className="text-lg font-medium text-secondary">Account Type</h3>
          <p className="mt-1 text-gray-600 capitalize">{userData.role}</p>
        </div>

        <div>
          <h3 className="text-lg font-medium text-secondary">Company Details</h3>
          <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Company Name</p>
              <p className="text-gray-600">{userData.companyName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Contact Person</p>
              <p className="text-gray-600">{userData.contactName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-gray-600">{userData.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone Number</p>
              <p className="text-gray-600">{userData.phoneNumber}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-secondary">Address</h3>
          <div className="mt-1">
            <p className="text-gray-600">{userData.address.street}</p>
            <p className="text-gray-600">
              {userData.address.city}, {userData.address.state} {userData.address.postalCode}
            </p>
          </div>
        </div>
      </div>

      <StepButtons onNext={onNext} onPrevious={onPrevious} isLoading={isLoading} />
    </div>
  );
}
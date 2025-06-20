import Link from "next/link";
import { Button, StepButtons } from "../../ui/Button";

export default function ConfirmationStep({
  userData,
  onNext,
  onPrevious,
  isLoading,
}) {
  return (
    <div className="px-6">
      <h2 className="text-2xl font-bold text-secondary/80 mb-4">
        Confirm Your Details
      </h2>

      <p className="text-secondary/60 mb-6">
        Please review your information below before finalizing your
        registration.
      </p>

      <div className="mb-8 bg-gray-50 rounded-lg p-4 text-left">
        <h3 className="font-medium text-secondary/80 mb-2">Account Summary</h3>
        <ul className="space-y-2 text-sm text-secondary/70">
          <li>
            <span className="font-medium">Role:</span>{" "}
            {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
          </li>
          <li>
            <span className="font-medium">Name:</span> {userData.firstName}{" "}
            {userData.lastName}
          </li>
          <li>
            <span className="font-medium">Email:</span> {userData.email}
          </li>
          <li>
            <span className="font-medium">Gender:</span> {userData.gender}
          </li>
          <li>
            <span className="font-medium">Date of Birth:</span>{" "}
            {userData.dateOfBirth}
          </li>
          <li>
            <span className="font-medium">Phone:</span> {userData.phoneNumber}
          </li>

          {userData.role === "doctor" && (
            <>
              <li>
                <span className="font-medium">Specialization:</span>{" "}
                {userData.specialization?.map((spec) => spec.name).join(", ")}
              </li>
              <li>
                <span className="font-medium">Experience:</span>{" "}
                {userData.experienceYears} years
              </li>
              {userData.aboutYou && (
                <li>
                  <span className="font-medium">About:</span>{" "}
                  {userData.aboutYou}
                </li>
              )}
            </>
          )}

          {userData.role === "patient" && (
            <>
              <li>
                <span className="font-medium">Height:</span> {userData.height}{" "}
                cm
              </li>
              <li>
                <span className="font-medium">Weight:</span> {userData.weight}{" "}
                kg
              </li>
              <li>
                <span className="font-medium">Blood Type:</span>{" "}
                {userData.bloodType}
              </li>
            </>
          )}
        </ul>
      </div>

      <StepButtons
        onNext={ isLoading ? () => {} : onNext}
        onPrevious={onPrevious}
        nextLabel={isLoading ? "Loading..." : "Confirm"}
      />
    </div>
  );
}

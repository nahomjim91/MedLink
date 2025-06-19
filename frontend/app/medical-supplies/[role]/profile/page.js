"use client";
import { useMSAuth } from "../../../../hooks/useMSAuth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client";
import { UPDATE_MS_USER_PROFILE } from "../../api/graphql/mutations";
import ProfileImage from "../../components/ui/ProfileImage";
import { Button } from "../../components/ui/Button";
import { FileField, Rating, TextField } from "../../components/ui/FormField";
import { FileText, MapPin, Save, X } from "lucide-react";
import { AddressInput, EditableFileField, EditableTextField } from "../../components/ui/Input";

// Create editable versions of our form fields

export default function ProfilePage() {
  const { user } = useMSAuth();
  const router = useRouter();
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updateMSUserProfile, { loading: updating }] = useMutation(
    UPDATE_MS_USER_PROFILE
  );

  const [userData, setUserData] = useState({
    role: user?.role || "",
    email: user?.email || "",
    companyName: user?.companyName || "",
    contactName: user?.contactName || "",
    phoneNumber: user?.phoneNumber || "",
    address: {
      street: user?.address?.street || "",
      city: user?.address?.city || "",
      state: user?.address?.state || "",
      country: user?.address?.country || "",
      postalCode: user?.address?.postalCode || "",
      geoLocation: user?.address?.geoLocation || {
        latitude: null,
        longitude: null,
      },
      geoLocationText: user?.address?.geoLocationText || "",
    },
    profileImage: null,
    efdaLicenseUrl: user?.efdaLicenseUrl || "",
    businessLicenseUrl: user?.businessLicenseUrl || "",
  });

  useEffect(() => {
    if (!user) {
      router.push("/");
    } else {
      // Update userData when user data is available or changes
      setUserData({
        role: user.role || "",
        email: user.email || "",
        companyName: user.companyName || "",
        contactName: user.contactName || "",
        phoneNumber: user.phoneNumber || "",
        address: {
          street: user.address?.street || "",
          city: user.address?.city || "",
          state: user.address?.state || "",
          country: user.address?.country || "",
          postalCode: user.address?.postalCode || "",
          geoLocation: user.address?.geoLocation || {
            latitude: null,
            longitude: null,
          },
          geoLocationText: user.address?.geoLocationText || "",
        },
        profileImage: null,
        efdaLicenseUrl: user.efdaLicenseUrl || "",
        businessLicenseUrl: user.businessLicenseUrl || "",
      });
    }
  }, [user, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Handle nested fields in address
    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setUserData({
        ...userData,
        address: {
          ...userData.address,
          [addressField]: value,
        },
      });
    } else {
      setUserData({
        ...userData,
        [name]: value,
      });
    }
  };

  const handleGeoLocationTextChange = (e) => {
    const { value } = e.target;

    setUserData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        geoLocationText: value,
      },
    }));
  };

  const handleGeoLocationChange = (geoLocation) => {
    setUserData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        geoLocation: {
          latitude: geoLocation.latitude,
          longitude: geoLocation.longitude,
        },
        geoLocationText: formatGeoLocationText(geoLocation),
      },
    }));
  };

  function formatGeoLocationText(geoLocation) {
    if (
      !geoLocation ||
      geoLocation.latitude === null ||
      geoLocation.longitude === null
    ) {
      return "";
    }
    return `${geoLocation.latitude.toFixed(6)}, ${geoLocation.longitude.toFixed(
      6
    )}`;
  }

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const cancelEdit = () => {
    // Reset to original user data
    setUserData({
      role: user.role || "",
      email: user.email || "",
      companyName: user.companyName || "",
      contactName: user.contactName || "",
      phoneNumber: user.phoneNumber || "",
      address: {
        street: user.address?.street || "",
        city: user.address?.city || "",
        state: user.address?.state || "",
        country: user.address?.country || "",
        postalCode: user.address?.postalCode || "",
        geoLocation: user.address?.geoLocation || {
          latitude: null,
          longitude: null,
        },
        geoLocationText: user.address?.geoLocationText || "",
      },
      profileImage: null,
      efdaLicenseUrl: user.efdaLicenseUrl || "",
      businessLicenseUrl: user.businessLicenseUrl || "",
    });
    setIsEditing(false);
  };

  const handleSubmit = async () => {
    try {
      setError(null);

      // Validate required fields
      const requiredFields = ["companyName", "contactName", "phoneNumber"];
      for (const field of requiredFields) {
        if (!userData[field]) {
          setError(`Please complete all required fields. Missing: ${field}`);
          return;
        }
      }

      // Validate address fields
      const requiredAddressFields = [
        "street",
        "city",
        "state",
        "country",
        "postalCode",
      ];
      for (const field of requiredAddressFields) {
        if (!userData.address[field]) {
          setError(`Please complete all address fields. Missing: ${field}`);
          return;
        }
      }

      const input = {
        userId: user.userId,
        role: userData.role,
        email: userData.email,
        companyName: userData.companyName,
        contactName: userData.contactName,
        phoneNumber: userData.phoneNumber,
        address: {
          street: userData.address.street,
          city: userData.address.city,
          state: userData.address.state,
          country: userData.address.country,
          postalCode: userData.address.postalCode,
          geoLocation: userData.address.geoLocation,
          geoLocationText: userData.address.geoLocationText,
        },
        // Handle file uploads if present
        ...(userData.profileImage && { profileImage: userData.profileImage }),
        ...(userData.efdaLicenseUrl &&
          typeof userData.efdaLicenseUrl !== "string" && {
            efdaLicense: userData.efdaLicenseUrl,
          }),
        ...(userData.businessLicenseUrl &&
          typeof userData.businessLicenseUrl !== "string" && {
            businessLicense: userData.businessLicenseUrl,
          }),
      };

      const { data } = await updateMSUserProfile({
        variables: { input },
      });

      if (data) {
        // Success! Exit edit mode
        setIsEditing(false);
        // You might want to update the user context with new data here
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(`Error updating profile: ${error.message}`);
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col items-center">
      <ProfileImage
        imageUrl={user.profileImageUrl}
        altText="Profile"
        isEditing={isEditing}
        companyName={user.companyName}
      />
      <div className="w-full mt-1 flex items-center">
        <div className="flex-1/4"></div>
        <div className="flex-1/2 text-3xl font-bold text-secondary/70 text-center flex items-center flex-col">
          <div>
            {userData.companyName} Drug & Medical Supplies {userData.role}
          </div>
          <Rating value={4} />
        </div>
        <div className="flex-1/4 flex justify-end pr-11">
          {!isEditing ? (
            <Button className="px-8" onClick={toggleEdit}>
              Update
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                className="px-8 flex items-center gap-1"
                onClick={handleSubmit}
                disabled={updating}
              >
                {updating ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="outline"
                className="px-4 flex items-center gap-1"
                color="error"
                onClick={cancelEdit}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="w-full mt-1 px-5 pt-3 flex bg-white rounded-3xl shadow-md text-secondary">
        {/* Information */}
        <div className="flex-1/2">
          <h1 className="text-xl font-medium mb-4">Information</h1>

          <div className="px-5">
            {isEditing ? (
              <>
                <EditableTextField
                  label="Company Name"
                  value={userData.companyName}
                  name="companyName"
                  onChange={handleInputChange}
                />
                <EditableTextField
                  label="Contact Name"
                  value={userData.contactName}
                  name="contactName"
                  onChange={handleInputChange}
                />
                <EditableTextField
                  label="Phone Number"
                  value={userData.phoneNumber}
                  name="phoneNumber"
                  onChange={handleInputChange}
                />
                <EditableTextField
                  label="Email"
                  value={userData.email}
                  name="email"
                  onChange={handleInputChange}
                />
                <AddressInput
                  label="Geolocation"
                  className="flex justify-between items-center pr-2  "
                  placeholder="Enter geolocation"
                  name="geoLocationText"
                  value={userData.address?.geoLocationText || ""}
                  onChange={handleGeoLocationTextChange}
                  onGeoLocationChange={handleGeoLocationChange}
                />
                <div className="flex gap-x-2">
                  <EditableTextField
                    label="Country"
                    value={userData.address.country || "Ethiopia"}
                    name="address.country"
                    onChange={handleInputChange}
                    bigSize={false}
                  />
                  <EditableTextField
                    label="State"
                    value={userData.address.state}
                    name="address.state"
                    onChange={handleInputChange}
                    bigSize={false}
                  />
                </div>
              </>
            ) : (
              <>
                <TextField label="Company Name" value={userData.companyName} />
                <TextField label="Contact Name" value={userData.contactName} />
                <TextField label="Phone Number" value={userData.phoneNumber} />
                <TextField label="Email" value={userData.email} />
                <TextField
                  label="Address"
                  icon={MapPin}
                  value={userData.address.geoLocationText}
                />
                <div className="flex gap-x-2">
                  <TextField
                    label="Country"
                    value={userData.address.country || "Ethiopia"}
                    bigSize={false}
                  />
                  <TextField
                    label="State"
                    value={userData.address.state}
                    bigSize={false}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Documents */}
        <div className="flex-1/2 border-l-primary/50 pl-2">
          <h1 className="text-xl font-medium mb-4">Documents</h1>
          <div className="px-5">
            {isEditing ? (
              <div className="flex flex-col gap-y-4">
                <EditableFileField
                  label="EFDA License"
                  value={userData.efdaLicenseUrl}
                  name="efdaLicenseUrl"
                  onChange={handleInputChange}
                />
                <EditableFileField
                  label="Business License"
                  value={userData.businessLicenseUrl}
                  name="businessLicenseUrl"
                  onChange={handleInputChange}
                />
              </div>
            ) : (
              <>
                <FileField
                  label="EFDA License"
                  fileName={
                    userData.efdaLicenseUrl
                      ? userData.efdaLicenseUrl.split("/").pop()
                      : "Not available"
                  }
                />
                <FileField
                  label="Business License"
                  fileName={
                    userData.businessLicenseUrl
                      ? userData.businessLicenseUrl.split("/").pop()
                      : "Not available"
                  }
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

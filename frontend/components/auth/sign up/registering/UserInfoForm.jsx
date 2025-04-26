import { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function UserInfoForm({ userData, onUpdate, onNext, onPrevious }) {
  const [formData, setFormData] = useState({
    firstName: userData.firstName || "",
    lastName: userData.lastName || "",
    gender: userData.gender || "",
    dateOfBirth: userData.dateOfBirth || "",
    phoneNumber: userData.phoneNumber || ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
    onNext();
  };

  const isFormValid = 
    formData.firstName.trim() !== "" && 
    formData.lastName.trim() !== "" && 
    formData.gender.trim() !== "" && 
    formData.dateOfBirth.trim() !== "" && 
    formData.phoneNumber.trim() !== "";

  return (
    <div className="bg-white rounded-3xl shadow-sm px-6 py-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-secondary/80 mb-2">
          Personal Information
        </h2>
        <p className="text-sm text-secondary/60">
          Tell us more about yourself
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="firstName" className="block text-sm font-medium text-secondary/70 mb-1">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="lastName" className="block text-sm font-medium text-secondary/70 mb-1">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="gender" className="block text-sm font-medium text-secondary/70 mb-1">
            Gender
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-secondary/70 mb-1">
            Date of Birth
          </label>
          <input
            type="date"
            id="dateOfBirth"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-secondary/70 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          />
        </div>

        <div className="flex space-x-4 mt-8">
          <Button
            type="button"
            variant="outline"
            color="secondary"
            onClick={onPrevious}
            className="w-1/2"
          >
            Previous Step
          </Button>
          <Button
            type="submit"
            variant="fill"
            color="primary"
            disabled={!isFormValid}
            className="w-1/2"
          >
            Next Step
          </Button>
        </div>
      </form>
    </div>
  );
}
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function SpecializationForm({ 
  specialization, 
  experienceYears, 
  aboutYou, 
  onUpdate, 
  onNext, 
  onPrevious 
}) {
  const [formData, setFormData] = useState({
    specialization: specialization || "",
    experienceYears: experienceYears || "",
    aboutYou: aboutYou || ""
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
    formData.specialization.trim() !== "" && 
    formData.experienceYears.trim() !== "";

  return (
    <div className="bg-white rounded-3xl shadow-sm px-6 py-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-secondary/80 mb-2">
          Professional Information
        </h2>
        <p className="text-sm text-secondary/60">
          Tell us about your medical expertise
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="specialization" className="block text-sm font-medium text-secondary/70 mb-1">
            Specialization
          </label>
          <input
            type="text"
            id="specialization"
            name="specialization"
            value={formData.specialization}
            onChange={handleChange}
            placeholder="e.g. Cardiology, Pediatrics, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="experienceYears" className="block text-sm font-medium text-secondary/70 mb-1">
            Experience Years
          </label>
          <input
            type="number"
            id="experienceYears"
            name="experienceYears"
            value={formData.experienceYears}
            onChange={handleChange}
            min="0"
            max="70"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="aboutYou" className="block text-sm font-medium text-secondary/70 mb-1">
            About You
          </label>
          <textarea
            id="aboutYou"
            name="aboutYou"
            value={formData.aboutYou}
            onChange={handleChange}
            rows="4"
            placeholder="Share your professional background, approach to patient care, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
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
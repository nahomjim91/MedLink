import React, { useState, useEffect } from 'react';
import { Search, X, Plus, Trash2, Edit3, Check, AlertCircle } from 'lucide-react';
import { extractUploadPath } from '../../../utils/api';
import Image from 'next/image';

const PrescriptionModal = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMedications, setSelectedMedications] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(true);

  // Sample patient data
  const patientData = {
    name: "Jane Doe",
    id: "#12345",
    avatar: "/api/placeholder/40/40"
  };

  // Search medications using OpenFDA API (free)
  const searchMedications = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Using OpenFDA API for drug information
      const response = await fetch(
        `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${query}"&limit=10`
      );
      const data = await response.json();
      
      if (data.results) {
        const medications = data.results.map((drug, index) => ({
          id: index,
          name: drug.openfda?.brand_name?.[0] || drug.openfda?.generic_name?.[0] || 'Unknown',
          generic: drug.openfda?.generic_name?.[0] || '',
          manufacturer: drug.openfda?.manufacturer_name?.[0] || '',
          dosage_forms: drug.dosage_form || ['Tablet']
        }));
        setSearchResults(medications);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching medications:', error);
      // Fallback to mock data if API fails
      const mockResults = [
        { id: 1, name: 'Amoxicillin', generic: 'Amoxicillin', manufacturer: 'Generic Pharma', dosage_forms: ['Capsule', 'Tablet'] },
        { id: 2, name: 'Paracetamol', generic: 'Acetaminophen', manufacturer: 'Pain Relief Co', dosage_forms: ['Tablet'] },
        { id: 3, name: 'Ibuprofen', generic: 'Ibuprofen', manufacturer: 'Anti-Inflammatory Inc', dosage_forms: ['Tablet', 'Capsule'] }
      ].filter(med => med.name.toLowerCase().includes(query.toLowerCase()));
      setSearchResults(mockResults);
    }
    setIsSearching(false);
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        searchMedications(searchTerm);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const addMedication = (medication) => {
    const newMedication = {
      ...medication,
      prescriptionId: Date.now(),
      dosage: '500mg',
      route: 'Oral',
      frequency: '3 times daily',
      duration: '7 days',
      instructions: 'Take with food. Complete the full course of antibiotics.'
    };
    setSelectedMedications([...selectedMedications, newMedication]);
    setSearchTerm('');
    setSearchResults([]);
  };

  const removeMedication = (prescriptionId) => {
    setSelectedMedications(selectedMedications.filter(med => med.prescriptionId !== prescriptionId));
  };

  const updateMedication = (prescriptionId, field, value) => {
    setSelectedMedications(selectedMedications.map(med =>
      med.prescriptionId === prescriptionId ? { ...med, [field]: value } : med
    ));
  };

  const handleSign = () => {
    setShowSignatureModal(true);
  };

  const confirmSignature = () => {
    if (signatureData.trim()) {
      setIsSigned(true);
      setShowSignatureModal(false);
    }
  };

  const handleSubmit = () => {
    if (isSigned && selectedMedications.length > 0) {
      alert('Prescription submitted successfully!');
      // Handle submission logic here
    }
  };

  const SignatureModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-4">Digital Signature</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Enter your signature:</label>
          <input
            type="text"
            value={signatureData}
            onChange={(e) => setSignatureData(e.target.value)}
            placeholder="Type your full name"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <div className="text-xs text-gray-500 mb-4">
          By signing, you confirm the accuracy of this prescription and authorize its dispensing.
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowSignatureModal(false)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={confirmSignature}
            disabled={!signatureData.trim()}
            className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Sign
          </button>
        </div>
      </div>
    </div>
  );

  if (!isModalOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold">Write Prescription</h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          {/* Patient Info */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200">
                <Image
                  src={ process.env.NEXT_PUBLIC_TELEHEALTH_API_URL + patientData.avatar}
                  alt="Patient" 
                  fill
                  className="object-cover"
                />
                </div>
                <div>
                  <h3 className="font-semibold">{patientData.name}</h3>
                  <p className="text-sm text-gray-500">Patient ID: {patientData.id}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Appointment ID</p>
                <p className="font-semibold">{patientData.id}</p>
              </div>
            </div>
          </div>

          <div className="p-4">
            {/* Search Section */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search Medication..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((medication) => (
                    <div
                      key={medication.id}
                      onClick={() => addMedication(medication)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    >
                      <div className="font-medium">{medication.name}</div>
                      <div className="text-sm text-gray-500">
                        {medication.generic && `Generic: ${medication.generic}`}
                        {medication.manufacturer && ` | ${medication.manufacturer}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isSearching && (
                <div className="mt-2 p-3 text-center text-gray-500">
                  Searching medications...
                </div>
              )}
            </div>

            {/* Selected Medications */}
            <div className="space-y-4">
              {selectedMedications.map((medication) => (
                <div key={medication.prescriptionId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-lg">{medication.name}</h4>
                    <button
                      onClick={() => removeMedication(medication.prescriptionId)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                      <input
                        type="text"
                        value={medication.dosage}
                        onChange={(e) => updateMedication(medication.prescriptionId, 'dosage', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                      <select
                        value={medication.route}
                        onChange={(e) => updateMedication(medication.prescriptionId, 'route', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        <option value="Oral">Oral</option>
                        <option value="Topical">Topical</option>
                        <option value="Injection">Injection</option>
                        <option value="Inhalation">Inhalation</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                      <select
                        value={medication.frequency}
                        onChange={(e) => updateMedication(medication.prescriptionId, 'frequency', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        <option value="Once daily">Once daily</option>
                        <option value="Twice daily">Twice daily</option>
                        <option value="3 times daily">3 times daily</option>
                        <option value="4 times daily">4 times daily</option>
                        <option value="As needed">As needed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                      <input
                        type="text"
                        value={medication.duration}
                        onChange={(e) => updateMedication(medication.prescriptionId, 'duration', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                    <textarea
                      value={medication.instructions}
                      onChange={(e) => updateMedication(medication.prescriptionId, 'instructions', e.target.value)}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Special instructions for the patient..."
                    />
                  </div>
                </div>
              ))}
            </div>

            {selectedMedications.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No medications selected. Search and add medications above.</p>
              </div>
            )}

            {/* Signature Status */}
            {isSigned && (
              <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <Check size={16} />
                  <span className="font-medium">Digitally signed by: {signatureData}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSign}
                disabled={selectedMedications.length === 0 || isSigned}
                className="flex-1 px-6 py-3 border border-teal-500 text-teal-600 rounded-lg hover:bg-teal-50 font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed"
              >
                {isSigned ? 'Signed' : 'Sign'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isSigned || selectedMedications.length === 0}
                className="flex-1 px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSignatureModal && <SignatureModal />}
    </>
  );
};

export default PrescriptionModal;
"use client";

import { useAuth } from "../../../hooks/useAuth";

export default function PatientDashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Welcome back, {user?.firstName || 'Patient'}
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Upcoming Appointments</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-indigo-500 pl-3">
              <p className="text-sm text-gray-500">Wednesday, May 8 • 10:30 AM</p>
              <p className="font-medium">Dr. Michael Reynolds</p>
              <p className="text-sm text-gray-600">Annual Check-up</p>
            </div>
            <div className="border-l-4 border-indigo-500 pl-3">
              <p className="text-sm text-gray-500">Monday, May 13 • 2:15 PM</p>
              <p className="font-medium">Dr. Susan Chang</p>
              <p className="text-sm text-gray-600">Follow-up Appointment</p>
            </div>
            <button className="w-full mt-4 bg-indigo-100 text-indigo-800 py-2 rounded hover:bg-indigo-200">
              Schedule New Appointment
            </button>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Health Reminders</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <p>Medication refill needed: Prescription #RX88472</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <p>Lab results available for review</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <p>Health survey due: Annual wellness assessment</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
              Message Your Doctor
            </button>
            <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              View Medical Records
            </button>
            <button className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">
              Request Prescription Refill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
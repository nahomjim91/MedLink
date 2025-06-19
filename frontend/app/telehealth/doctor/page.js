"use client";

import { useAuth } from "../../../hooks/useAuth";

export default function DoctorDashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Doctor Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Today&apos;s Schedule</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-3">
              <p className="text-sm text-gray-500">9:00 AM - 9:30 AM</p>
              <p className="font-medium">James Wilson</p>
              <p className="text-sm text-gray-600">Follow-up Consultation</p>
            </div>
            <div className="border-l-4 border-green-500 pl-3">
              <p className="text-sm text-gray-500">10:15 AM - 10:45 AM</p>
              <p className="font-medium">Emma Thompson</p>
              <p className="text-sm text-gray-600">New Patient Intake</p>
            </div>
            <div className="border-l-4 border-red-500 pl-3">
              <p className="text-sm text-gray-500">11:30 AM - 12:00 PM</p>
              <p className="font-medium">Robert Davis</p>
              <p className="text-sm text-gray-600">Urgent Consultation</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Patient Insights</h2>
          <div className="space-y-3">
            <div>
              <p className="text-gray-600">Active Patients</p>
              <p className="text-2xl font-bold">48</p>
            </div>
            <div>
              <p className="text-gray-600">Pending Reports</p>
              <p className="text-2xl font-bold">7</p>
            </div>
            <div>
              <p className="text-gray-600">Follow-ups Needed</p>
              <p className="text-2xl font-bold">12</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
              Start Consultation
            </button>
            <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              View Patient Records
            </button>
            <button className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">
              Manage Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
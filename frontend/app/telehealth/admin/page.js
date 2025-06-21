"use client";

import { useAuth } from "../hooks/useAuth";

export default function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">System Overview</h2>
          <div className="space-y-4">
            <div>
              <p className="text-gray-600">Active Patients</p>
              <p className="text-2xl font-bold">1,245</p>
            </div>
            <div>
              <p className="text-gray-600">Active Doctors</p>
              <p className="text-2xl font-bold">86</p>
            </div>
            <div>
              <p className="text-gray-600">Appointments Today</p>
              <p className="text-2xl font-bold">128</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <p>New doctor registration: Dr. Sarah Johnson</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <p>System update completed: v2.5.0</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <p>High traffic alert: 85% server capacity</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              Manage Users
            </button>
            <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
              System Settings
            </button>
            <button className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">
              View Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
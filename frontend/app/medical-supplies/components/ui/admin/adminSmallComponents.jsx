import React from 'react';
import { TrendingUp } from 'lucide-react';

// Status Badge Component
export const StatusBadge = ({ status, type = 'order' }) => {
  const getStatusColor = (status, type) => {
    if (type === 'order') {
      switch (status) {
        case 'PENDING_CONFIRMATION': return 'bg-yellow-100 text-yellow-800';
        case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
        case 'COMPLETED': return 'bg-green-100 text-green-800';
        case 'CANCELLED': return 'bg-red-100 text-red-800';
        case 'DISPUTED': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    } else if (type === 'transaction') {
      switch (status) {
        case 'PENDING': return 'bg-yellow-100 text-yellow-800';
        case 'PROCESSING': return 'bg-blue-100 text-blue-800';
        case 'PAID_HELD_BY_SYSTEM': return 'bg-orange-100 text-orange-800';
        case 'RELEASED_TO_SELLER': return 'bg-green-100 text-green-800';
        case 'REFUNDED': return 'bg-gray-100 text-gray-800';
        case 'FAILED': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status, type)}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

// Stats Card Component
export const StatsCard = ({ title, value, icon: Icon, color, change }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {change && (
          <p className="text-sm text-primary mt-1">
            <TrendingUp className="w-4 h-4 inline mr-1" />
            {change}% from last month
          </p>
        )}
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

// Loading Component
export const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="bg-white rounded-xl shadow-sm p-8 text-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
    <p className="text-gray-600">{message}</p>
  </div>
);

// Error Component
export const ErrorAlert = ({ error, onRetry }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
    <div className="flex">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-red-800">Error</h3>
        <p className="text-sm text-red-700 mt-1">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  </div>
);

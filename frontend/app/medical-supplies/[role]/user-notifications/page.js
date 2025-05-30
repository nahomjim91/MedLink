'use client';
import { AlertCircle, Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { useNotifications } from "../../hooks/useNotifications";
import { useState } from "react";


// Full Notification Page Component
 export default function NotificationPage  (){
  const { notifications, loading, error, getUnreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications();
  const [filter, setFilter] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState([]);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    if (filter !== 'all') return notification.type === filter;
    return true;
  });

  const handleSelectNotification = (id) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(nId => nId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const unreadIds = filteredNotifications.filter(n => !n.isRead).map(n => n.id);
    setSelectedNotifications(prev => 
      prev.length === unreadIds.length ? [] : unreadIds
    );
  };

  const handleBulkMarkAsRead = () => {
    if (selectedNotifications.length > 0) {
      markAsRead(selectedNotifications);
      setSelectedNotifications([]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-2">Error loading notifications</p>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <div className="flex items-center gap-2">
            {getUnreadCount() > 0 && (
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {getUnreadCount()} unread
              </span>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {['all', 'unread', 'read', 'order', 'user', 'system', 'reminder', 'alert'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === filterOption
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>

        {/* Bulk Actions */}
        {filteredNotifications.some(n => !n.isRead) && (
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedNotifications.length === filteredNotifications.filter(n => !n.isRead).length}
                onChange={handleSelectAll}
                className="rounded border-gray-300"
              />
              Select all unread
            </label>
            {selectedNotifications.length > 0 && (
              <button
                onClick={handleBulkMarkAsRead}
                className="flex items-center gap-1 px-3 py-1 bg-primary/25 text-white rounded text-sm hover:bg-primary"
              >
                <Check className="w-4 h-4" />
                Mark as read ({selectedNotifications.length})
              </button>
            )}
            {getUnreadCount() > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all as read
              </button>
            )}
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border transition-all hover:shadow-sm ${
                !notification.isRead 
                  ? 'bg-blue-50/50 border-blue-200' 
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start gap-4">
                {!notification.isRead && (
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.id)}
                    onChange={() => handleSelectNotification(notification.id)}
                    className="mt-1 rounded border-gray-300"
                  />
                )}
                
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColors(notification.type)}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-gray-900 mb-1">{notification.message}</p>
                      {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                        <div className="text-sm text-gray-600 bg-gray-50 rounded p-2 mt-2">
                          {Object.entries(notification.metadata).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="font-medium">{key}:</span>
                              <span>{value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">{formatRelativeTime(notification.createdAt)}</div>
                        <div className="text-xs text-gray-400 capitalize">{notification.type}</div>
                      </div>
                      
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead([notification.id])}
                          className="p-2 text-primary hover:bg-primary/25 rounded-full"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => removeNotification(notification.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                        title="Remove notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {!notification.isRead && (
                  <div className="w-3 h-3 bg-primary/70 rounded-full flex-shrink-0 mt-1"></div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? "You're all caught up! No notifications to show."
                : `No ${filter} notifications found.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
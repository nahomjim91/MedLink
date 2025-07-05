import { useEffect, useRef } from "react";
import { useSocketContext } from "../../../context/SocketContext";
import Link from "next/link";
import { AlertCircle, Bell, Check, CheckCheck, X, UserPlus, Calendar, Settings, Info, CheckCircle, Package } from "lucide-react";

// Mini Notification Dropdown Component
export const NotificationDropdown = ({
  isOpen,
  onClose,
  triggerRef,
  userType = 'user',
}) => {
  const {
    notifications,
    notificationCount,
    markNotificationsAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    isConnected
  } = useSocketContext();
  
  const dropdownRef = useRef(null);
  const recentNotifications = notifications.slice(0, 5);

  const getUnreadCount = () => {
    return notifications.filter(n => !n.isRead).length;
  };

  const handleMarkAsRead = async (notificationIds) => {
    try {
      await markNotificationsAsRead(notificationIds);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleRemoveNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 top-full w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-secondary">Notifications</h3>
          {!isConnected && (
            <span className="w-2 h-2 bg-red-500 rounded-full" title="Disconnected"></span>
          )}
        </div>
        {getUnreadCount() > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-gray-600 hover:text-primary flex items-center gap-1"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="max-h-64 overflow-y-auto">
        {recentNotifications.length > 0 ? (
          recentNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`px-3 py-1.5 border-b border-primary/10 hover:bg-primary/10 transition-colors ${
                !notification.isRead ? "bg-blue-50/30" : ""
              } ${notification.isUrgent ? 'bg-orange-50/50' : ''} ${
                notification.isEmergency ? 'bg-red-50/50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getNotificationColors(
                    notification.type
                  )}`}
                >
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    {notification.isUrgent && <span className="text-xs">🚨</span>}
                    {notification.isEmergency && <span className="text-xs">🆘</span>}
                  </div>
                  <p className="text-sm text-secondary mb-1 line-clamp-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                    <div className="flex items-center gap-1">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead([notification.id])}
                          className="text-gray-400 hover:text-primary p-1"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveNotification(notification.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {!notification.isRead && (
                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-gray-500">
            <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No notifications yet</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {recentNotifications.length > 0 && (
        <div className="p-3 border-t border-gray-100 text-center">
          <Link
            href={`/medical-supplies/${userType}/user-notifications`}
            className="text-sm text-primary/70 hover:text-primary font-medium"
            onClick={onClose}
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
};

// Utility Functions
export const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

// Get icon based on notification type
export const getNotificationIcon = (type) => {
  const iconMap = {
    order: Package,
    user: UserPlus,
    system: Settings,
    reminder: Calendar,
    alert: AlertCircle,
    info: Info,
    success: CheckCircle,
  };
  const IconComponent = iconMap[type] || Info;
  return <IconComponent className="w-4 h-4" />;
};

// Get color classes based on notification type
export const getNotificationColors = (type) => {
  const colorMap = {
    order: "text-blue-600 bg-blue-50",
    user: "text-green-600 bg-green-50",
    system: "text-gray-600 bg-gray-50",
    reminder: "text-yellow-600 bg-yellow-50",
    alert: "text-red-600 bg-red-50",
    info: "text-blue-600 bg-blue-50",
    success: "text-green-600 bg-green-50",
  };
  return colorMap[type] || "text-gray-600 bg-gray-50";
};
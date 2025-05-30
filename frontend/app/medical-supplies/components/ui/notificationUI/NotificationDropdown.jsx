'use client';
import {
  Bell,
  X,
  CheckCheck,
  AlertCircle,
  Info,
  CheckCircle,
  Package,
  UserPlus,
  Calendar,
  Settings,
} from "lucide-react";
import Link from "next/link";

const { useNotifications } = require("../../../hooks/useNotifications");
const { useRef, useEffect  } = require("react");

// Mini Notification Dropdown Component
export const NotificationDropdown = ({
  isOpen,
  onClose,
  triggerRef,
  userType,
}) => {
  const {
    notifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotifications();
  const dropdownRef = useRef(null);
  const recentNotifications = notifications.slice(0, 5);

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
        <h3 className="font-semibold text-gray-900">Notifications</h3>
        {getUnreadCount() > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-primary/70 hover:text-primary flex items-center gap-1"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="max-h-64  overflow-y-auto">
        {recentNotifications.length > 0 ? (
          recentNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                !notification.isRead ? "bg-blue-50/30" : ""
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
                  <p className="text-sm text-gray-900 mb-1">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                    <div className="flex items-center gap-1">
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead([notification.id])}
                          className="text-blue-600 hover:text-blue-700 p-1"
                          title="Mark as read"
                        >
                          <ChecK className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => removeNotification(notification.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                        title="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {!notification.isRead && (
                  <div className="w-2 h-2 bg-primary/25 rounded-full flex-shrink-0 mt-2"></div>
                )}
              </div>
            </div>
          ))
        ) : (
          <Link
            href={`/medical-supplies/${userType}/user-notifications`}
            className="p-2 text-center text-gray-500"
          >
            <Bell className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm">No notifications yet</p>
          </Link>
        )}
      </div>

      {/* Footer */}
      {recentNotifications.length > 0 && (
        <div className="p-3 border-t border-gray-100 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};

export const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
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

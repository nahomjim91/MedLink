"use client";
import {
  AlertCircle,
  Bell,
  Check,
  CheckCheck,
  Trash2,
  X,
  UserPlus,
  Calendar,
  Settings,
  Info,
  CheckCircle,
  Package,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSocketContext } from "../../context/SocketContext";
import {
  getNotificationIcon,
  getNotificationColors,
  formatRelativeTime,
} from "../../components/ui/notificationUI/NotificationDropdown";

// Full Notification Page Component
export default function NotificationPage() {
  const {
    notifications,
    notificationCount,
    notificationStats,
    loadNotifications,
    markNotificationsAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    isConnected,
  } = useSocketContext();

  const [filter, setFilter] = useState("all");
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Memoize filtered notifications to prevent unnecessary re-renders
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (filter === "unread") return !notification.isRead;
      if (filter === "read") return notification.isRead;
      if (filter !== "all") return notification.type === filter;
      return true;
    });
  }, [notifications, filter]);

  // Memoize unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  // Stable load function with useCallback
  const loadData = useCallback(async () => {
    if (loading || hasInitialized) return; // Prevent multiple calls

    setLoading(true);
    try {
      await loadNotifications();
      setError(null);
      setHasInitialized(true);
    } catch (err) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [loadNotifications, loading, hasInitialized]);

  // Load notifications only once when connected
  useEffect(() => {
    if (isConnected && !hasInitialized && !loading) {
      loadData();
    }
  }, [isConnected, hasInitialized, loading, loadData]);

  // Stable handler functions with useCallback
  const handleSelectNotification = useCallback((id) => {
    setSelectedNotifications((prev) =>
      prev.includes(id) ? prev.filter((nId) => nId !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    const unreadIds = filteredNotifications
      .filter((n) => !n.isRead)
      .map((n) => n.id);
    setSelectedNotifications((prev) =>
      prev.length === unreadIds.length ? [] : unreadIds
    );
  }, [filteredNotifications]);

  const handleBulkMarkAsRead = useCallback(async () => {
    if (selectedNotifications.length > 0) {
      try {
        await markNotificationsAsRead(selectedNotifications);
        setSelectedNotifications([]);
      } catch (err) {
        console.error("Error marking notifications as read:", err);
      }
    }
  }, [selectedNotifications, markNotificationsAsRead]);

  const handleMarkAsRead = useCallback(
    async (notificationIds) => {
      try {
        await markNotificationsAsRead(notificationIds);
      } catch (err) {
        console.error("Error marking notification as read:", err);
      }
    },
    [markNotificationsAsRead]
  );

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      setSelectedNotifications([]);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  }, [markAllNotificationsAsRead]);

  const handleRemoveNotification = useCallback(
    async (notificationId) => {
      try {
        await deleteNotification(notificationId);
        setSelectedNotifications((prev) =>
          prev.filter((id) => id !== notificationId)
        );
      } catch (err) {
        console.error("Error deleting notification:", err);
      }
    },
    [deleteNotification]
  );

  // Show loading only on initial load
  if (loading && !hasInitialized) {
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
        <button
          onClick={() => {
            setError(null);
            setHasInitialized(false);
          }}
          className="mt-4 px-4 py-2 bg-primary/60 text-white rounded hover:bg-primary/70"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
            )}
            {!isConnected && (
              <span className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                Disconnected
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        {notificationStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 w-full ">
            <div className="bg-primary/20 p-3 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {notificationStats.unreadCount}
              </div>
              <div className="text-sm text-primary">Unread</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {notificationStats.totalCount}
              </div>
              <div className="text-sm text-gray-800">Total</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {notificationStats.byType?.order || 0}
              </div>
              <div className="text-sm text-green-800">Orders</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {notificationStats.byType?.reminder || 0}
              </div>
              <div className="text-sm text-yellow-800">Reminders</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {[
            "all",
            "unread",
            "read",
            "order",
            "user",
            "system",
            "reminder",
            "alert",
          ].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === filterOption
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>

        {/* Bulk Actions */}
        {filteredNotifications.some((n) => !n.isRead) && (
          <div className="flex items-center gap-4 p-1.5 bg-gray-50 rounded-lg">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={
                  selectedNotifications.length ===
                  filteredNotifications.filter((n) => !n.isRead).length
                }
                onChange={handleSelectAll}
                className="h-4 w-4 text-primary border border-primary rounded focus:outline-none focus:ring-primary focus:ring-2"
              />
              Select all unread
            </label>
            {selectedNotifications.length > 0 && (
              <button
                onClick={handleBulkMarkAsRead}
                className="flex items-center gap-1 px-3 py-1 bg-primary/60 text-white rounded text-sm hover:bg-primary"
              >
                <Check className="w-4 h-4" />
                Mark as read ({selectedNotifications.length})
              </button>
            )}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 px-3 py-1 border border-primary/60 text-primary rounded text-sm hover:bg-primary/10"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all as read
              </button>
            )}
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className={` ${unreadCount > 0 ? "h-[55vh]" : " h-[68vh]"} overflow-y-auto`}>
        <div className="space-y-2">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border transition-all hover:shadow-sm ${
                  !notification.isRead
                    ? "bg-primary/4 border-primary/20"
                    : "bg-white border-gray-200"
                } ${notification.isUrgent ? "ring-2 ring-orange-200" : ""} ${
                  notification.isEmergency ? "ring-2 ring-red-200" : ""
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

                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColors(
                      notification.type
                    )}`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* FIXED: Removed bg-amber-400 and improved styling */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 w-full">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {notification.isUrgent && (
                            <span className="inline-flex items-center text-xs bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-full font-medium">
                              🚨 URGENT
                            </span>
                          )}
                          {notification.isEmergency && (
                            <span className="inline-flex items-center text-xs bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full font-medium">
                              🆘 EMERGENCY
                            </span>
                          )}
                        </div>

                        <p className="text-gray-900 font-medium mb-2 leading-relaxed">
                          {notification.message}
                        </p>

                        {notification.metadata &&
                          Object.keys(notification.metadata).length > 0 && (
                            <div className="text-sm bg-gray-50 border border-gray-200 rounded-lg p-3 mt-2">
                              <div className="grid gap-2">
                                {Object.entries(notification.metadata).map(
                                  ([key, value]) => (
                                    <div
                                      key={key}
                                      className="flex justify-between items-center py-1"
                                    >
                                      <span className="font-medium text-gray-600 capitalize">
                                        {key.replace(/([A-Z])/g, " $1").trim()}:
                                      </span>
                                      <span className="text-gray-900 font-mono text-xs bg-white px-2 py-1 rounded border">
                                        {String(value)}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-sm text-gray-500 font-medium">
                            {formatRelativeTime(notification.createdAt)}
                          </div>
                          <div className="text-xs text-gray-400 capitalize mt-1">
                            {notification.type}
                          </div>
                          {notification.priority && (
                            <div className="text-xs text-gray-400 capitalize mt-1">
                              Priority: {notification.priority}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-1 ml-2">
                          {!notification.isRead && (
                            <button
                              onClick={() =>
                                handleMarkAsRead([notification.id])
                              }
                              className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() =>
                              handleRemoveNotification(notification.id)
                            }
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            title="Remove notification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!notification.isRead && (
                    <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0 mt-1"></div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No notifications
              </h3>
              <p className="text-gray-500">
                {filter === "all"
                  ? "You're all caught up! No notifications to show."
                  : `No ${filter} notifications found.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

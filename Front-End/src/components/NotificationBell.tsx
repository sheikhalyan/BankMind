import { useState, useEffect } from 'react';
import { Bell, CheckCheck, Trash2, X, RefreshCw } from 'lucide-react';
import { notificationService, Notification } from '../services/notification';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications();
      console.log('📊 Raw notifications data:', data);
      
      setNotifications(data);
      // Handle both boolean and number values for is_read
      const unread = data.filter(n => n.is_read === false || n.is_read === 0).length;
      console.log('📊 Unread count:', unread);
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      await notificationService.deleteNotification(notificationId);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50">
          <div className="flex justify-between items-center p-3 border-b">
            <h3 className="font-semibold text-gray-900">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-xs text-red-600">({unreadCount} unread)</span>
              )}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={fetchNotifications}
                className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                title="Refresh"
                disabled={loading}
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {notifications.length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  className={`p-3 border-b hover:bg-gray-50 transition ${
                    (notification.is_read === false || notification.is_read === 0) ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      {(notification.is_read == false || notification.is_read === 0) && (
                        <button
                          onClick={() => markAsRead(notification.notification_id)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Mark as read"
                        >
                          <CheckCheck className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.notification_id)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
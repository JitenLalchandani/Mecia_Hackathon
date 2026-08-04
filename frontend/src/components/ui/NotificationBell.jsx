// frontend/src/components/ui/NotificationBell.jsx
import React, { useEffect, useState } from 'react';
import api from '../../utils/Axios';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api.get('/notifications').then(res => setNotifications(res.data)).catch(() => {});
  }, []);

  return (
    <div className="relative">
      <button className="p-2 text-gray-600 hover:text-black">
        🔔 {notifications.filter(n => !n.read).length > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
            {notifications.filter(n => !n.read).length}
          </span>
        )}
      </button>
    </div>
  );
}
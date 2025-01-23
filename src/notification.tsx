// src/components/common/Notification.tsx

import { useEffect, useState } from "react";

export type NotificationType = "success" | "error" | "warning" | "info";

interface NotificationProps {
  message: string;
  type: NotificationType;
  duration?: number;
  onClose?: () => void;
}

export function Notification({
  message,
  type,
  duration = 5000,
  onClose,
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!isVisible) return null;

  const backgroundColor = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  }[type];

  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${backgroundColor} text-white`}
      role="alert"
    >
      <div className="flex items-center">
        <span className="mr-2">
          {type === "success" && "✓"}
          {type === "error" && "✕"}
          {type === "warning" && "⚠"}
          {type === "info" && "ℹ"}
        </span>
        <p>{message}</p>
        <button
          className="ml-4 text-white hover:text-gray-200"
          onClick={() => {
            setIsVisible(false);
            onClose?.();
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// Notification Manager Component
interface NotificationManagerProps {
  notifications: Array<{
    id: string;
    message: string;
    type: NotificationType;
  }>;
  onDismiss: (id: string) => void;
}

export function NotificationManager({
  notifications,
  onDismiss,
}: NotificationManagerProps) {
  return (
    <div className="fixed top-4 right-4 z-50">
      {notifications.map((notification) => (
        <div key={notification.id} className="mb-2">
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => onDismiss(notification.id)}
          />
        </div>
      ))}
    </div>
  );
}

'use client';
import React, { useEffect } from 'react';
import { FiCheck, FiX, FiAlertCircle, FiInfo } from 'react-icons/fi';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheck className="text-green-500" />;
      case 'error':
        return <FiAlertCircle className="text-red-500" />;
      case 'info':
        return <FiX className="text-blue-500" />;
      default:
        return <FiInfo className="text-gray-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div className={`flex items-center p-4 rounded-lg shadow-lg border ${getBackgroundColor()} transition-all duration-300 ease-in-out transform translate-x-0 opacity-100`}>
        <div className="mr-3">
          {getIcon()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <FiX size={16} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
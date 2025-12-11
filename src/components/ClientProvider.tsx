'use client';
import React from 'react';
import { useAppStore } from '../store/useAppStore';
import Toast from './Toast';

interface ClientProviderProps {
  children: React.ReactNode;
}

const ClientProvider: React.FC<ClientProviderProps> = ({ children }) => {
  const { toast, hideToast } = useAppStore();

  return (
    <>
      {children}
      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </>
  );
};

export default ClientProvider;
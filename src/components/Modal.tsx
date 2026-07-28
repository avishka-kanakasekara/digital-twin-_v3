import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[var(--text-primary)] opacity-20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative glass rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in bg-surface-solid">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <h2 className="text-lg font-bold">{title}</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[var(--bg-main)] text-secondary transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 bg-white">
          {children}
        </div>
      </div>
    </div>
  );
};

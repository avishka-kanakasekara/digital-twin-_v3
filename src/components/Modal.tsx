import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Tailwind max-width class; defaults to max-w-lg */
  maxWidthClass?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidthClass = 'max-w-lg' }) => {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="absolute inset-0 bg-[var(--text-primary)]/25 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative glass rounded-2xl w-full ${maxWidthClass} overflow-hidden shadow-2xl bg-surface-solid max-h-[92vh] flex flex-col`}>
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[var(--bg-main)] text-secondary transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 bg-white overflow-y-auto min-h-0">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

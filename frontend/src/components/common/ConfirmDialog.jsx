import React from 'react';
import { AlertCircle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={isDestructive ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        {isDestructive && (
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
        )}
        <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;

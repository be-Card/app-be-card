import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import styles from './ConfirmationModal.module.scss';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  clientName?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
  clientName
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <div className={`${styles.iconContainer} ${styles[type]}`}>
            <AlertTriangle size={24} />
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <p className={styles.modalMessage}>
            {message}
            {clientName && (
              <span className={styles.clientName}> "{clientName}"</span>
            )}
          </p>
        </div>
        
        <div className={styles.modalFooter}>
          <button 
            className={styles.cancelButton} 
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button 
            className={`${styles.confirmButton} ${styles[type]}`} 
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
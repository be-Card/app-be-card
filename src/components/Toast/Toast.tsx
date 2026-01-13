import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Toast as ToastType, useToast } from '../../contexts/ToastContext';
import styles from './Toast.module.scss';

interface ToastItemProps {
  toast: ToastType;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast }) => {
  const { removeToast } = useToast();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      // Start exit animation 300ms before removal
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
      }, toast.duration - 300);

      return () => clearTimeout(exitTimer);
    }
  }, [toast.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      removeToast(toast.id);
    }, 300);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <XCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'info':
        return <Info size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  return (
    <div
      className={`${styles.toast} ${styles[toast.type]} ${isExiting ? styles.exiting : ''}`}
      role="alert"
    >
      <div className={styles.icon}>{getIcon()}</div>
      <div className={styles.message}>{toast.message}</div>
      <button
        className={styles.closeButton}
        onClick={handleClose}
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  return (
    <div className={styles.toastContainer}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

export default ToastContainer;

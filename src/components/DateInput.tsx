import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import styles from './DateInput.module.scss';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  label?: string;
  min?: string;
  max?: string;
}

const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  className = '',
  placeholder = '',
  disabled = false,
  error = false,
  label,
  min,
  max,
}) => {
  const hasError = error;

  const placeholderValue = useMemo(() => {
    if (placeholder) return placeholder;
    return undefined;
  }, [placeholder]);

  return (
    <div className={`${styles.dateInputContainer} ${className}`}>
      {label && (
        <label className={styles.label}>{label}</label>
      )}
      <div className={`${styles.inputWrapper} ${hasError ? styles.error : ''}`}>
        <Calendar size={18} className={styles.inputIcon} />
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={`${styles.dateInput} ${hasError ? styles.inputError : ''}`}
          placeholder={placeholderValue}
          disabled={disabled}
          min={min}
          max={max}
        />
      </div>
    </div>
  );
};

export default DateInput;

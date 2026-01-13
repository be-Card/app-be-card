import React, { useState, useEffect } from 'react';
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
}

const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'dd/mm/aaaa',
  disabled = false,
  error = false,
  label
}) => {
  const [displayValue, setDisplayValue] = useState('');

  // Convertir valor ISO a formato dd/mm/yyyy para mostrar
  useEffect(() => {
    if (value) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          setDisplayValue(`${day}/${month}/${year}`);
        }
      } catch {
        setDisplayValue('');
      }
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const formatDateInput = (input: string): string => {
    // Remover todo lo que no sea número
    const numbers = input.replace(/\D/g, '');
    
    // Aplicar formato dd/mm/yyyy
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
  };

  const isValidDate = (day: number, month: number, year: number): boolean => {
    if (month < 1 || month > 12) return false;
    if (day < 1) return false;
    
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day > daysInMonth) return false;
    
    // Verificar que no sea una fecha futura
    const inputDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Permitir hasta el final del día actual
    
    return inputDate <= today;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const formatted = formatDateInput(input);
    setDisplayValue(formatted);

    // Si el formato está completo (dd/mm/yyyy), validar y convertir a ISO
    if (formatted.length === 10) {
      const [day, month, year] = formatted.split('/').map(Number);
      
      if (isValidDate(day, month, year)) {
        // Convertir a formato ISO (yyyy-mm-dd) para el backend
        const isoDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        onChange(isoDate);
      } else {
        // Fecha inválida, limpiar el valor
        onChange('');
      }
    } else {
      // Formato incompleto, limpiar el valor
      onChange('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir teclas de navegación y control
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];

    if (allowedKeys.includes(e.key)) {
      return;
    }

    // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
      return;
    }

    // Solo permitir números
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const getDateValidationMessage = (): string | null => {
    if (!displayValue || displayValue.length < 10) return null;
    
    const [day, month, year] = displayValue.split('/').map(Number);
    
    if (month < 1 || month > 12) {
      return 'Mes inválido';
    }
    
    if (day < 1) {
      return 'Día inválido';
    }
    
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day > daysInMonth) {
      return 'Día inválido para este mes';
    }
    
    const inputDate = new Date(year, month - 1, day);
    const today = new Date();
    
    if (inputDate > today) {
      return 'La fecha no puede ser futura';
    }
    
    // Verificar edad mínima (18 años)
    const age = today.getFullYear() - year;
    const monthDiff = today.getMonth() - (month - 1);
    const dayDiff = today.getDate() - day;
    
    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
    
    if (actualAge < 18) {
      return 'Debes ser mayor de 18 años';
    }
    
    return null;
  };

  const validationMessage = getDateValidationMessage();
  const hasError = error || !!validationMessage;

  return (
    <div className={`${styles.dateInputContainer} ${className}`}>
      {label && (
        <label className={styles.label}>{label}</label>
      )}
      <div className={`${styles.inputWrapper} ${hasError ? styles.error : ''}`}>
        <Calendar size={18} className={styles.inputIcon} />
        <input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className={`${styles.dateInput} ${hasError ? styles.inputError : ''}`}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={10}
        />
      </div>
      {validationMessage && (
        <span className={styles.errorText}>{validationMessage}</span>
      )}
    </div>
  );
};

export default DateInput;

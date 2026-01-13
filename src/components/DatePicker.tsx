import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './DatePicker.module.scss';

// Funciones auxiliares para manejar zona horaria UTC-3 (Buenos Aires)
const getUTC3Date = (date?: Date): Date => {
  const now = date || new Date();
  // Convertir a UTC-3 (Buenos Aires)
  const utc3Offset = -3 * 60; // UTC-3 en minutos
  const localOffset = now.getTimezoneOffset(); // Offset local en minutos
  const offsetDiff = localOffset - utc3Offset;
  return new Date(now.getTime() + (offsetDiff * 60 * 1000));
};

const getTodayUTC3 = (): Date => {
  const utc3Date = getUTC3Date();
  // Establecer a medianoche para comparaciones de fecha
  utc3Date.setHours(23, 59, 59, 999);
  return utc3Date;
};

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  label?: React.ReactNode;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'Seleccionar fecha',
  disabled = false,
  error = false,
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isYearEditing, setIsYearEditing] = useState(false);
  const [yearInputValue, setYearInputValue] = useState('');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const yearInputRef = useRef<HTMLInputElement>(null);

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Convertir valor ISO a formato dd/mm/yyyy para mostrar
  useEffect(() => {
    if (value) {
      try {
        // Parsear la fecha ISO manualmente para evitar problemas de zona horaria
        const [year, month, day] = value.split('-').map(Number);
        if (year && month && day) {
          // Crear fecha usando los componentes directamente (sin conversión de zona horaria)
          const date = new Date(year, month - 1, day);
          setDisplayValue(`${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`);
          setSelectedDate(date);
          setCurrentMonth(month - 1);
          setCurrentYear(year);
        }
      } catch {
        setDisplayValue('');
        setSelectedDate(null);
      }
    } else {
      setDisplayValue('');
      setSelectedDate(null);
    }
  }, [value]);

  // Cerrar calendario al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const isValidDate = (day: number, month: number, year: number): boolean => {
    if (month < 0 || month > 11) return false;
    if (day < 1) return false;
    
    const daysInMonth = getDaysInMonth(month, year);
    if (day > daysInMonth) return false;
    
    // Verificar que no sea una fecha futura usando UTC-3
    const inputDate = new Date(year, month, day);
    const today = getTodayUTC3();
    
    if (inputDate > today) return false;

    // Verificar edad mínima (18 años) usando UTC-3
    const todayUTC3 = getUTC3Date();
    const age = todayUTC3.getFullYear() - year;
    const monthDiff = todayUTC3.getMonth() - month;
    const dayDiff = todayUTC3.getDate() - day;
    
    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
    
    return actualAge >= 18;
  };

  const handleDateSelect = (day: number) => {
    if (!isValidDate(day, currentMonth, currentYear)) return;
    
    const isoDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    onChange(isoDate);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getYearLimits = () => {
    const todayUTC3 = getUTC3Date();
    return {
      minYear: 1900,
      maxYear: todayUTC3.getFullYear() // Permitir navegar hasta el año actual en UTC-3
    };
  };

  const isYearAtLimit = (increment: number) => {
    const { minYear, maxYear } = getYearLimits();
    const newYear = currentYear + increment;
    return newYear < minYear || newYear > maxYear;
  };

  const handleYearChange = (increment: number) => {
    const newYear = currentYear + increment;
    const { minYear, maxYear } = getYearLimits();
    
    if (newYear >= minYear && newYear <= maxYear) {
      setCurrentYear(newYear);
    }
  };

  // Función para formatear el input mientras se escribe
  const formatDateInput = (input: string): string => {
    // Remover caracteres no numéricos excepto /
    const cleaned = input.replace(/[^\d/]/g, '');
    
    // Separar por barras existentes
    const parts = cleaned.split('/');
    let result = '';
    
    // Procesar cada parte
    for (let i = 0; i < parts.length && i < 3; i++) {
      if (i === 0) {
        // Día: máximo 2 dígitos
        result += parts[i].slice(0, 2);
        if (parts[i].length >= 2 && parts.length === 1 && !cleaned.includes('/')) {
          result += '/';
        }
      } else if (i === 1) {
        // Mes: máximo 2 dígitos
        result += '/' + parts[i].slice(0, 2);
        if (parts[i].length >= 2 && parts.length === 2) {
          result += '/';
        }
      } else if (i === 2) {
        // Año: máximo 4 dígitos
        result += '/' + parts[i].slice(0, 4);
      }
    }
    
    return result;
  };

  // Manejar cambios en el input manual
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateInput(e.target.value);
    setDisplayValue(formatted);
    
    // Si el formato está completo, intentar parsear y navegar
    if (formatted.length === 10) {
      const [day, month, year] = formatted.split('/').map(Number);
      if (day && month && year && month >= 1 && month <= 12) {
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime()) && isValidDate(day, month - 1, year)) {
          setCurrentMonth(month - 1);
          setCurrentYear(year);
          setSelectedDate(date);
          // Usar el mismo formato manual que handleDateSelect para evitar problemas de zona horaria
          const isoDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          onChange(isoDate);
        }
      }
    }
  };

  // Manejar selección de mes
  const handleMonthSelect = (monthIndex: number) => {
    setCurrentMonth(monthIndex);
    setIsMonthDropdownOpen(false);
  };

  // Manejar edición de año
  const handleYearClick = () => {
    setIsYearEditing(true);
    setYearInputValue(currentYear.toString());
    setTimeout(() => {
      yearInputRef.current?.focus();
      yearInputRef.current?.select();
    }, 0);
  };

  const handleYearInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Solo números
    if (value.length <= 4) {
      setYearInputValue(value);
    }
  };

  const handleYearInputSubmit = () => {
    const year = parseInt(yearInputValue);
    const { minYear, maxYear } = getYearLimits();
    
    if (year >= minYear && year <= maxYear) {
      setCurrentYear(year);
    } else {
      setYearInputValue(currentYear.toString());
    }
    setIsYearEditing(false);
  };

  const handleYearInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleYearInputSubmit();
    } else if (e.key === 'Escape') {
      setYearInputValue(currentYear.toString());
      setIsYearEditing(false);
    }
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Días vacíos al inicio
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className={styles.emptyDay}></div>);
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDate && 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === currentMonth && 
        selectedDate.getFullYear() === currentYear;
      
      const isValid = isValidDate(day, currentMonth, currentYear);
      const todayUTC3 = getUTC3Date();
      const isToday = todayUTC3.toDateString() === new Date(currentYear, currentMonth, day).toDateString();

      days.push(
        <button
          key={day}
          type="button"
          className={`${styles.calendarDay} ${isSelected ? styles.selected : ''} ${!isValid ? styles.disabled : ''} ${isToday ? styles.today : ''}`}
          onClick={() => handleDateSelect(day)}
          disabled={!isValid}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const toggleCalendar = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`${styles.datePickerContainer} ${className}`} ref={containerRef}>
      {label && (
        <label className={styles.label}>{label}</label>
      )}
      
      <div className={`${styles.inputWrapper} ${error ? styles.error : ''} ${isOpen ? styles.focused : ''}`}>
        <Calendar size={18} className={styles.inputIcon} />
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onClick={toggleCalendar}
          className={`${styles.dateInput} ${error ? styles.inputError : ''}`}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={10}
        />
        <button
          type="button"
          className={styles.calendarButton}
          onClick={toggleCalendar}
          disabled={disabled}
        >
          <Calendar size={16} />
        </button>
      </div>

      {isOpen && (
        <div className={styles.calendarDropdown}>
          <div className={styles.calendarHeader}>
            <div className={styles.monthYearControls}>
              <button
                type="button"
                className={styles.navButton}
                onClick={handlePrevMonth}
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className={styles.monthYearDisplay}>
                <div className={styles.monthSelector}>
                  <button
                    type="button"
                    className={styles.monthButton}
                    onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                  >
                    {months[currentMonth]}
                  </button>
                  {isMonthDropdownOpen && (
                    <div className={styles.monthDropdown}>
                      {months.map((month, index) => (
                        <button
                          key={month}
                          type="button"
                          className={`${styles.monthOption} ${index === currentMonth ? styles.selected : ''}`}
                          onClick={() => handleMonthSelect(index)}
                        >
                          {month}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className={styles.yearControls}>
                  <button
                    type="button"
                    className={`${styles.yearButton} ${isYearAtLimit(-1) ? styles.disabled : ''}`}
                    onClick={() => handleYearChange(-1)}
                    disabled={isYearAtLimit(-1)}
                    title={isYearAtLimit(-1) ? 'Año mínimo alcanzado (1900)' : 'Año anterior'}
                  >
                    <ChevronLeft size={12} />
                  </button>
                  {isYearEditing ? (
                    <input
                      ref={yearInputRef}
                      type="text"
                      value={yearInputValue}
                      onChange={handleYearInputChange}
                      onBlur={handleYearInputSubmit}
                      onKeyDown={handleYearInputKeyDown}
                      className={styles.yearInput}
                      maxLength={4}
                    />
                  ) : (
                    <button
                      type="button"
                      className={styles.yearName}
                      onClick={handleYearClick}
                      title="Click para editar el año"
                    >
                      {currentYear}
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${styles.yearButton} ${isYearAtLimit(1) ? styles.disabled : ''}`}
                    onClick={() => handleYearChange(1)}
                    disabled={isYearAtLimit(1)}
                    title={isYearAtLimit(1) ? `Año máximo alcanzado (${getYearLimits().maxYear})` : 'Año siguiente'}
                  >
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
              
              <button
                type="button"
                className={styles.navButton}
                onClick={handleNextMonth}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className={styles.calendarGrid}>
            <div className={styles.weekDaysHeader}>
              {weekDays.map(day => (
                <div key={day} className={styles.weekDay}>{day}</div>
              ))}
            </div>
            <div className={styles.daysGrid}>
              {renderCalendarDays()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;

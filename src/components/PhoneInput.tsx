import React, { useState, useRef, useEffect } from 'react';
import { Phone, ChevronDown } from 'lucide-react';
import styles from './PhoneInput.module.scss';

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}

const countries: Country[] = [
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', dialCode: '+54' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', dialCode: '+1' },
  { code: 'MX', name: 'México', flag: '🇲🇽', dialCode: '+52' },
  { code: 'ES', name: 'España', flag: '🇪🇸', dialCode: '+34' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', dialCode: '+57' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪', dialCode: '+51' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', dialCode: '+56' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪', dialCode: '+58' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨', dialCode: '+593' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾', dialCode: '+598' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾', dialCode: '+595' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴', dialCode: '+591' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷', dialCode: '+55' },
  { code: 'FR', name: 'Francia', flag: '🇫🇷', dialCode: '+33' },
  { code: 'DE', name: 'Alemania', flag: '🇩🇪', dialCode: '+49' },
  { code: 'IT', name: 'Italia', flag: '🇮🇹', dialCode: '+39' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧', dialCode: '+44' },
];

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'Número de teléfono',
  disabled = false,
  error = false
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(() => countries.find((c) => c.code === 'AR') || countries[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Extraer el número de teléfono del valor completo
  useEffect(() => {
    if (value) {
      const country = countries.find(c => value.startsWith(c.dialCode));
      if (country) {
        setSelectedCountry(country);
        setPhoneNumber(value.substring(country.dialCode.length));
      } else {
        setPhoneNumber(value);
      }
    }
  }, [value]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    const fullNumber = phoneNumber ? `${country.dialCode}${phoneNumber}` : country.dialCode;
    onChange(fullNumber);
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value.replace(/[^\d]/g, ''); // Solo números
    setPhoneNumber(newNumber);
    const fullNumber = newNumber ? `${selectedCountry.dialCode}${newNumber}` : '';
    onChange(fullNumber);
  };

  const formatPhoneNumber = (number: string) => {
    // Formatear número según el país (ejemplo básico)
    if (selectedCountry.code === 'US' || selectedCountry.code === 'MX') {
      const cleaned = number.replace(/\D/g, '');
      const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
      if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
      }
    }
    return number;
  };

  return (
    <div className={`${styles.phoneInputContainer} ${className}`}>
      <div className={styles.inputWrapper}>
        <Phone size={18} className={styles.inputIcon} />
        
        {/* Selector de país */}
        <div className={styles.countrySelector} ref={dropdownRef}>
          <button
            type="button"
            className={`${styles.countryButton} ${error ? styles.error : ''}`}
            onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
            disabled={disabled}
          >
            <span className={styles.flag}>{selectedCountry.flag}</span>
            <span className={styles.dialCode}>{selectedCountry.dialCode}</span>
            <ChevronDown size={14} className={`${styles.chevron} ${isDropdownOpen ? styles.open : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownContent}>
                {countries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    className={`${styles.countryOption} ${selectedCountry.code === country.code ? styles.selected : ''}`}
                    onClick={() => handleCountrySelect(country)}
                  >
                    <span className={styles.flag}>{country.flag}</span>
                    <span className={styles.countryName}>{country.name}</span>
                    <span className={styles.dialCode}>{country.dialCode}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input del número */}
        <input
          type="tel"
          value={formatPhoneNumber(phoneNumber)}
          onChange={handlePhoneNumberChange}
          className={`${styles.phoneInput} ${error ? styles.inputError : ''}`}
          placeholder={placeholder}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default PhoneInput;

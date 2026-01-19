import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useStore } from '../store/useStore';
import authService from '../services/authService';
import PhoneInput from '../components/PhoneInput';
import DateInput from '../components/DateInput';
import styles from './Register.module.scss';
import { evaluatePassword, PASSWORD_REQUIREMENTS } from '../utils/passwordStrength';

const REGISTER_DRAFT_KEY = 'becard_register_draft_v1';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { setIsLoading, setError, isLoading, error, isAuthenticated } = useStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nombre: '',
    apellido: '',
    nombre_usuario: '',
    sexo: 'MASCULINO' as 'MASCULINO' | 'FEMENINO',
    telefono: '',
    fecha_nacimiento: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [verificationLink, setVerificationLink] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const passwordEval = useMemo(() => evaluatePassword(formData.password), [formData.password]);
  const strengthLabel = passwordEval.level === 'strong' ? 'Fuerte' : passwordEval.level === 'medium' ? 'Media' : 'Débil';
  const strengthPercent = Math.max(0, Math.min(100, Math.round((passwordEval.passedCount / passwordEval.total) * 100)));
  const goToLogin = () => navigate(`/login?registered=1&email=${encodeURIComponent(successEmail || formData.email || '')}`);
  const birthDateLimits = useMemo(() => {
    const today = new Date();
    const max = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    const yyyy = max.getFullYear();
    const mm = String(max.getMonth() + 1).padStart(2, '0');
    const dd = String(max.getDate()).padStart(2, '0');
    return { min: '1900-01-01', max: `${yyyy}-${mm}-${dd}` };
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(REGISTER_DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<typeof formData>;
      setFormData((prev) => ({
        ...prev,
        ...parsed,
        password: '',
        confirmPassword: '',
      }));
    } catch {
      sessionStorage.removeItem(REGISTER_DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      const draft = {
        email: formData.email,
        nombre: formData.nombre,
        apellido: formData.apellido,
        nombre_usuario: formData.nombre_usuario,
        sexo: formData.sexo,
        telefono: formData.telefono,
        fecha_nacimiento: formData.fecha_nacimiento,
      };
      sessionStorage.setItem(REGISTER_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      return;
    }
  }, [
    formData.apellido,
    formData.email,
    formData.fecha_nacimiento,
    formData.nombre,
    formData.nombre_usuario,
    formData.sexo,
    formData.telefono,
  ]);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'El email no es válido';
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 8) {
      errors.password = 'La contraseña debe tener al menos 8 caracteres';
    } else if (formData.password.length > 72) {
      errors.password = 'La contraseña no puede tener más de 72 caracteres';
    } else {
      const evalResult = evaluatePassword(formData.password);
      if (!evalResult.isValid) {
        const firstMissing = evalResult.requirements.find((r) => !r.passed);
        errors.password = firstMissing ? firstMissing.label : 'La contraseña no cumple con los requisitos';
      }
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    // Name validation
    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido';
    }
    
    if (!formData.apellido.trim()) {
      errors.apellido = 'El apellido es requerido';
    }
    
    // Username validation
    if (!formData.nombre_usuario.trim()) {
      errors.nombre_usuario = 'El nombre de usuario es requerido';
    } else if (formData.nombre_usuario.length < 3) {
      errors.nombre_usuario = 'El nombre de usuario debe tener al menos 3 caracteres';
    }
    
    // Phone validation (optional but if provided, should be valid)
    if (formData.telefono && formData.telefono.length > 0) {
      // Validar que tenga al menos el código de país + algunos dígitos
      if (!/^\+\d{1,4}\d{4,}$/.test(formData.telefono.replace(/\s/g, ''))) {
        errors.telefono = 'El teléfono no es válido';
      }
    }
    
    // Birth date validation (optional but if provided, should be valid)
    if (formData.fecha_nacimiento) {
      try {
        const [year, month, day] = formData.fecha_nacimiento.split('-').map(Number);
        const birthDate = new Date(year, (month || 1) - 1, day || 1);
        const today = new Date();
        
        if (isNaN(birthDate.getTime())) {
          errors.fecha_nacimiento = 'Fecha inválida';
        } else {
          const age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          const dayDiff = today.getDate() - birthDate.getDate();
          
          const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
          
          if (actualAge < 18) {
            errors.fecha_nacimiento = 'Debes ser mayor de 18 años';
          }
          
          if (birthDate > today) {
            errors.fecha_nacimiento = 'La fecha no puede ser futura';
          }
        }
      } catch {
        errors.fecha_nacimiento = 'Fecha inválida';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const registerData = {
        nombre_usuario: formData.nombre_usuario,
        email: formData.email,
        password: formData.password,
        nombres: formData.nombre,
        apellidos: formData.apellido,
        sexo: formData.sexo,
        fecha_nacimiento: formData.fecha_nacimiento || undefined,
        telefono: formData.telefono || undefined
      };

      const res = await authService.register(registerData);
      
      setRegistrationSuccess(true);
      setSuccessMessage(res.message || null);
      setSuccessEmail(formData.email);
      sessionStorage.removeItem(REGISTER_DRAFT_KEY);
      if (import.meta.env.DEV && res.verification_link) {
        setVerificationLink(res.verification_link);
      }
    } catch (error: any) {
      if (error.response?.status === 400 || error.response?.status === 422) {
        const errorData = error.response.data;
        if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            if (errorData.detail.includes('email')) {
              setError('Este email ya está registrado');
            } else if (errorData.detail.includes('username') || errorData.detail.includes('nombre_usuario')) {
              setError('Este nombre de usuario ya está en uso');
            } else if (errorData.detail.includes('password')) {
              setError('La contraseña no cumple con los requisitos mínimos');
            } else {
              setError(errorData.detail);
            }
          } else if (Array.isArray(errorData.detail)) {
            // Manejar errores de validación de Pydantic
            const errorMessages = errorData.detail.map((err: any) => {
              if (err.loc && err.msg) {
                const field = err.loc[err.loc.length - 1];
                return `${field}: ${err.msg}`;
              }
              return err.msg || 'Error de validación';
            });
            setError(errorMessages.join(', '));
          } else {
            setError('Error en los datos proporcionados');
          }
        } else {
          setError('Error en los datos proporcionados');
        }
      } else if (error.response?.status === 500) {
        setError('Error interno del servidor. Intenta nuevamente más tarde.');
      } else {
        setError('Error al registrar usuario. Verifica tu conexión e intenta nuevamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error de validación cuando el usuario empiece a escribir
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className={styles.registerContainer}>
      <div className={styles.registerCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Crear Cuenta</h1>
          <p className={styles.subtitle}>Únete a BeCard</p>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label htmlFor="nombre" className={styles.label}>
                Nombre *
              </label>
              <div className={styles.inputWrapper}>
                <User size={18} className={styles.inputIcon} />
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className={`${styles.input} ${validationErrors.nombre ? styles.inputError : ''}`}
                  placeholder="Tu nombre"
                  disabled={isLoading}
                />
              </div>
              {validationErrors.nombre && (
                <span className={styles.errorText}>{validationErrors.nombre}</span>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="apellido" className={styles.label}>
                Apellido *
              </label>
              <div className={styles.inputWrapper}>
                <User size={18} className={styles.inputIcon} />
                <input
                  type="text"
                  id="apellido"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleInputChange}
                  className={`${styles.input} ${validationErrors.apellido ? styles.inputError : ''}`}
                  placeholder="Tu apellido"
                  disabled={isLoading}
                />
              </div>
              {validationErrors.apellido && (
                <span className={styles.errorText}>{validationErrors.apellido}</span>
              )}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="nombre_usuario" className={styles.label}>
              Nombre de Usuario *
            </label>
            <div className={styles.inputWrapper}>
              <User size={18} className={styles.inputIcon} />
              <input
                type="text"
                id="nombre_usuario"
                name="nombre_usuario"
                value={formData.nombre_usuario}
                onChange={handleInputChange}
                className={`${styles.input} ${validationErrors.nombre_usuario ? styles.inputError : ''}`}
                placeholder="usuario123"
                disabled={isLoading}
              />
            </div>
            {validationErrors.nombre_usuario && (
              <span className={styles.errorText}>{validationErrors.nombre_usuario}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>
              Email *
            </label>
            <div className={styles.inputWrapper}>
              <Mail size={18} className={styles.inputIcon} />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`${styles.input} ${validationErrors.email ? styles.inputError : ''}`}
                placeholder="tu@email.com"
                disabled={isLoading}
              />
            </div>
            {validationErrors.email && (
              <span className={styles.errorText}>{validationErrors.email}</span>
            )}
          </div>

          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label htmlFor="telefono" className={styles.label}>
                Teléfono
              </label>
              <PhoneInput
                value={formData.telefono}
                onChange={(value) => setFormData(prev => ({ ...prev, telefono: value }))}
                placeholder="Número de teléfono"
                disabled={isLoading}
                error={!!validationErrors.telefono}
              />
              {validationErrors.telefono && (
                <span className={styles.errorText}>{validationErrors.telefono}</span>
              )}
            </div>

            <div className={styles.inputGroup}>
              <DateInput
                value={formData.fecha_nacimiento}
                onChange={(value) => setFormData(prev => ({ ...prev, fecha_nacimiento: value }))}
                label="Fecha de Nacimiento"
                disabled={isLoading}
                error={!!validationErrors.fecha_nacimiento}
                min={birthDateLimits.min}
                max={birthDateLimits.max}
              />
              {validationErrors.fecha_nacimiento && (
                <span className={styles.errorText}>{validationErrors.fecha_nacimiento}</span>
              )}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="sexo" className={styles.label}>
              Género *
            </label>
            <div className={styles.inputWrapper}>
              <User size={18} className={styles.inputIcon} />
              <select
                id="sexo"
                name="sexo"
                value={formData.sexo}
                onChange={(e) => setFormData(prev => ({ ...prev, sexo: e.target.value as 'MASCULINO' | 'FEMENINO' }))}
                className={`${styles.input} ${validationErrors.sexo ? styles.inputError : ''}`}
                disabled={isLoading}
              >
                <option value="MASCULINO">Masculino</option>
                <option value="FEMENINO">Femenino</option>
              </select>
            </div>
            {validationErrors.sexo && (
              <span className={styles.errorText}>{validationErrors.sexo}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.passwordLabelRow}>
              <label htmlFor="password" className={styles.label}>
                Contraseña *
              </label>
              <div className={styles.tooltipWrap}>
                <button type="button" className={styles.tooltipButton} aria-label="Requisitos de contraseña">
                  <Info size={14} />
                </button>
                <div className={styles.tooltip} role="tooltip">
                  <p className={styles.tooltipTitle}>La contraseña debe tener:</p>
                  <ul className={styles.tooltipList}>
                    {PASSWORD_REQUIREMENTS.map((req) => (
                      <li key={req.key}>{req.label}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`${styles.input} ${validationErrors.password ? styles.inputError : ''}`}
                placeholder="Mínimo 8 caracteres"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.passwordToggle}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {!!formData.password && (
              <div className={styles.strengthWrap} aria-live="polite">
                <div className={styles.strengthHeader}>
                  <span>Seguridad</span>
                  <span
                    className={
                      passwordEval.level === 'strong'
                        ? styles.strengthValueStrong
                        : passwordEval.level === 'medium'
                          ? styles.strengthValueMedium
                          : styles.strengthValueWeak
                    }
                  >
                    {strengthLabel}
                  </span>
                </div>
                <div className={styles.strengthBar} aria-hidden="true">
                  <div
                    className={`${styles.strengthBarFill} ${
                      passwordEval.level === 'strong'
                        ? styles.strengthFillStrong
                        : passwordEval.level === 'medium'
                          ? styles.strengthFillMedium
                          : styles.strengthFillWeak
                    }`}
                    style={{ width: `${strengthPercent}%` }}
                  />
                </div>
              </div>
            )}
            {validationErrors.password && (
              <span className={styles.errorText}>{validationErrors.password}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Confirmar Contraseña *
            </label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`${styles.input} ${validationErrors.confirmPassword ? styles.inputError : ''}`}
                placeholder="Repite tu contraseña"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={styles.passwordToggle}
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {validationErrors.confirmPassword && (
              <span className={styles.errorText}>{validationErrors.confirmPassword}</span>
            )}
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <div className={styles.footer}>
          <p>
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className={styles.link}>
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
      {registrationSuccess && (
        <div className={styles.successModalOverlay} role="dialog" aria-modal="true" aria-label="Registro exitoso">
          <div className={styles.successModal}>
            <div className={styles.successModalHeader}>
              <CheckCircle size={52} className={styles.successModalIcon} />
            </div>
            <h2 className={styles.successModalTitle}>Cuenta creada</h2>
            <p className={styles.successModalText}>
              {successMessage || 'Te enviamos un correo para verificar tu cuenta.'}
            </p>
            {successEmail && <p className={styles.successModalText}>Revisá tu correo: {successEmail}</p>}
            {verificationLink && (
              <p className={styles.successModalText}>
                <a href={verificationLink} className={styles.devLink}>
                  Abrir link de verificación (DEV)
                </a>
              </p>
            )}
            <div className={styles.successModalFooter}>
              <button type="button" className={styles.secondaryButton} onClick={() => setRegistrationSuccess(false)}>
                Seguir aquí
              </button>
              <button type="button" className={styles.submitButton} onClick={goToLogin}>
                Ir a iniciar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;

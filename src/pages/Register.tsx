import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import authService from '../services/authService';
import PhoneInput from '../components/PhoneInput';
import DateInput from '../components/DateInput';
import styles from './Register.module.scss';

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
        const birthDate = new Date(formData.fecha_nacimiento);
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
        fecha_nacimiento: formData.fecha_nacimiento ? new Date(formData.fecha_nacimiento).toISOString() : undefined,
        telefono: formData.telefono || undefined
      };

      const res = await authService.register(registerData);
      
      setRegistrationSuccess(true);
      if (import.meta.env.DEV && res.verification_link) {
        setVerificationLink(res.verification_link);
      }
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
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

  if (registrationSuccess) {
    return (
      <div className={styles.registerContainer}>
        <div className={styles.registerCard}>
          <div className={styles.successMessage}>
            <CheckCircle size={48} className={styles.successIcon} />
            <h2>¡Registro Exitoso!</h2>
            <p>Tu cuenta ha sido creada correctamente.</p>
            <p>Te enviamos un email para confirmar tu cuenta y poder iniciar sesión.</p>
            {verificationLink && (
              <a href={verificationLink} className={styles.devLink}>
                Abrir link de verificación (DEV)
              </a>
            )}
            <p>Serás redirigido al login en unos segundos...</p>
          </div>
        </div>
      </div>
    );
  }

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
                placeholder="dd/mm/aaaa"
                disabled={isLoading}
                error={!!validationErrors.fecha_nacimiento}
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
            <label htmlFor="password" className={styles.label}>
              Contraseña *
            </label>
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
    </div>
  );
};

export default Register;

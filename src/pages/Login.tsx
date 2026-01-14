import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import authService from '../services/authService';
import styles from './Login.module.scss';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setIsAuthenticated, setIsLoading, setError, isLoading, error, isAuthenticated } = useStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const registered = params.get('registered');
    const email = params.get('email');
    if (registered === '1') {
      setInfoMessage('Te registraste correctamente. Te enviamos un email para validar tu cuenta. Una vez confirmado, vas a poder iniciar sesión.');
      if (email) {
        setFormData(prev => ({ ...prev, email }));
      }
    }
  }, [location.search]);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Por favor ingresa un email válido';
    }
    
    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password.length > 72) {
      errors.password = 'La contraseña no puede tener más de 72 caracteres';
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
    setInfoMessage(null);
    setResendStatus(null);

    try {
      await authService.login(formData);
      
      // Obtener información del usuario actual
      const user = await authService.getCurrentUser();
      
      // Guardar usuario en localStorage y store
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      setIsAuthenticated(true);
      
      // Redirigir al dashboard
      navigate('/dashboard');
    } catch (error: any) {
      if (error.response?.status === 401) {
        setError('Email/usuario o contraseña incorrectos');
      } else if (error.response?.status === 403) {
        setError('Tu email todavía no está verificado.');
        setInfoMessage('Revisá tu correo para confirmar la cuenta. Si no lo recibiste, podés reenviarlo.');
      } else if (error.response?.status === 400) {
        setError('Usuario inactivo');
      } else {
        setError('Error al iniciar sesión. Intenta nuevamente.');
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

  const handleResendVerification = async () => {
    setResendStatus(null);
    const email = formData.email.trim();
    if (!email) {
      setResendStatus('Ingresá tu correo para reenviar la verificación.');
      return;
    }
    try {
      setIsLoading(true);
      const res = await authService.resendVerification(email);
      setResendStatus(res.message || 'Email de verificación reenviado.');
    } catch (err: any) {
      setResendStatus(err.response?.data?.detail || 'No se pudo reenviar el email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.lOgin}>
      <div className={styles.autoWrapper}>
        <img src="/images/mgpt85r7-rvnse0q.png" className={styles.beCardB1} alt="BeCard Logo" />
        <div className={styles.frame16}>
          <p className={styles.revolucionaTuCervece}>Revoluciona tu cervecería</p>
          <p className={styles.iniciaSesiN}>Inicia sesión</p>
          
          {error && (
            <div className={styles.errorAlert}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          {infoMessage && <div className={styles.infoAlert}>{infoMessage}</div>}
          {resendStatus && <div className={styles.infoAlert}>{resendStatus}</div>}

          <form onSubmit={handleSubmit} className={styles.frame82}>
            <div className={styles.input}>
              <p className={styles.titulo3}>
                <span className={styles.titulo}>Correo&nbsp;</span>
                <span className={styles.titulo2}>*</span>
              </p>
              <div className={styles.frame480956627}>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={styles.escribeAqui}
                  placeholder="Ingresa tu correo"
                  autoComplete="username"
                  disabled={isLoading}
                />
              </div>
              {validationErrors.email && (
                <span className={styles.errorText}>{validationErrors.email}</span>
              )}
            </div>

            <div className={styles.input}>
              <p className={styles.titulo3}>
                <span className={styles.titulo}>Contraseña&nbsp;</span>
                <span className={styles.titulo2}>*</span>
              </p>
              <div className={styles.frame480956627}>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={styles.escribeAqui}
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>
              {validationErrors.password && (
                <span className={styles.errorText}>{validationErrors.password}</span>
              )}
            </div>

            <div className={styles.frame84}>
              <button
                type="button"
                className={`${styles.frame83} ${rememberMe ? styles.checked : ''}`}
                onClick={() => setRememberMe(!rememberMe)}
                disabled={isLoading}
              >
                <img
                  src="/images/mgpt85r2-l6j2d80.svg"
                  className={styles.vuesaxLinearTickSqua}
                  alt="Checkbox"
                />
                <p className={styles.recuerdame}>Recuerdame</p>
              </button>
              <Link to="/forgot-password" className={styles.olvidasteTuContraseA}>
                Olvidaste tu contraseña?
              </Link>
            </div>

            <button type="submit" className={styles.button2} disabled={isLoading}>
              <p className={styles.button}>
                {isLoading ? 'Iniciando sesión...' : 'Ingresar'}
              </p>
            </button>
            {infoMessage && (
              <button type="button" className={styles.secondaryButton} onClick={handleResendVerification} disabled={isLoading}>
                Reenviar verificación
              </button>
            )}
          </form>

          <p className={styles.aNoTienesUnaCuentaCr}>
            ¿No tienes una cuenta?{' '}
            <Link to="/register">
              Crear cuenta
            </Link>
          </p>
        </div>

        <div className={styles.frame85}>
          <p className={styles.todosLosDerechosRese}>
            Todos los derechos reservados ©BeCard
          </p>
          <a className={styles.politicaDePrivacidad} href="#">
            Politica de Privacidad
          </a>
        </div>
      </div>
      <img src="/images/mgpt85r7-e0jc8bg.png" className={styles.rectangle115} alt="Beer Background" />
    </div>
  );
};

export default Login;

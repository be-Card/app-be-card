import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';
import styles from './ForgotPassword.module.scss';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [debugResetLink, setDebugResetLink] = useState<string | null>(null);

  const isEmailValid = useMemo(() => {
    if (!email.trim()) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setDebugResetLink(null);

    if (!isEmailValid) {
      setError('Por favor ingresa un correo válido');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await authService.forgotPassword(email.trim());
      setSuccessMessage(res.message || 'Revisá tu correo para continuar.');
      if (import.meta.env.DEV && res.reset_link) {
        setDebugResetLink(res.reset_link);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al solicitar el restablecimiento');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.screen}>
      <div className={styles.content}>
        <div className={styles.header}>
          <img src="/images/mgpt85r7-rvnse0q.png" className={styles.logo} alt="BeCard" />
          <div className={styles.titleBlock}>
            <p className={styles.title}>Restablecer tu contraseña</p>
            <p className={styles.subtitle}>
              Te enviaremos un link a tu correo para reestablecer tu contraseña.
            </p>
          </div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputBlock}>
            <p className={styles.label}>
              <span className={styles.labelText}>Correo electrónico&nbsp;</span>
              <span className={styles.required}>*</span>
            </p>
            <div className={styles.inputWrapper}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="Escribe tu correo..."
                disabled={isSubmitting}
                autoComplete="email"
              />
            </div>
          </div>

          <button type="submit" className={styles.button} disabled={isSubmitting}>
            Reestablecer Contraseña
          </button>

          {error && <div className={styles.error}>{error}</div>}
          {successMessage && <div className={styles.success}>{successMessage}</div>}
          {debugResetLink && (
            <a className={styles.debugLink} href={debugResetLink}>
              Abrir link de reset (DEV)
            </a>
          )}
        </form>

        <p className={styles.footer}>
          <span className={styles.footerText}>¿Ya tienes una cuenta?&nbsp;</span>
          <Link to="/login" className={styles.footerLink}>
            Inicia Sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;

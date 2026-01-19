import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';
import styles from './VerifyEmail.module.scss';

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = useMemo(() => (params.get('token') || '').trim(), [params]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [redirectIn, setRedirectIn] = useState<number | null>(null);
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const run = async () => {
      setError(null);
      setSuccessMessage(null);
      setRedirectIn(null);
      setResendStatus(null);

      if (!token || token.length < 10) {
        setError('Token inválido o faltante');
        return;
      }

      try {
        setIsSubmitting(true);
        const res = await authService.verifyEmail(token);
        setSuccessMessage(res.message || 'Email verificado correctamente.');
        setRedirectIn(3);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'No se pudo verificar el email');
      } finally {
        setIsSubmitting(false);
      }
    };

    run();
  }, [token]);

  useEffect(() => {
    if (redirectIn === null) return;
    if (redirectIn <= 0) {
      navigate('/login?verified=1', { replace: true });
      return;
    }
    const t = setTimeout(() => setRedirectIn((prev) => (prev === null ? null : prev - 1)), 1000);
    return () => clearTimeout(t);
  }, [navigate, redirectIn]);

  const handleResend = async () => {
    setResendStatus(null);
    const email = resendEmail.trim();
    if (!email) {
      setResendStatus('Ingresá tu correo para reenviar la verificación.');
      return;
    }
    try {
      setIsResending(true);
      const res = await authService.resendVerification(email);
      setResendStatus(res.message || 'Email de verificación reenviado.');
    } catch (err: any) {
      setResendStatus(err.response?.data?.detail || 'No se pudo reenviar el email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className={styles.screen}>
      <div className={styles.content}>
        <div className={styles.header}>
          <img src="/images/mgpt85r7-rvnse0q.png" className={styles.logo} alt="BeCard" />
          <div className={styles.titleBlock}>
            <p className={styles.title}>Confirmar cuenta</p>
            <p className={styles.subtitle}>
              {successMessage ? 'Listo. Te vamos a redirigir al login.' : 'Estamos verificando tu email.'}
            </p>
          </div>
        </div>

        {isSubmitting && <div className={styles.info}>Verificando...</div>}
        {error && <div className={styles.error}>{error}</div>}
        {successMessage && <div className={styles.success}>{successMessage}</div>}
        {successMessage && redirectIn !== null && (
          <div className={styles.info}>Redirigiendo en {redirectIn}s…</div>
        )}

        {error && (
          <div className={styles.resendBox}>
            <p className={styles.resendTitle}>¿Token expirado o no te llegó el email?</p>
            <p className={styles.info}>
              Ingresá tu correo y te reenviamos un nuevo link de verificación.
            </p>
            <div className={styles.resendRow}>
              <input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                className={styles.resendInput}
                placeholder="tu@email.com"
                disabled={isSubmitting || isResending}
              />
              <button
                type="button"
                className={styles.resendButton}
                onClick={handleResend}
                disabled={isSubmitting || isResending}
              >
                {isResending ? 'Reenviando…' : 'Reenviar'}
              </button>
            </div>
            {resendStatus && <div className={styles.info}>{resendStatus}</div>}
          </div>
        )}

        <p className={styles.footer}>
          <Link to="/login" className={styles.footerLink}>
            Ir al Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;

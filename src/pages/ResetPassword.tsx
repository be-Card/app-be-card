import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';
import styles from './ResetPassword.module.scss';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => token.trim().length > 10 && password.length > 0, [token, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!canSubmit) {
      setError('Completa el formulario para continuar');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await authService.resetPassword(token, password);
      setSuccessMessage(res.message || 'Contraseña actualizada.');
      setTimeout(() => navigate('/login'), 900);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al actualizar la contraseña');
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
            <p className={styles.title}>Crear nueva contraseña</p>
            <p className={styles.subtitle}>Ingresá una nueva contraseña para tu cuenta.</p>
          </div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputBlock}>
            <p className={styles.label}>
              <span className={styles.labelText}>Nueva contraseña&nbsp;</span>
              <span className={styles.required}>*</span>
            </p>
            <div className={styles.inputWrapper}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="Escribe tu nueva contraseña..."
                disabled={isSubmitting}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button type="submit" className={styles.button} disabled={isSubmitting}>
            Guardar contraseña
          </button>

          {error && <div className={styles.error}>{error}</div>}
          {successMessage && <div className={styles.success}>{successMessage}</div>}
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

export default ResetPassword;

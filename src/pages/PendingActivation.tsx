import React, { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Clock } from 'lucide-react';
import styles from './PendingActivation.module.scss';

const PendingActivation: React.FC = () => {
  const [params] = useSearchParams();
  const email = useMemo(() => (params.get('email') || '').trim(), [params]);

  useEffect(() => {
    document.title = 'Cuenta pendiente | BeCard';
  }, []);

  return (
    <div className={styles.screen}>
      <div className={styles.content}>
        <div className={styles.header}>
          <img src="/images/mgpt85r7-rvnse0q.png" className={styles.logo} alt="BeCard" />
          <div className={styles.titleBlock}>
            <div className={styles.titleRow}>
              <p className={styles.title}>Cuenta en proceso de habilitación</p>
              <span className={styles.statusPill}>
                <Clock size={14} />
                Pendiente
              </span>
            </div>
            <p className={styles.subtitle}>
              {email ? (
                <>
                  Tu cuenta <span className={styles.emailPill}>{email}</span> ya está verificada, pero todavía no tiene acceso
                  habilitado.
                </>
              ) : (
                <>Tu cuenta ya está verificada, pero todavía no tiene acceso habilitado.</>
              )}
            </p>
          </div>
        </div>

        <div className={styles.box}>
          <p className={styles.body}>
            Para finalizar el alta, el equipo de administración debe habilitar tu acceso y asociar tu cuenta al cliente
            correspondiente.
          </p>

          <div className={styles.callout}>
            <p className={styles.calloutTitle}>Qué podés hacer ahora</p>
            <ul className={styles.list}>
              <li>Esperar la confirmación de habilitación.</li>
              <li>Si necesitás acelerar el proceso, contactá a soporte indicando tu email y el nombre del cliente.</li>
            </ul>
          </div>
        </div>

        <div className={styles.footer}>
          <Link to="/login" className={styles.primaryLink}>
            Volver al login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PendingActivation;

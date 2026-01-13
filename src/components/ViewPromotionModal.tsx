import React from 'react';
import { CalendarDays, Clock, Percent, Tag, Target, X } from 'lucide-react';
import styles from './CreatePromotionModal.module.scss';
import { ReglaDePrecioBackend } from '../types';

interface ViewPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  promotion: ReglaDePrecioBackend | null;
  onEdit: (promotion: ReglaDePrecioBackend) => void;
  onSetActive: (promotionId: number, active: boolean) => void;
}

const toHHMM = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

const formatDaysForDisplay = (days: string[]): string => {
  const dayMap: Record<string, string> = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
    domingo: 'Domingo',
  };
  return days.map((d) => dayMap[d] || d).join(', ');
};

const ViewPromotionModal: React.FC<ViewPromotionModalProps> = ({
  isOpen,
  onClose,
  promotion,
  onEdit,
  onSetActive,
}) => {
  if (!isOpen || !promotion) return null;

  const dias = (() => {
    try {
      if (!promotion.dias_semana) return [];
      const parsed = JSON.parse(promotion.dias_semana);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const discountPct = Math.max(0, Math.round((1 - Number(promotion.multiplicador)) * 100));
  const horaInicio = toHHMM(promotion.fecha_hora_inicio);
  const horaFin = toHHMM(promotion.fecha_hora_fin);
  const diasLabel = dias.length ? formatDaysForDisplay(dias) : '—';
  const canActivate = !promotion.esta_activo;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Ver detalle de la Promoción</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <Tag className={styles.detailIcon} size={20} />
            <div className={styles.detailMeta}>
              <div className={styles.detailLabel}>Nombre de la regla</div>
              <div className={styles.detailValue}>{promotion.nombre}</div>
            </div>
          </div>

          <div className={styles.detailItem}>
            <Percent className={styles.detailIcon} size={20} />
            <div className={styles.detailMeta}>
              <div className={styles.detailLabel}>Descuento</div>
              <div className={styles.detailValue}>{discountPct}%</div>
            </div>
          </div>

          <div className={styles.detailItem}>
            <Target className={styles.detailIcon} size={20} />
            <div className={styles.detailMeta}>
              <div className={styles.detailLabel}>Alcance</div>
              <div className={styles.detailValue}>{promotion.alcance}</div>
            </div>
          </div>

          <div className={styles.detailItem}>
            <CalendarDays className={styles.detailIcon} size={20} />
            <div className={styles.detailMeta}>
              <div className={styles.detailLabel}>Días de la promoción</div>
              <div className={styles.detailValue}>{diasLabel}</div>
            </div>
          </div>

          <div className={styles.detailItem}>
            <Clock className={styles.detailIcon} size={20} />
            <div className={styles.detailMeta}>
              <div className={styles.detailLabel}>Hora Inicio</div>
              <div className={styles.detailValue}>{horaInicio || '—'}</div>
            </div>
          </div>

          <div className={styles.detailItem}>
            <Clock className={styles.detailIcon} size={20} />
            <div className={styles.detailMeta}>
              <div className={styles.detailLabel}>Hora Fin</div>
              <div className={styles.detailValue}>{horaFin || '—'}</div>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => onSetActive(promotion.id, canActivate)}
          >
            {canActivate ? 'Activar' : 'Desactivar'}
          </button>
          <button type="button" className={styles.submitButton} onClick={() => onEdit(promotion)}>
            Editar Promoción
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewPromotionModal;

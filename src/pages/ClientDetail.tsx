import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, User, Calendar, Mail, Phone, MapPin, Clock, Beer, BarChart3, CreditCard, ChevronLeft, ChevronRight, Star, Gift, QrCode, Wifi, UserX, UserCheck } from 'lucide-react';
import { Client, EditClientFormData, Order, PaymentMethod, ClientStats, ClientLoyalty, ClientRewardsResponse } from '../types';
import EditClientModal from '../components/EditClientModal';
import ConfirmationModal from '../components/ConfirmationModal';
import clientService from '../services/clientService';
import styles from './ClientDetail.module.scss';

const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loyalty, setLoyalty] = useState<ClientLoyalty | null>(null);
  const [rewardsData, setRewardsData] = useState<ClientRewardsResponse | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'history' | 'rewards' | 'payment'>('personal');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;



  useEffect(() => {
    const loadClientData = async () => {
      if (!id) {
        setError('ID de cliente no proporcionado');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const clientId = id;
        
        if (!clientId) {
          setError('ID de cliente no válido');
          setLoading(false);
          return;
        }
        
        // Cargar datos del cliente
        const clientResponse = await clientService.getClientById(clientId);
        setStats(clientResponse.stats);
        setLoyalty(clientResponse.loyalty);
        const clientData = clientService.convertDetailResponseToClient(clientResponse);
        setClient(clientData);
        
        // Cargar órdenes del cliente
        const ordersResponse = await clientService.getClientOrders(clientId);
        setOrders(ordersResponse.orders);
        
        // Cargar métodos de pago
        const paymentResponse = await clientService.getClientPaymentMethods(clientId);
        setPaymentMethods(paymentResponse.paymentMethods);

        const rewardsResponse = await clientService.getClientRewards(clientId);
        setRewardsData(rewardsResponse);
        
      } catch {
        setError('Error al cargar los datos del cliente');
      } finally {
        setLoading(false);
      }
    };
    
    loadClientData();
  }, [id]);

  const handleEditClient = async (formData: any) => {
    if (!client || !id) return;
    
    try {
      setLoading(true);
      const clientId = id;
      
      if (!clientId) {
        setError('ID de cliente no válido');
        setLoading(false);
        return;
      }
      
      const updateData: EditClientFormData = {
        name: `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || client.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        gender: formData.gender || undefined,
        birthDate: formData.birthDate || undefined,
      };

      const response = await clientService.updateClient(clientId, updateData);
      const updatedClient = clientService.convertDetailResponseToClient(response);
      setClient(updatedClient);
      
      setIsEditModalOpen(false);
    } catch {
      setError('Error al actualizar el cliente');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'Activo' ? '#299d58' : '#ed2c2c';
  };

  const confirmToggleClientStatus = async () => {
    if (!id) return;
    try {
      setLoading(true);
      await clientService.toggleClientStatus(id);
      const detail = await clientService.getClientById(id);
      setStats(detail.stats);
      setLoyalty(detail.loyalty);
      setClient(clientService.convertDetailResponseToClient(detail));
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'No se pudo actualizar el estado del cliente');
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className={styles.loading}>
        <h2>Cargando datos del cliente...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h2>Error</h2>
        <p>{error}</p>
        <Link to="/clients" className={styles.backLink}>
          <ArrowLeft size={16} />
          Volver a la lista
        </Link>
      </div>
    );
  }

  if (!client) {
    return (
      <div className={styles.notFound}>
        <h2>Cliente no encontrado</h2>
        <Link to="/clients" className={styles.backLink}>
          <ArrowLeft size={16} />
          Volver a la lista
        </Link>
      </div>
    );
  }

  const formatDate = (iso?: string | null) => {
    if (!iso) return 'No especificado';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'No especificado';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const formatDateTimeISO = (iso?: string | null) => {
    if (!iso) return 'No hay órdenes';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'No hay órdenes';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  };

  const lastOrderDate = orders.length > 0 ? orders[0].date : null;
  const totalOrders = stats?.totalOrders ?? client.totalOrders ?? 0;
  const totalSpent = Number(stats?.totalSpent ?? client.totalSpent ?? 0);
  const avgPerOrder = Number(stats?.averageOrderValue ?? (totalOrders ? totalSpent / totalOrders : 0));
  const points = loyalty?.currentPoints ?? client.loyaltyPoints ?? 0;
  const balance = Number(stats?.availableBalance ?? client.balance ?? 0);

  const pagedOrders = orders.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));

  const preferredPayment = (() => {
    const methods = paymentMethods.map((m) => (m.method || '').toLowerCase());
    if (methods.some((m) => m.includes('qr'))) return { label: 'QR', icon: <QrCode size={32} className={styles.preferenceIcon} /> };
    if (methods.some((m) => m.includes('nfc') || m.includes('rfid'))) return { label: 'NFC', icon: <Wifi size={32} className={styles.preferenceIcon} /> };
    if (methods.some((m) => m.includes('tarjeta'))) return { label: 'Tarjeta', icon: <CreditCard size={32} className={styles.preferenceIcon} /> };
    return { label: 'No especificado', icon: <CreditCard size={32} className={styles.preferenceIcon} /> };
  })();

  const handleRedeemReward = async (premioId: number) => {
    if (!id) return;
    try {
      setIsRedeeming(true);
      await clientService.redeemClientReward(id, premioId);
      const updated = await clientService.getClientRewards(id);
      setRewardsData(updated);
      const detail = await clientService.getClientById(id);
      setStats(detail.stats);
      setLoyalty(detail.loyalty);
      setClient(clientService.convertDetailResponseToClient(detail));
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'No se pudo canjear la recompensa');
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className={styles.clientDetail}>
      {/* Contenido Principal */}
      <div className={styles.mainContent}>
        {/* Breadcrumb y Botones de Acción */}
        <div className={styles.topSection}>
          <div className={styles.breadcrumbSection}>
            <Link to="/clients" className={styles.backButton}>
              <ArrowLeft size={18} />
            </Link>
            <div className={styles.breadcrumbText}>
              <h2 className={styles.pageTitle}>Perfil del Cliente</h2>
              <p className={styles.pageSubtitle}>Vista completa del cliente {client.name}</p>
            </div>
          </div>
          <div className={styles.actionButtons}>
            <button 
              className={styles.editButton}
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit size={20} />
              <span>Editar</span>
            </button>
            <button
              className={styles.deleteButton}
              onClick={() => setIsConfirmModalOpen(true)}
              type="button"
            >
              {client.status === 'Activo' ? <UserX size={20} /> : <UserCheck size={20} />}
              <span>{client.status === 'Activo' ? 'Desactivar' : 'Activar'}</span>
            </button>
          </div>
        </div>

        {/* Información Principal del Cliente */}
        <div className={styles.clientMainInfo}>
          <div className={styles.clientAvatar}>
            <span className={styles.avatarText}>
              {client.name ? client.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'C'}
            </span>
          </div>
          <div className={styles.clientBasicInfo}>
            <h1 className={styles.clientName}>{client.name}</h1>
            <div className={styles.clientBadges}>
              <div className={styles.levelBadge}>
                <span>{client.loyaltyLevel}</span>
              </div>
              <div
                className={styles.statusBadge}
                style={{
                  color: getStatusColor(client.status),
                  borderColor: getStatusColor(client.status),
                  backgroundColor: `${getStatusColor(client.status)}1a`,
                }}
              >
                <span>{client.status}</span>
              </div>
            </div>
            <p className={styles.joinDate}>Cliente desde {formatDate(client.joinDate)}</p>
          </div>
          <div className={styles.clientStats}>
            <div className={styles.statCard}>
              <p className={styles.statValue}>${totalSpent.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
              <p className={styles.statLabel}>Gasto Total</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statValue}>{totalOrders}</p>
              <p className={styles.statLabel}>Visitas</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statValue}>
                ${Math.round(avgPerOrder).toLocaleString('es-AR')}
              </p>
              <p className={styles.statLabel}>Promedio/Visita</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statValue}>{points}</p>
              <p className={styles.statLabel}>Puntos</p>
            </div>
          </div>
        </div>

        {/* Pestañas de Navegación */}
        <div className={styles.tabsContainer}>
          <button 
            className={`${styles.tab} ${activeTab === 'personal' ? styles.active : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            Datos Personales
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Historial
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'rewards' ? styles.active : ''}`}
            onClick={() => setActiveTab('rewards')}
          >
            Recompensas
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'payment' ? styles.active : ''}`}
            onClick={() => setActiveTab('payment')}
          >
            Métodos de Pago
          </button>
        </div>

        {/* Contenido de la Pestaña Activa */}
        {activeTab === 'personal' && (
          <div className={styles.tabContent}>
            {/* Información Personal */}
            <div className={styles.personalInfoSection}>
              <h3 className={styles.sectionTitle}>Información Personal</h3>
              <div className={styles.personalInfoGrid}>
                <div className={styles.personalInfoColumn}>
                  <div className={styles.infoItem}>
                    <User size={24} className={styles.infoIcon} />
                    <div className={styles.infoContent}>
                      <p className={styles.infoLabel}>Edad y Sexo</p>
                      <p className={styles.infoValue}>
                        {client.age ? `${client.age} años` : 'No especificado'} • {client.gender || 'No especificado'}
                      </p>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <Calendar size={24} className={styles.infoIcon} />
                    <div className={styles.infoContent}>
                      <p className={styles.infoLabel}>Fecha de Nacimiento</p>
                      <p className={styles.infoValue}>{formatDate(client.birthDate)}</p>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <Mail size={24} className={styles.infoIcon} />
                    <div className={styles.infoContent}>
                      <p className={styles.infoLabel}>Email</p>
                      <p className={styles.infoValue}>{client.email || 'No especificado'}</p>
                    </div>
                  </div>
                </div>
                <div className={styles.personalInfoColumn}>
                  <div className={styles.infoItem}>
                    <Phone size={24} className={styles.infoIcon} />
                    <div className={styles.infoContent}>
                      <p className={styles.infoLabel}>Teléfono</p>
                      <p className={styles.infoValue}>{client.phone || 'No especificado'}</p>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <MapPin size={24} className={styles.infoIcon} />
                    <div className={styles.infoContent}>
                      <p className={styles.infoLabel}>Dirección</p>
                      <p className={styles.infoValue}>{client.address || 'No especificado'}</p>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <Clock size={24} className={styles.infoIcon} />
                    <div className={styles.infoContent}>
                      <p className={styles.infoLabel}>Última Orden</p>
                      <p className={styles.infoValue}>{formatDateTimeISO(lastOrderDate)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Preferencias y Estadísticas */}
            <div className={styles.preferencesSection}>
              <h3 className={styles.sectionTitle}>Preferencias y Estadísticas</h3>
              <div className={styles.preferencesGrid}>
                <div className={styles.preferenceCard}>
                  <Beer size={40} className={styles.preferenceIcon} />
                  <div className={styles.preferenceContent}>
                    <p className={styles.preferenceLabel}>Cerveza Favorita</p>
                    <p className={styles.preferenceValue}>{stats?.favoriteStyle || 'No especificado'}</p>
                    <p className={styles.preferenceDetail}>Estilo: {stats?.favoriteStyle || 'N/A'}</p>
                  </div>
                </div>
                <div className={styles.preferenceCard}>
                  <BarChart3 size={40} className={styles.preferenceIcon} />
                  <div className={styles.preferenceContent}>
                    <p className={styles.preferenceLabel}>Frecuencia de Visita</p>
                    <p className={styles.preferenceValue}>{totalOrders >= 8 ? 'Semanal' : totalOrders >= 4 ? 'Quincenal' : 'Mensual'}</p>
                    <p className={styles.preferenceDetail}>Promedio mensual: {Math.max(0, Math.round(totalOrders))} visitas</p>
                  </div>
                </div>
                <div className={styles.preferenceCard}>
                  {preferredPayment.icon}
                  <div className={styles.preferenceContent}>
                    <p className={styles.preferenceLabel}>Método de Pago Preferido</p>
                    <p className={styles.preferenceValue}>{preferredPayment.label}</p>
                    <p className={styles.preferenceDetail}>Basado en métodos disponibles</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.balanceSection}>
              <h3 className={styles.sectionTitle}>Saldo Disponible</h3>
              <div className={styles.balanceCard}>
                <p className={styles.balanceValue}>${Math.round(balance).toLocaleString('es-AR')}</p>
                <p className={styles.balanceHint}>
                  {stats?.balanceUpdatedAt ? `Última recarga: ${formatDateTimeISO(stats.balanceUpdatedAt)}` : 'Última recarga: sin datos'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pestaña Historial */}
        {activeTab === 'history' && (
          <div className={styles.tabContent}>
            <div className={styles.historySection}>
              <h3 className={styles.sectionTitle}>Historial de Consumo</h3>
              
              {/* Tabla de Historial */}
              <div className={styles.historyTable}>
                {/* Header de la tabla */}
                <div className={styles.tableHeader}>
                  <div className={styles.headerCell}>Fecha</div>
                  <div className={styles.headerCell}>Cerveza</div>
                  <div className={styles.headerCell}>Cantidad</div>
                  <div className={styles.headerCell}>Precio</div>
                  <div className={styles.headerCell}>Método</div>
                </div>
                
                {/* Separador */}
                <div className={styles.tableSeparator}></div>
                
                {/* Filas de datos */}
                {orders.length > 0 ? pagedOrders.map((order, index) => (
                  <React.Fragment key={order.id}>
                    <div className={styles.tableRow}>
                      <div className={styles.tableCell}>{formatDateTimeISO(order.date)}</div>
                      <div className={styles.tableCell}>{order.beerName || 'Productos varios'}</div>
                      <div className={styles.tableCell}>{order.quantity ? `${order.quantity}ml` : '—'}</div>
                      <div className={styles.tableCell}>${Number(order.amount || 0).toLocaleString('es-AR')}</div>
                      <div className={styles.tableCell}>
                        <div className={styles.methodBadge}>
                          <span>{order.paymentMethod || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    {index < pagedOrders.length - 1 && <div className={styles.tableSeparator}></div>}
                  </React.Fragment>
                )) : (
                  <div className={styles.noData}>
                    <p>No hay órdenes registradas</p>
                  </div>
                )}
                
                {/* Paginación */}
                {orders.length > 0 && (
                  <div className={styles.pagination}>
                    <span className={styles.paginationInfo}>
                      Mostrando {pagedOrders.length} de {orders.length} datos
                    </span>
                    <div className={styles.paginationControls}>
                      <button
                        className={styles.paginationButton}
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        type="button"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className={styles.paginationCurrent}>{currentPage}</span>
                      <button
                        className={styles.paginationButton}
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        type="button"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pestaña Recompensas */}
        {activeTab === 'rewards' && (
          <div className={styles.tabContent}>
            <div className={styles.rewardsSection}>
              {/* Header del Programa de Fidelización */}
              <div className={styles.loyaltyHeader}>
                <h3 className={styles.sectionTitle}>Programa de Fidelización</h3>
                <div className={styles.pointsSection}>
                  <div className={styles.pointsInfo}>
                    <Star size={24} className={styles.starIcon} />
                    <span className={styles.pointsText}>{rewardsData?.currentPoints ?? points} puntos disponibles</span>
                  </div>
                  <div className={styles.clientLevelBadge}>
                    <span>{rewardsData?.level ?? client.loyaltyLevel}</span>
                  </div>
                </div>
              </div>

              <h4 className={styles.rewardsTitle}>Recompensas Disponibles</h4>
              <div className={styles.rewardsGrid}>
                {(rewardsData?.available || []).length > 0 ? (
                  rewardsData!.available.map((reward) => (
                    <div key={`available-${reward.id}`} className={styles.rewardCard}>
                      <div className={styles.rewardIcon}>
                        <Gift size={32} />
                      </div>
                      <div className={styles.rewardContent}>
                        <div className={styles.availableBadge}>
                          <span>Disponible</span>
                        </div>
                        <h5 className={styles.rewardTitle}>{reward.name}</h5>
                        <p className={styles.rewardPoints}>{reward.pointsCost} puntos</p>
                      </div>
                      <button
                        className={styles.redeemButton}
                        onClick={() => handleRedeemReward(reward.id)}
                        disabled={isRedeeming || (rewardsData?.currentPoints ?? 0) < reward.pointsCost}
                        type="button"
                      >
                        Canjear
                      </button>
                    </div>
                  ))
                ) : (
                  <div className={styles.noData}>
                    <p>No hay recompensas disponibles</p>
                  </div>
                )}
              </div>

              <h4 className={styles.rewardsTitle}>Historial</h4>
              <div className={styles.rewardsGrid}>
                {(rewardsData?.history || []).length > 0 ? (
                  rewardsData!.history.map((reward) => (
                    <div key={`history-${reward.id}-${reward.redeemedDate || ''}`} className={styles.rewardCard}>
                      <div className={styles.rewardIcon}>
                        <Gift size={32} />
                      </div>
                      <div className={styles.rewardContent}>
                        <div className={styles.availableBadge}>
                          <span>{reward.redeemedDate ? `Canjeado ${formatDate(reward.redeemedDate)}` : reward.status}</span>
                        </div>
                        <h5 className={styles.rewardTitle}>{reward.name}</h5>
                        <p className={styles.rewardPoints}>{reward.pointsCost} puntos</p>
                      </div>
                      <button className={styles.redeemButton} disabled type="button">
                        Canjear
                      </button>
                    </div>
                  ))
                ) : (
                  <div className={styles.noData}>
                    <p>No hay canjes registrados</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pestaña Métodos de Pago */}
        {activeTab === 'payment' && (
          <div className={styles.tabContent}>
            <div className={styles.paymentSection}>
              <h3 className={styles.sectionTitle}>Métodos de Pago Vinculados</h3>
              
              {/* Grid de Métodos de Pago */}
              <div className={styles.paymentMethodsGrid}>
                {paymentMethods.length > 0 ? paymentMethods.map((method) => (
                  <div key={method.id} className={styles.paymentMethodCard}>
                    <div className={styles.paymentMethodHeader}>
                      <div className={styles.paymentStatusBadge}>
                        <span>{method.active ? 'Activo' : 'Inactivo'}</span>
                      </div>
                    </div>
                    <div className={styles.paymentMethodContent}>
                      <h4 className={styles.paymentMethodName}>{method.provider || method.method}</h4>
                      <p className={styles.paymentMethodType}>{method.method}</p>
                    </div>
                    <div className={styles.paymentMethodFooter}>
                      <p className={styles.lastUsed}>
                        Último uso: {method.lastUsed ? formatDate(method.lastUsed) : 'Sin registros'}
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className={styles.noData}>
                    <p>No hay métodos de pago configurados</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Edición */}
      <EditClientModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        client={client}
        onSave={handleEditClient}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmToggleClientStatus}
        title={client.status === 'Activo' ? 'Desactivar Cliente' : 'Activar Cliente'}
        message={
          client.status === 'Activo'
            ? '¿Estás seguro de que quieres desactivar este cliente? Esta acción cambiará su estado a inactivo.'
            : '¿Estás seguro de que quieres activar este cliente? Esta acción cambiará su estado a activo.'
        }
        confirmText={client.status === 'Activo' ? 'Desactivar' : 'Activar'}
        cancelText="Cancelar"
        type={client.status === 'Activo' ? 'danger' : 'info'}
        clientName={client.name}
      />
    </div>
  );
};

export default ClientDetail;

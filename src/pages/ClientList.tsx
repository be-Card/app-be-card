import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, Edit, Mail, Phone, ChevronDown, UserPlus, Crown, Medal, Award, AlertCircle, UserX, UserCheck } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Client } from '../types';
import AddClientModal from '../components/AddClientModal';
import EditClientModal from '../components/EditClientModal';
import ConfirmationModal from '../components/ConfirmationModal';
import clientService from '../services/clientService';
import styles from './ClientList.module.scss';

// Tipo local que coincide con el formulario del modal (claves en inglés)
type EditModalFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  gender: string;
  birthDate: string;
};

const ClientList: React.FC = () => {
  const navigate = useNavigate();
  const { clients, setClients } = useStore();
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalClients, setTotalClients] = useState(0);
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const itemsPerPage = 10;
  const getPaginationItems = (current: number, total: number): Array<number | 'ellipsis'> => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (current <= 4) {
      return [1, 2, 3, 4, 5, 'ellipsis', total];
    }

    if (current >= total - 3) {
      return [1, 'ellipsis', total - 4, total - 3, total - 2, total - 1, total];
    }

    return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
  };

  useEffect(() => {
    loadClients();
  }, [currentPage, searchTerm, levelFilter, statusFilter]);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await clientService.getClients({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        loyalty_level: levelFilter || undefined,
        status: statusFilter || undefined,
      });
      
      // Convertir los datos del backend al formato del frontend
      const convertedClients = response.clients.map(client => 
        clientService.convertSummaryToClient(client)
      );
      
      setClients(convertedClients);
      setFilteredClients(convertedClients);
      setTotalClients(response.pagination?.total ?? convertedClients.length);
      setAvailableLevels(response.filters?.loyaltyLevels ?? []);
      setAvailableStatuses(response.filters?.statusOptions ?? ['Activo', 'Inactivo']);
    } catch {
      setError('Error al cargar los clientes');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${mi}` };
  };

  const handleAddClient = async (clientData: any) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await clientService.addClient(clientData);
      
      // Recargar la lista de clientes
      await loadClients();
      
      setIsAddModalOpen(false);
    } catch (error: any) {
      setError(error.message || 'Error al agregar el cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Oro': return '#FFD700';
      case 'Plata': return '#C0C0C0';
      case 'Bronce': return '#CD7F32';
      default: return '#6B7280';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'Oro': return <Crown size={16} />;
      case 'Plata': return <Medal size={16} />;
      case 'Bronce': return <Award size={16} />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'Activo' ? '#10B981' : '#EF4444';
  };

  const handleViewClient = (clientId: number | string) => {
    navigate(`/clients/${clientId}`);
  };

  // Cargar el detalle completo antes de abrir el modal
  const handleEditClient = async (client: Client) => {
    try {
      setIsLoading(true);
      const response = await clientService.getClientById(String(client.id));
      const fullClient = clientService.convertDetailResponseToClient(response);
      setSelectedClient(fullClient);
    } catch {
      setSelectedClient(client);
    } finally {
      setIsLoading(false);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveEditedClient = async (editedData: EditModalFormData) => {
    if (!selectedClient) {
      setError('No hay cliente seleccionado para editar');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const clientId = String(selectedClient.id);
      if (!clientId) {
        throw new Error('El cliente seleccionado no tiene un ID válido');
      }

      await clientService.updateClient(clientId, {
        name: `${editedData.firstName} ${editedData.lastName}`.trim(),
        email: editedData.email,
        phone: editedData.phone || undefined,
        address: editedData.address || undefined,
        gender: editedData.gender || undefined,
        birthDate: editedData.birthDate || undefined,
      });
      
      // Recargar la lista de clientes
      await loadClients();
      
      setIsEditModalOpen(false);
      setSelectedClient(null);
    } catch (error: any) {
      setError(error.message || 'Error al actualizar el cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClient = (clientId: number | string) => {
    const client = clients.find(c => String(c.id) === String(clientId));
    if (client) {
      setClientToDelete(client);
      setIsConfirmModalOpen(true);
    }
  };

  const confirmDeleteClient = async () => {
    if (!clientToDelete) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const clientId = String(clientToDelete.id);
      if (!clientId) {
        throw new Error('ID de cliente no válido: ID es undefined o null');
      }
      
      await clientService.toggleClientStatus(clientId);
      
      // Recargar la lista de clientes
      await loadClients();
    } catch (error: any) {
      setError(error.message || 'Error al eliminar el cliente');
    } finally {
      setIsLoading(false);
      setIsConfirmModalOpen(false);
      setClientToDelete(null);
    }
  };

  const totalPages = Math.ceil(totalClients / itemsPerPage);

  return (
    <div className={styles.clientsPage}>
      {/* Content */}
      <div className={styles.content}>
        {/* Error Message */}
        {error && (
          <div className={styles.errorAlert}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Top Controls */}
        <div className={styles.topControls}>
          {/* Search */}
          <div className={styles.searchContainer}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Level Filter */}
          <div className={styles.filterContainer}>
            <Filter size={18} className={styles.filterIcon} />
            <select 
              value={levelFilter} 
              onChange={(e) => setLevelFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">Todos los niveles</option>
              {availableLevels.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterContainer}>
            <Filter size={18} className={styles.filterIcon} />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">Todos los estados</option>
              {availableStatuses.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Add Button */}
          <button 
            className={styles.addButton}
            onClick={() => setIsAddModalOpen(true)}
            disabled={isLoading}
          >
            <UserPlus size={20} />
            Agregar Cliente
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <span>Cargando clientes...</span>
          </div>
        )}

        {/* Table */}
        {!isLoading && (
          <div className={styles.tableContainer}>
            <table className={styles.clientsTable}>
              <thead>
                <tr className={styles.tableHeader}>
                  <th className={styles.headerCell}>Cliente</th>
                  <th className={styles.headerCell}>Contacto</th>
                  <th className={styles.headerCell}>Nivel</th>
                  <th className={styles.headerCell}>Último Consumo</th>
                  <th className={styles.headerCell}>Gasto Total</th>
                  <th className={styles.headerCell}>Saldo</th>
                  <th className={styles.headerCell}>Estado</th>
                  <th className={styles.headerCell}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={styles.emptyState}>
                      {searchTerm || levelFilter || statusFilter 
                        ? 'No se encontraron clientes con los filtros aplicados'
                        : 'No hay clientes registrados'
                      }
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      className={styles.tableRow}
                      onClick={() => handleViewClient(client.id)}
                    >
                      <td className={styles.tableCell}>
                        <span className={styles.clientName}>{client.name}</span>
                      </td>
                      <td className={styles.tableCell}>
                        <div className={styles.contactInfo}>
                          <div className={styles.contactItem}>
                            <Mail size={15} className={styles.contactIcon} />
                            <span className={styles.contactText}>{client.email}</span>
                          </div>
                          {client.phone && (
                            <div className={styles.contactItem}>
                              <Phone size={15} className={styles.contactIcon} />
                              <span className={styles.contactText}>{client.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className={styles.tableCell}>
                        <div 
                          className={styles.levelBadge}
                          style={{ 
                            borderColor: getLevelColor(client.loyaltyLevel),
                            backgroundColor: `${getLevelColor(client.loyaltyLevel)}1a`,
                            color: getLevelColor(client.loyaltyLevel)
                          }}
                        >
                          {getLevelIcon(client.loyaltyLevel)}
                          <span>{client.loyaltyLevel}</span>
                        </div>
                      </td>
                      <td className={styles.tableCell}>
                        <div className={styles.consumptionInfo}>
                          {(() => {
                            const dt = formatDateTime(client.lastOrder);
                            if (!dt) {
                              return <span className={styles.consumptionDate}>Sin consumos</span>;
                            }
                            return (
                              <>
                                <span className={styles.consumptionDate}>{dt.date}</span>
                                <span className={styles.consumptionTime}>{dt.time}</span>
                              </>
                            );
                          })()}
                        </div>
                      </td>
                      <td className={styles.tableCell}>
                        <div className={styles.spentInfo}>
                          <span className={styles.spentAmount}>${(client.totalSpent || 0).toLocaleString()}</span>
                          <span className={styles.spentVisits}>{client.totalOrders || 0} visitas</span>
                        </div>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={styles.balance}>
                          ${Number(client.balance || 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </td>
                      <td className={styles.tableCell}>
                        <div 
                          className={styles.statusBadge}
                          style={{ 
                            borderColor: getStatusColor(client.status),
                            backgroundColor: `${getStatusColor(client.status)}1a`,
                            color: getStatusColor(client.status)
                          }}
                        >
                          {client.status}
                        </div>
                      </td>
                      <td className={styles.tableCell}>
                        <div className={styles.actions}>
                          <button 
                            className={styles.actionButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewClient(client.id);
                            }}
                            title="Ver detalles"
                          >
                            <Eye size={20} />
                          </button>
                          <button 
                            className={styles.actionButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClient(client);
                            }}
                            title="Editar cliente"
                          >
                            <Edit size={20} />
                          </button>
                          <button 
                            className={styles.actionButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClient(client.id);
                            }}
                            title={client.status === 'Activo' ? 'Desactivar cliente' : 'Activar cliente'}
                          >
                            {client.status === 'Activo' ? <UserX size={20} /> : <UserCheck size={20} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <span className={styles.paginationInfo}>
                  Mostrando {filteredClients.length} de {totalClients} clientes
                </span>
                <div className={styles.paginationControls}>
                  <button 
                    className={styles.paginationButton}
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronDown size={18} style={{ transform: 'rotate(90deg)' }} />
                  </button>
                  
                  {getPaginationItems(currentPage, totalPages).map((item, idx) => {
                    if (item === 'ellipsis') {
                      return (
                        <span key={`ellipsis-${idx}`} className={styles.paginationEllipsis}>
                          …
                        </span>
                      );
                    }

                    return (
                      <button
                        key={item}
                        className={`${styles.paginationButton} ${currentPage === item ? styles.active : ''}`}
                        onClick={() => setCurrentPage(item)}
                      >
                        {item}
                      </button>
                    );
                  })}
                  
                  <button 
                    className={styles.paginationButton}
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronDown size={18} style={{ transform: 'rotate(-90deg)' }} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddClient}
      />

      <EditClientModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedClient(null);
        }}
        onSave={handleSaveEditedClient}
        client={selectedClient}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setClientToDelete(null);
        }}
        onConfirm={confirmDeleteClient}
        title={clientToDelete?.status === 'Activo' ? 'Desactivar Cliente' : 'Activar Cliente'}
        message={
          clientToDelete?.status === 'Activo'
            ? '¿Estás seguro de que quieres desactivar este cliente? Esta acción cambiará su estado a inactivo.'
            : '¿Estás seguro de que quieres activar este cliente? Esta acción cambiará su estado a activo.'
        }
        confirmText={clientToDelete?.status === 'Activo' ? 'Desactivar' : 'Activar'}
        cancelText="Cancelar"
        type={clientToDelete?.status === 'Activo' ? 'danger' : 'info'}
        clientName={clientToDelete?.name}
      />
    </div>
  );
};

export default ClientList;

import React, { useEffect, useMemo, useState } from 'react';
import styles from './AdminPanel.module.scss';
import adminService, { AdminTenantPaymentRow, AdminTenantRow, AdminUserRow } from '../services/adminService';

type TabKey = 'tenants' | 'users';

const paymentStatusLabel = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s === 'paid') return 'Pagado';
  if (s === 'pending') return 'Pendiente';
  if (s === 'failed') return 'Fallido';
  if (s === 'refunded') return 'Reintegrado';
  return status;
};

const paymentMethodLabel = (method: string) => {
  const m = (method || '').toLowerCase();
  if (m === 'cash') return 'Efectivo';
  if (m === 'transfer') return 'Transferencia';
  if (m === 'card') return 'Tarjeta';
  if (m === 'mercadopago') return 'Mercado Pago';
  if (m === 'other') return 'Otro';
  return method;
};

const AdminPanel: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('tenants');
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [onlyInactive, setOnlyInactive] = useState(false);
  const [onlyPendingActivation, setOnlyPendingActivation] = useState(false);
  const [onlyUnverified, setOnlyUnverified] = useState(false);

  const [usersLoading, setUsersLoading] = useState(false);
  const [users, setUsers] = useState<AdminUserRow[]>([]);

  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [tenants, setTenants] = useState<AdminTenantRow[]>([]);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignUser, setAssignUser] = useState<AdminUserRow | null>(null);
  const [assignTenantSearch, setAssignTenantSearch] = useState('');
  const [assignTenantsLoading, setAssignTenantsLoading] = useState(false);
  const [assignTenants, setAssignTenants] = useState<AdminTenantRow[]>([]);
  const [assignTenantId, setAssignTenantId] = useState<number | ''>('');
  const [assignRole, setAssignRole] = useState<'member' | 'owner'>('member');
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [payments, setPayments] = useState<AdminTenantPaymentRow[]>([]);
  const [paymentsTenant, setPaymentsTenant] = useState<AdminTenantRow | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount_centavos: 0,
    currency: 'ARS',
    months: 1,
    status: 'paid',
    payment_method: 'transfer',
    notes: '',
  });
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const openPayments = async (tenant: AdminTenantRow) => {
    setPaymentsTenant(tenant);
    setPaymentsOpen(true);
    setPaymentsLoading(true);
    setError(null);
    setPayments([]);
    setPaymentForm({
      amount_centavos: Math.max(0, Number(tenant.suscripcion_precio_centavos || 0)),
      currency: (tenant.suscripcion_moneda || 'ARS').toUpperCase(),
      months: 1,
      status: 'paid',
      payment_method: 'transfer',
      notes: '',
    });
    try {
      const res = await adminService.listTenantPayments(tenant.id);
      setPayments(res.payments);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'No se pudieron cargar los pagos');
    } finally {
      setPaymentsLoading(false);
    }
  };

  const closePayments = () => {
    setPaymentsOpen(false);
    setPaymentsTenant(null);
    setPayments([]);
  };

  const centsToMoney = (cents: number, currency: string) => {
    const n = Number.isFinite(cents) ? cents : 0;
    const value = n / 100;
    try {
      return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency || 'ARS' }).format(value);
    } catch {
      return `${value.toFixed(2)} ${(currency || 'ARS').toUpperCase()}`;
    }
  };

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    nombre: '',
    slug_base: '',
    owner_email: '',
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const canCreate = useMemo(() => {
    return createForm.nombre.trim().length > 0 && createForm.owner_email.trim().length > 0;
  }, [createForm.nombre, createForm.owner_email]);

  const [createAssignOpen, setCreateAssignOpen] = useState(false);
  const [createAssignUser, setCreateAssignUser] = useState<AdminUserRow | null>(null);
  const [createAssignForm, setCreateAssignForm] = useState({ nombre: '', slug_base: '' });
  const [createAssignSubmitting, setCreateAssignSubmitting] = useState(false);
  const canCreateAssign = useMemo(() => {
    return createAssignForm.nombre.trim().length > 0 && !!createAssignUser?.email;
  }, [createAssignForm.nombre, createAssignUser]);

  const loadTenants = async () => {
    setTenantsLoading(true);
    setError(null);
    try {
      const res = await adminService.listTenants({
        search: search.trim() || undefined,
        activo: onlyInactive ? false : undefined,
        skip: 0,
        limit: 200,
      });
      setTenants(res.tenants);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'No se pudo cargar clientes');
    } finally {
      setTenantsLoading(false);
    }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    setError(null);
    try {
      const res = await adminService.listUsers({
        search: search.trim() || undefined,
        activo: onlyPendingActivation ? undefined : onlyInactive ? false : undefined,
        verificado: onlyUnverified ? false : undefined,
        pending_activation: onlyPendingActivation ? true : undefined,
        skip: 0,
        limit: 200,
      });
      setUsers(res.users);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'No se pudo cargar usuarios');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'tenants') {
      loadTenants();
      return;
    }
    loadUsers();
  }, [tab]);

  useEffect(() => {
    if (tab === 'tenants') {
      loadTenants();
      return;
    }
    loadUsers();
  }, [tab, onlyInactive, onlyPendingActivation, onlyUnverified]);

  useEffect(() => {
    if (tab !== 'users') return;
    setOnlyPendingActivation(false);
    setOnlyUnverified(false);
  }, [tab]);

  const handleRefresh = async () => {
    if (tab === 'tenants') return loadTenants();
    return loadUsers();
  };

  const handleToggleTenant = async (tenant: AdminTenantRow) => {
    setError(null);
    try {
      await adminService.setTenantActive(tenant.id, !tenant.activo);
      await loadTenants();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'No se pudo actualizar el cliente');
    }
  };

  const handleRenewTenant = async (tenant: AdminTenantRow, months: number) => {
    setError(null);
    try {
      await adminService.renewTenantSubscription(tenant.id, months);
      await loadTenants();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'No se pudo renovar la suscripción');
    }
  };

  const handleSuspendTenant = async (tenant: AdminTenantRow) => {
    setError(null);
    try {
      await adminService.setTenantSubscription(tenant.id, { suscripcion_estado: 'suspendida' });
      await adminService.setTenantActive(tenant.id, false);
      await loadTenants();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'No se pudo suspender el cliente');
    }
  };

  const handleCreatePayment = async () => {
    if (!paymentsTenant || paymentSubmitting) return;
    setPaymentSubmitting(true);
    setError(null);
    try {
      await adminService.createTenantPayment(paymentsTenant.id, {
        amount_centavos: Number(paymentForm.amount_centavos || 0),
        currency: (paymentForm.currency || 'ARS').toUpperCase(),
        months: Number(paymentForm.months || 1),
        status: paymentForm.status,
        payment_method: paymentForm.payment_method,
        notes: paymentForm.notes?.trim() || undefined,
      });
      await loadTenants();
      const res = await adminService.listTenantPayments(paymentsTenant.id);
      setPayments(res.payments);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'No se pudo registrar el pago');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleUpdatePaymentStatus = async (paymentId: number, status: string) => {
    if (!paymentsTenant) return;
    setError(null);
    try {
      const nextStatus = (status || '').trim().toLowerCase();
      await adminService.updatePayment(paymentId, {
        status: nextStatus,
        refunded_at: nextStatus === 'refunded' ? new Date().toISOString() : null,
      });
      const res = await adminService.listTenantPayments(paymentsTenant.id);
      setPayments(res.payments);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'No se pudo actualizar el pago');
    }
  };

  const handleToggleUser = async (user: AdminUserRow) => {
    setError(null);
    try {
      await adminService.setUserActive(user.id, !user.activo);
      await loadUsers();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'No se pudo actualizar el usuario');
    }
  };

  const handleCreateTenant = async () => {
    if (!canCreate || createSubmitting) return;
    setCreateSubmitting(true);
    setError(null);
    try {
      await adminService.createTenantAndAssignOwner({
        nombre: createForm.nombre.trim(),
        slug_base: createForm.slug_base.trim() || undefined,
        owner_email: createForm.owner_email.trim(),
        owner_rol: 'owner',
        activo: true,
      });
      setCreateForm({ nombre: '', slug_base: '', owner_email: '' });
      setCreateOpen(false);
      setTab('tenants');
      await loadTenants();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'No se pudo crear el cliente');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const openCreateAndAssign = (userRow: AdminUserRow) => {
    setCreateAssignOpen(true);
    setCreateAssignUser(userRow);
    setCreateAssignForm({ nombre: '', slug_base: '' });
    setError(null);
  };

  const closeCreateAndAssign = () => {
    setCreateAssignOpen(false);
    setCreateAssignUser(null);
    setCreateAssignForm({ nombre: '', slug_base: '' });
  };

  const handleCreateAndAssign = async () => {
    if (!canCreateAssign || createAssignSubmitting || !createAssignUser) return;
    setCreateAssignSubmitting(true);
    setError(null);
    try {
      await adminService.createTenantAndAssignOwner({
        nombre: createAssignForm.nombre.trim(),
        slug_base: createAssignForm.slug_base.trim() || undefined,
        owner_email: createAssignUser.email,
        owner_rol: 'owner',
        activo: true,
      });
      await loadUsers();
      await loadTenants();
      closeCreateAndAssign();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'No se pudo crear el cliente y asignar el usuario');
    } finally {
      setCreateAssignSubmitting(false);
    }
  };

  const openAssign = async (userRow: AdminUserRow) => {
    setAssignOpen(true);
    setAssignUser(userRow);
    setAssignTenantSearch('');
    setAssignTenantId('');
    setAssignRole('member');
    setError(null);
    setAssignTenants([]);
    setAssignTenantsLoading(true);
    try {
      const res = await adminService.listTenants({ skip: 0, limit: 200, activo: true });
      setAssignTenants(res.tenants);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'No se pudieron cargar clientes');
    } finally {
      setAssignTenantsLoading(false);
    }
  };

  const closeAssign = () => {
    setAssignOpen(false);
    setAssignUser(null);
    setAssignTenants([]);
    setAssignTenantId('');
    setAssignRole('member');
  };

  const searchAssignTenants = async () => {
    setAssignTenantsLoading(true);
    setError(null);
    try {
      const res = await adminService.listTenants({
        skip: 0,
        limit: 200,
        activo: true,
        search: assignTenantSearch.trim() || undefined,
      });
      setAssignTenants(res.tenants);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'No se pudieron cargar clientes');
    } finally {
      setAssignTenantsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!assignUser || !assignTenantId || assignSubmitting) return;
    setAssignSubmitting(true);
    setError(null);
    try {
      await adminService.addUserToTenant(assignTenantId, {
        user_email: assignUser.email,
        rol: assignRole,
      });
      await loadUsers();
      closeAssign();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'No se pudo asignar el usuario al cliente');
    } finally {
      setAssignSubmitting(false);
    }
  };

  return (
    <div className={styles.admin}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Panel de Admin</h1>
          <p className={styles.subtitle}>Gestioná usuarios, clientes y suscripciones</p>
        </div>

        <div className={styles.actions}>
          <button className={styles.secondaryButton} onClick={handleRefresh}>
            Actualizar
          </button>
          <button className={styles.primaryButton} onClick={() => setCreateOpen((v) => !v)}>
            Crear cliente
          </button>
        </div>
      </div>

      {createOpen && (
        <div className={styles.createBox}>
          <div className={styles.createRow}>
            <label className={styles.label}>Nombre</label>
            <input
              className={styles.input}
              value={createForm.nombre}
              onChange={(e) => setCreateForm((p) => ({ ...p, nombre: e.target.value }))}
              placeholder="Humulus Bar"
            />
          </div>
          <div className={styles.createRow}>
            <label className={styles.label}>Slug (opcional)</label>
            <input
              className={styles.input}
              value={createForm.slug_base}
              onChange={(e) => setCreateForm((p) => ({ ...p, slug_base: e.target.value }))}
              placeholder="humulus"
            />
          </div>
          <div className={styles.createRow}>
            <label className={styles.label}>Email dueño</label>
            <input
              className={styles.input}
              value={createForm.owner_email}
              onChange={(e) => setCreateForm((p) => ({ ...p, owner_email: e.target.value }))}
              placeholder="dueno@bar.com"
            />
          </div>
          <div className={styles.createActions}>
            <button className={styles.secondaryButton} onClick={() => setCreateOpen(false)}>
              Cancelar
            </button>
            <button
              className={styles.primaryButton}
              onClick={handleCreateTenant}
              disabled={!canCreate || createSubmitting}
            >
              {createSubmitting ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </div>
      )}

      <div className={styles.filters}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'tenants' ? styles.activeTab : ''}`}
            onClick={() => setTab('tenants')}
          >
            Clientes
          </button>
          <button
            className={`${styles.tab} ${tab === 'users' ? styles.activeTab : ''}`}
            onClick={() => setTab('users')}
          >
            Usuarios
          </button>
        </div>

        <div className={styles.searchRow}>
          <input
            className={styles.input}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
          />
          <button className={styles.secondaryButton} onClick={handleRefresh}>
            Buscar
          </button>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={onlyInactive}
              onChange={(e) => {
                const checked = e.target.checked;
                setOnlyInactive(checked);
                if (checked) {
                  setOnlyPendingActivation(false);
                }
              }}
            />
            Ver solo inactivos
          </label>
          {tab === 'users' && (
            <>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={onlyPendingActivation}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setOnlyPendingActivation(checked);
                    if (checked) {
                      setOnlyInactive(false);
                      setOnlyUnverified(false);
                    }
                  }}
                />
                Pendientes de habilitación
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={onlyUnverified}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setOnlyUnverified(checked);
                    if (checked) {
                      setOnlyPendingActivation(false);
                    }
                  }}
                />
                No verificados
              </label>
            </>
          )}
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {tab === 'tenants' && (
        <div className={styles.tableWrap}>
          {tenantsLoading ? (
            <div className={styles.loading}>Cargando clientes...</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Slug</th>
                  <th>Owners</th>
                  <th>Miembros</th>
                  <th>Suscripción</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id}>
                    <td>{t.nombre}</td>
                    <td className={styles.mono}>{t.slug}</td>
                    <td>{t.owner_emails.join(', ') || '-'}</td>
                    <td>{t.members_count}</td>
                    <td>
                      <div className={styles.subBlock}>
                        <div>
                          <span className={`${styles.badge} ${styles.badgeInfo}`}>{t.suscripcion_plan}</span>
                          <span
                            className={`${styles.badge} ${
                              t.suscripcion_estado === 'activa' ? styles.badgeOk : styles.badgeWarn
                            }`}
                          >
                            {t.suscripcion_estado}
                          </span>
                        </div>
                        <div className={styles.subDates}>
                          <span>
                            Precio: {centsToMoney(t.suscripcion_precio_centavos || 0, t.suscripcion_moneda || 'ARS')}
                          </span>
                          <span>Período: {t.suscripcion_periodo_dias || 30} días</span>
                          {typeof t.dias_restantes === 'number' && (
                            <span>
                              Días restantes: {t.dias_restantes} {t.en_gracia ? '(gracia)' : ''}
                            </span>
                          )}
                          {t.suscripcion_hasta ? (
                            <span>Hasta: {new Date(t.suscripcion_hasta).toLocaleDateString()}</span>
                          ) : (
                            <span>Hasta: -</span>
                          )}
                          {t.suscripcion_gracia_hasta ? (
                            <span>Gracia: {new Date(t.suscripcion_gracia_hasta).toLocaleDateString()}</span>
                          ) : (
                            <span>Gracia: -</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${t.activo ? styles.badgeOk : styles.badgeOff}`}>
                        {t.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className={styles.actionsCell}>
                      <div className={styles.actionGroup}>
                        <button className={styles.linkButton} onClick={() => handleRenewTenant(t, 1)}>
                          Renovar +1 mes
                        </button>
                        <button className={styles.linkButton} onClick={() => handleRenewTenant(t, 3)}>
                          Renovar +3 meses
                        </button>
                        <button className={styles.linkButton} onClick={() => openPayments(t)}>
                          Pagos
                        </button>
                        <button className={styles.linkButton} onClick={() => handleToggleTenant(t)}>
                          {t.activo ? 'Deshabilitar' : 'Habilitar'}
                        </button>
                        <button className={styles.linkButtonDanger} onClick={() => handleSuspendTenant(t)}>
                          Suspender
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan={7} className={styles.empty}>
                      No hay clientes para mostrar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'users' && (
        <div className={styles.tableWrap}>
          {usersLoading ? (
            <div className={styles.loading}>Cargando usuarios...</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Nombre</th>
                  <th>Roles</th>
                  <th>Clientes</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>
                      {(u.nombres || '').trim() || '-'} {(u.apellidos || '').trim()}
                    </td>
                    <td>{u.roles.join(', ') || '-'}</td>
                    <td>{u.tenants.map((t) => t.slug).join(', ') || '-'}</td>
                    <td>
                      <span className={`${styles.badge} ${u.activo ? styles.badgeOk : styles.badgeOff}`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                      {!u.verificado && <span className={`${styles.badge} ${styles.badgeWarn}`}>No verificado</span>}
                      {u.tenants.length === 0 && <span className={`${styles.badge} ${styles.badgeWarn}`}>Sin cliente</span>}
                    </td>
                    <td className={styles.actionsCell}>
                      <div className={styles.actionGroup}>
                        {u.tenants.length === 0 && (
                          <button className={styles.linkButtonAccent} onClick={() => openCreateAndAssign(u)}>
                            Crear cliente y asignar
                          </button>
                        )}
                        <button className={styles.linkButton} onClick={() => openAssign(u)}>
                          Asignar cliente
                        </button>
                        <button className={styles.linkButton} onClick={() => handleToggleUser(u)}>
                          {u.activo ? 'Deshabilitar' : 'Habilitar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className={styles.empty}>
                      No hay usuarios para mostrar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {assignOpen && assignUser && (
        <div className={styles.modalOverlay} onClick={closeAssign}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalTitle}>Asignar usuario a cliente</div>
                <div className={styles.modalSubtitle}>
                  {assignUser.email} · {(assignUser.nombres || '').trim()} {(assignUser.apellidos || '').trim()}
                </div>
              </div>
              <button className={styles.secondaryButton} onClick={closeAssign}>
                Cerrar
              </button>
            </div>

            <div className={styles.modalSection}>
              <div className={styles.modalSectionTitle}>Cliente</div>
              <div className={styles.formRow}>
                <input
                  className={styles.input}
                  value={assignTenantSearch}
                  onChange={(e) => setAssignTenantSearch(e.target.value)}
                  placeholder="Buscar cliente por nombre o slug..."
                />
                <button className={styles.secondaryButton} onClick={searchAssignTenants} disabled={assignTenantsLoading}>
                  {assignTenantsLoading ? 'Buscando...' : 'Buscar'}
                </button>
              </div>

              {assignTenantsLoading ? (
                <div className={styles.loading}>Cargando clientes...</div>
              ) : (
                <div className={styles.formRow}>
                  <label className={styles.label}>Seleccionar</label>
                  <select
                    className={styles.select}
                    value={assignTenantId}
                    onChange={(e) => setAssignTenantId(e.target.value ? Number(e.target.value) : '')}
                  >
                    <option value="">Elegí un cliente...</option>
                    {assignTenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre} ({t.slug})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className={styles.modalSection}>
              <div className={styles.modalSectionTitle}>Rol</div>
              <div className={styles.formRow}>
                <label className={styles.label}>Permiso</label>
                <select
                  className={styles.select}
                  value={assignRole}
                  onChange={(e) => setAssignRole((e.target.value as 'member' | 'owner') || 'member')}
                >
                  <option value="member">Miembro</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.primaryButton} onClick={handleAssign} disabled={!assignTenantId || assignSubmitting}>
                {assignSubmitting ? 'Asignando...' : 'Asignar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {createAssignOpen && createAssignUser && (
        <div className={styles.modalOverlay} onClick={closeCreateAndAssign}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalTitle}>Crear cliente y asignar</div>
                <div className={styles.modalSubtitle}>Owner: {createAssignUser.email}</div>
              </div>
              <button className={styles.secondaryButton} onClick={closeCreateAndAssign}>
                Cerrar
              </button>
            </div>

            <div className={styles.modalSection}>
              <div className={styles.modalSectionTitle}>Datos del cliente</div>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Nombre</label>
                  <input
                    className={styles.input}
                    value={createAssignForm.nombre}
                    onChange={(e) => setCreateAssignForm((p) => ({ ...p, nombre: e.target.value }))}
                    placeholder="Humulus Bar"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Slug (opcional)</label>
                  <input
                    className={styles.input}
                    value={createAssignForm.slug_base}
                    onChange={(e) => setCreateAssignForm((p) => ({ ...p, slug_base: e.target.value }))}
                    placeholder="humulus"
                  />
                </div>
              </div>
              <div className={styles.helperText}>
                Se crea el cliente con suscripción inicial y se asigna el usuario como owner.
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.secondaryButton} onClick={closeCreateAndAssign} disabled={createAssignSubmitting}>
                Cancelar
              </button>
              <button
                className={styles.primaryButton}
                onClick={handleCreateAndAssign}
                disabled={!canCreateAssign || createAssignSubmitting}
              >
                {createAssignSubmitting ? 'Creando...' : 'Crear y asignar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentsOpen && paymentsTenant && (
        <div className={styles.modalOverlay} onClick={closePayments}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalTitle}>Pagos</div>
                <div className={styles.modalSubtitle}>
                  {paymentsTenant.nombre} ({paymentsTenant.slug})
                </div>
              </div>
              <button className={styles.secondaryButton} onClick={closePayments}>
                Cerrar
              </button>
            </div>

            <div className={styles.modalSection}>
              <div className={styles.modalSectionTitle}>Registrar pago</div>
              <div className={styles.formRow}>
                <label className={styles.label}>Monto</label>
                <input
                  className={styles.input}
                  type="number"
                  value={paymentForm.amount_centavos}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, amount_centavos: Number(e.target.value) }))}
                />
              </div>
              <div className={styles.formRow}>
                <label className={styles.label}>Estado</label>
                <select
                  className={styles.select}
                  value={paymentForm.status}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, status: e.target.value }))}
                >
                  <option value="paid">Pagado</option>
                  <option value="pending">Pendiente</option>
                  <option value="failed">Fallido</option>
                  <option value="refunded">Reintegrado</option>
                </select>
              </div>
              <div className={styles.formRow}>
                <label className={styles.label}>Método</label>
                <select
                  className={styles.select}
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, payment_method: e.target.value }))}
                >
                  <option value="transfer">Transferencia</option>
                  <option value="cash">Efectivo</option>
                  <option value="card">Tarjeta</option>
                  <option value="mercadopago">Mercado Pago</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div className={styles.formRow}>
                <label className={styles.label}>Moneda</label>
                <input
                  className={styles.input}
                  value={paymentForm.currency}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, currency: e.target.value }))}
                />
              </div>
              <div className={styles.formRow}>
                <label className={styles.label}>Meses</label>
                <input
                  className={styles.input}
                  type="number"
                  value={paymentForm.months}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, months: Number(e.target.value) }))}
                />
              </div>
              <div className={styles.formRow}>
                <label className={styles.label}>Notas</label>
                <textarea
                  className={styles.textarea}
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Opcional"
                />
              </div>
              <div className={styles.modalActions}>
                <button className={styles.primaryButton} onClick={handleCreatePayment} disabled={paymentSubmitting}>
                  {paymentSubmitting ? 'Registrando...' : 'Registrar pago'}
                </button>
              </div>
            </div>

            <div className={styles.modalSection}>
              <div className={styles.modalSectionTitle}>Historial</div>
              {paymentsLoading ? (
                <div className={styles.loading}>Cargando pagos...</div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Monto</th>
                      <th>Periodo</th>
                      <th>Método</th>
                      <th>Estado</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td>{new Date(p.paid_at).toLocaleString()}</td>
                        <td className={styles.mono}>{centsToMoney(p.amount_centavos, p.currency)}</td>
                        <td>
                          {(p.period_start && new Date(p.period_start).toLocaleDateString()) || '-'} →{' '}
                          {(p.period_end && new Date(p.period_end).toLocaleDateString()) || '-'}
                        </td>
                        <td>{p.payment_method ? paymentMethodLabel(p.payment_method) : '-'}</td>
                        <td>{paymentStatusLabel(p.status)}</td>
                        <td className={styles.actionsCell}>
                          <select
                            className={styles.miniSelect}
                            value={p.status}
                            onChange={(e) => handleUpdatePaymentStatus(p.id, e.target.value)}
                          >
                            <option value="paid">Pagado</option>
                            <option value="pending">Pendiente</option>
                            <option value="failed">Fallido</option>
                            <option value="refunded">Reintegrado</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {payments.length === 0 && (
                      <tr>
                        <td colSpan={6} className={styles.empty}>
                          Sin pagos registrados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;

import api from './api';

export interface AdminTenantBrief {
  id: number;
  nombre: string;
  slug: string;
  activo: boolean;
  rol: string;
}

export interface AdminUserRow {
  id: number;
  id_ext: string;
  nombre_usuario?: string | null;
  email: string;
  nombres?: string | null;
  apellidos?: string | null;
  activo: boolean;
  verificado: boolean;
  roles: string[];
  tenants: AdminTenantBrief[];
}

export interface AdminUsersResponse {
  users: AdminUserRow[];
  total: number;
  skip: number;
  limit: number;
}

export interface AdminTenantRow {
  id: number;
  id_ext: string;
  nombre: string;
  slug: string;
  activo: boolean;
  suscripcion_plan: string;
  suscripcion_estado: string;
  suscripcion_hasta?: string | null;
  suscripcion_gracia_hasta?: string | null;
  suscripcion_precio_centavos: number;
  suscripcion_moneda: string;
  suscripcion_periodo_dias: number;
  dias_restantes?: number | null;
  en_gracia?: boolean;
  members_count: number;
  owner_emails: string[];
}

export interface AdminTenantsResponse {
  tenants: AdminTenantRow[];
  total: number;
  skip: number;
  limit: number;
}

export interface AdminTenantPaymentRow {
  id: number;
  id_ext: string;
  amount_centavos: number;
  currency: string;
  status: string;
  paid_at: string;
  payment_method?: string | null;
  notes?: string | null;
  failure_reason?: string | null;
  refunded_at?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  provider?: string | null;
  provider_payment_id?: string | null;
}

export interface AdminTenantPaymentsResponse {
  payments: AdminTenantPaymentRow[];
}

const adminService = {
  listUsers: async (params: {
    skip?: number;
    limit?: number;
    search?: string;
    activo?: boolean;
    verificado?: boolean;
    pending_activation?: boolean;
    has_tenant?: boolean;
  }) => {
    const res = await api.get<AdminUsersResponse>('/admin/users', { params });
    return res.data;
  },

  setUserActive: async (userId: number, activo: boolean) => {
    await api.patch(`/admin/users/${userId}/active`, { activo });
  },

  listTenants: async (params: { skip?: number; limit?: number; search?: string; activo?: boolean }) => {
    const res = await api.get<AdminTenantsResponse>('/admin/tenants', { params });
    return res.data;
  },

  setTenantActive: async (tenantId: number, activo: boolean) => {
    await api.patch(`/admin/tenants/${tenantId}/active`, { activo });
  },

  renewTenantSubscription: async (tenantId: number, months: number = 1) => {
    await api.post(`/admin/tenants/${tenantId}/subscription/renew`, { months });
  },

  setTenantSubscription: async (
    tenantId: number,
    payload: {
      suscripcion_plan?: string;
      suscripcion_estado?: string;
      suscripcion_hasta?: string | null;
      suscripcion_gracia_hasta?: string | null;
      suscripcion_ultima_cobranza?: string | null;
      suscripcion_precio_centavos?: number;
      suscripcion_moneda?: string;
      suscripcion_periodo_dias?: number;
    }
  ) => {
    await api.patch(`/admin/tenants/${tenantId}/subscription`, payload);
  },

  listTenantPayments: async (tenantId: number) => {
    const res = await api.get<AdminTenantPaymentsResponse>(`/admin/tenants/${tenantId}/payments`);
    return res.data;
  },

  createTenantPayment: async (
    tenantId: number,
    payload: {
      amount_centavos: number;
      currency: string;
      months: number;
      paid_at?: string;
      status?: string;
      payment_method?: string;
      notes?: string;
      failure_reason?: string;
      provider?: string;
      provider_payment_id?: string;
    }
  ) => {
    const res = await api.post<{ payment_id: number; period_end?: string | null }>(
      `/admin/tenants/${tenantId}/payments`,
      payload
    );
    return res.data;
  },

  updatePayment: async (
    paymentId: number,
    payload: {
      status?: string;
      payment_method?: string | null;
      notes?: string | null;
      failure_reason?: string | null;
      refunded_at?: string | null;
    }
  ) => {
    await api.patch(`/admin/payments/${paymentId}`, payload);
  },

  createTenantAndAssignOwner: async (payload: {
    nombre: string;
    slug_base?: string;
    owner_email: string;
    owner_rol?: string;
    activo?: boolean;
  }) => {
    const res = await api.post<{ id: number; id_ext: string; nombre: string; slug: string }>(
      '/tenants/admin',
      payload
    );
    return res.data;
  },

  addUserToTenant: async (tenantId: number, payload: { user_email: string; rol: string }) => {
    await api.post(`/tenants/admin/${tenantId}/members`, payload);
  },
};

export default adminService;

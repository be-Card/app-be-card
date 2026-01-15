export const getRoleNames = (user: any): string[] => {
  const roles = user?.roles;
  if (!Array.isArray(roles)) return [];

  if (roles.length === 0) return [];

  if (typeof roles[0] === 'string') {
    return roles
      .map((r: any) => (typeof r === 'string' ? r.trim().toLowerCase() : ''))
      .filter(Boolean);
  }

  return roles
    .map((r: any) => {
      const name =
        r?.tipo_rol_usuario?.nombre ??
        r?.tipo_rol_usuario?.tipo ??
        r?.tipo ??
        r?.nombre ??
        r?.name;
      return typeof name === 'string' ? name.trim().toLowerCase() : '';
    })
    .filter(Boolean);
};

export const isSuperAdminUser = (user: any): boolean => {
  const names = getRoleNames(user);
  return names.includes('superadmin');
};

export const isAdminUser = (user: any): boolean => {
  const names = getRoleNames(user);
  return names.includes('admin') || names.includes('administrador') || isSuperAdminUser(user);
};

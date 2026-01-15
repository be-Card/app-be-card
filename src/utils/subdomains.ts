export const CLIENTS_APP_URL =
  (import.meta.env.VITE_CLIENTS_APP_URL as string | undefined) ?? 'https://clientes.becard.com.ar';

export const ADMIN_APP_URL =
  (import.meta.env.VITE_ADMIN_APP_URL as string | undefined) ?? 'https://admin.becard.com.ar';

export const isBecardHosted = (): boolean => window.location.hostname.endsWith('becard.com.ar');

export const isAdminHost = (): boolean => isBecardHosted() && window.location.hostname.startsWith('admin.');

export const isClientsHost = (): boolean => isBecardHosted() && window.location.hostname.startsWith('clientes.');

export const redirectToClients = (path: string = '/'): void => {
  const target = new URL(path, CLIENTS_APP_URL).toString();
  window.location.replace(target);
};

export const redirectSuperadminToAdminWithTokens = (): boolean => {
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) return false;

  const refreshToken = localStorage.getItem('refresh_token') ?? '';

  const hash = new URLSearchParams();
  hash.set('access_token', accessToken);
  if (refreshToken) {
    hash.set('refresh_token', refreshToken);
  }

  const target = `${ADMIN_APP_URL}/auth-redirect#${hash.toString()}`;
  window.location.replace(target);
  return true;
};


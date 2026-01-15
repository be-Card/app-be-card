import React, { useEffect } from 'react';
import { redirectToClients, isAdminHost } from '../utils/subdomains';

const AuthRedirect: React.FC = () => {
  useEffect(() => {
    if (!isAdminHost()) {
      redirectToClients('/login');
      return;
    }

    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const accessToken = params.get('access_token') ?? '';
    const refreshToken = params.get('refresh_token') ?? '';

    if (!accessToken) {
      redirectToClients('/login');
      return;
    }

    localStorage.setItem('access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }

    window.history.replaceState(null, '', window.location.pathname);
    window.location.replace('/admin');
  }, []);

  return null;
};

export default AuthRedirect;


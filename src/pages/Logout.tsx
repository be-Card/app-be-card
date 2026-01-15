import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { isAdminHost, redirectToClients } from '../utils/subdomains';

const Logout: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useStore();

  useEffect(() => {
    logout();
    if (isAdminHost()) {
      redirectToClients('/logout');
      return;
    }
    window.location.replace('/login');
  }, []);

  return null;
};

export default Logout;

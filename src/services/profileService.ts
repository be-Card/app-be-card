import api from './api';

export interface ProfessionalInfo {
  puesto: string | null;
  departamento: string | null;
  fecha_ingreso: string | null;
  id_empleado: string | null;
}

export interface ProfileStats {
  sessions: number;
  activity: 'Alto' | 'Medio' | 'Bajo';
  reports: number;
}

export interface ProfileMeResponse {
  id: number;
  nombres: string;
  apellidos: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  avatar: string | null;
  sexo: string | null;
  fecha_nac: string | null;
  fecha_creacion: string;
  roles: string[];
  professional: ProfessionalInfo;
  stats: ProfileStats;
}

export interface ProfileMeUpdateRequest {
  nombres: string;
  apellidos: string;
  telefono: string | null;
  direccion: string | null;
  avatar: string | null;
  puesto: string | null;
  departamento: string | null;
  fecha_ingreso: string | null;
  id_empleado: string | null;
}

const profileService = {
  getMe: async (): Promise<ProfileMeResponse> => {
    const res = await api.get<ProfileMeResponse>('/profile/me');
    return res.data;
  },
  updateMe: async (payload: ProfileMeUpdateRequest): Promise<ProfileMeResponse> => {
    const res = await api.put<ProfileMeResponse>('/profile/me', payload);
    return res.data;
  },
};

export default profileService;

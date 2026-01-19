import api from './api';

export type CardLookupResponse = {
  card_status: 'assigned_user' | 'anonymous_wallet' | 'unknown';
  card_id?: number;
  user_id?: number;
  display_name?: string;
  assignment_type?: string;
  balance?: string;
};

export type CardBindResponse = {
  card_id: number;
  message: string;
};

export type CardIssueAnonymousResponse = {
  card_id: number;
  message: string;
};

const cardsService = {
  async lookup(uid: string): Promise<CardLookupResponse> {
    const res = await api.post<CardLookupResponse>('/cards/lookup', { uid });
    return res.data;
  },

  async bind(payload: { uid: string; user_id_ext?: string; codigo_cliente?: string }): Promise<CardBindResponse> {
    const res = await api.post<CardBindResponse>('/cards/bind', payload);
    return res.data;
  },

  async issueAnonymous(uid: string): Promise<CardIssueAnonymousResponse> {
    const res = await api.post<CardIssueAnonymousResponse>('/cards/issue-anonymous', { uid });
    return res.data;
  },
};

export default cardsService;


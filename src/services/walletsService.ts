import api from './api';

export type AnonymousTopupResponse = {
  message: string;
};

const walletsService = {
  async topupAnonymous(cardId: number, amount: string): Promise<AnonymousTopupResponse> {
    const res = await api.post<AnonymousTopupResponse>(`/wallets/anonymous/${cardId}/topup`, { amount });
    return res.data;
  },
};

export default walletsService;


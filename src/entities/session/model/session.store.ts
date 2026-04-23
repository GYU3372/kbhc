import { create } from 'zustand';

export type SessionStatus = 'idle' | 'bootstrapping' | 'ready';

type SessionState = {
  accessToken: string | null;
  isAuthenticated: boolean;
  status: SessionStatus;
  setAccessToken: (token: string | null) => void;
  setStatus: (status: SessionStatus) => void;
  clear: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  accessToken: null,
  isAuthenticated: false,
  status: 'idle',
  setAccessToken: (token) =>
    set({ accessToken: token, isAuthenticated: token !== null }),
  setStatus: (status) => set({ status }),
  clear: () => set({ accessToken: null, isAuthenticated: false, status: 'ready' }),
}));

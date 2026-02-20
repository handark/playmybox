"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isAuthenticated: false,

  init: () => {
    const token = localStorage.getItem("token");
    if (token) {
      set({ token, isAuthenticated: true });
    }
  },

  login: async (email: string, password: string) => {
    const data = await api.post<{ access_token: string }>("/auth/login", {
      email,
      password,
    });
    localStorage.setItem("token", data.access_token);
    set({ token: data.access_token, isAuthenticated: true });
  },

  register: async (email: string, password: string) => {
    const data = await api.post<{ access_token: string }>("/auth/register", {
      email,
      password,
    });
    localStorage.setItem("token", data.access_token);
    set({ token: data.access_token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ token: null, isAuthenticated: false });
  },
}));

import { useState, useEffect } from "react";
import { authApi } from "@/services/api";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const tokens = await authApi.login(email, password);
    localStorage.setItem("access_token", tokens.access_token);
    setIsAuthenticated(true);
  };

  const register = async (email: string, password: string, full_name?: string) => {
    await authApi.register(email, password, full_name);
    // Don't auto-login — user must verify email first
  };

  const googleLogin = async (id_token: string) => {
    const tokens = await authApi.googleLogin(id_token);
    localStorage.setItem("access_token", tokens.access_token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setIsAuthenticated(false);
  };

  return { isAuthenticated, isLoading, login, register, googleLogin, logout };
}

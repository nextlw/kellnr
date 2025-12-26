import axios from 'axios';
import { SURI_AUTH } from '../config/suri-api';
import type { LoginRequest, LoginResponse, AuthCheckResponse } from '../types/suri';

// Configura axios para enviar cookies
axios.defaults.withCredentials = true;

/**
 * Servico de autenticacao para o Admin Panel
 * Consome diretamente as APIs do backend Suri
 */
export const SuriAuthService = {
  /**
   * Realiza login no Admin Panel
   * @param email Email do usuario
   * @param password Senha do usuario
   * @returns LoginResponse com success, message e token
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const payload: LoginRequest = { email, password };

    const response = await axios.post<LoginResponse>(SURI_AUTH.LOGIN, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  },

  /**
   * Realiza logout do Admin Panel
   * Remove o cookie de sessao
   */
  async logout(): Promise<void> {
    await axios.post(SURI_AUTH.LOGOUT, {}, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  /**
   * Verifica se o usuario esta autenticado
   * @returns AuthCheckResponse com authenticated e email
   */
  async checkAuth(): Promise<AuthCheckResponse> {
    try {
      const response = await axios.get<AuthCheckResponse>(SURI_AUTH.ME);
      return response.data;
    } catch {
      // Se der erro 401, nao esta autenticado
      return { authenticated: false };
    }
  },
};

export default SuriAuthService;


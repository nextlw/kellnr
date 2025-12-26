import axios from 'axios';
import { SURI_ADMIN } from '../config/suri-api';
import type { ClientMetrics, ClientWithMetrics, AuditLog, WsMessage } from '../types/suri';

axios.defaults.withCredentials = true;

/**
 * Servico de metricas e observability para o Admin Panel
 * Consome diretamente as APIs do backend Suri
 */
export const SuriMetricsService = {
  /**
   * Lista metricas de todos os clientes
   * @returns Array de ClientMetrics
   */
  async getAllMetrics(): Promise<ClientMetrics[]> {
    const response = await axios.get<ClientMetrics[]>(SURI_ADMIN.METRICS);
    return response.data;
  },

  /**
   * Obtem metricas de um cliente especifico
   * @param slug Slug do cliente
   * @returns ClientMetrics
   */
  async getClientMetrics(slug: string): Promise<ClientMetrics> {
    const response = await axios.get<ClientMetrics>(SURI_ADMIN.METRICS_BY_SLUG(slug));
    return response.data;
  },

  /**
   * Lista clientes com suas metricas agregadas
   * @returns Array de ClientWithMetrics
   */
  async getClientsWithMetrics(): Promise<ClientWithMetrics[]> {
    const response = await axios.get<ClientWithMetrics[]>(SURI_ADMIN.CLIENTS_WITH_METRICS);
    return response.data;
  },

  /**
   * Lista logs de auditoria
   * @param clientId ID do cliente (opcional)
   * @param limit Limite de registros (default 100)
   * @returns Array de AuditLog
   */
  async getAuditLogs(clientId?: number, limit = 100): Promise<AuditLog[]> {
    const params = new URLSearchParams();
    if (clientId !== undefined) params.append('client_id', clientId.toString());
    params.append('limit', limit.toString());

    const url = `${SURI_ADMIN.AUDIT_LOGS}?${params.toString()}`;
    const response = await axios.get<AuditLog[]>(url);
    return response.data;
  },

  /**
   * Conecta ao WebSocket de metricas em tempo real
   * @param onMessage Callback para mensagens recebidas
   * @param onError Callback para erros
   * @param onClose Callback para fechamento
   * @returns Objeto com metodos send e close
   */
  connectWebSocket(
    onMessage: (msg: WsMessage) => void,
    onError?: (error: Event) => void,
    onClose?: (event: CloseEvent) => void
  ): { send: (msg: WsMessage) => void; close: () => void } {
    const ws = new WebSocket(SURI_ADMIN.WS_METRICS);

    ws.onopen = () => {
      console.log('[WebSocket] Conectado ao servidor de metricas');
    };

    ws.onmessage = (event) => {
      try {
        const message: WsMessage = JSON.parse(event.data);
        onMessage(message);
      } catch (e) {
        console.error('[WebSocket] Erro ao parsear mensagem:', e);
      }
    };

    ws.onerror = (error) => {
      console.error('[WebSocket] Erro:', error);
      onError?.(error);
    };

    ws.onclose = (event) => {
      console.log('[WebSocket] Conexao fechada:', event.code, event.reason);
      onClose?.(event);
    };

    return {
      send: (msg: WsMessage) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(msg));
        }
      },
      close: () => ws.close(),
    };
  },
};

export default SuriMetricsService;


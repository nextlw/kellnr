// Configuracao da API Suri - URL base configuravel via variavel de ambiente
// Em desenvolvimento: proxy do Vite redireciona para localhost:3000
// Em producao: URL completa do servidor Suri

export const SURI_API_BASE = import.meta.env.VITE_SURI_API_URL || '';

// ============================================================================
// ENDPOINTS DE AUTENTICACAO
// ============================================================================
export const SURI_AUTH = {
  /** POST - Login com email/password, retorna cookie de sessao */
  LOGIN: `${SURI_API_BASE}/api/auth/login`,
  /** POST - Logout, remove cookie de sessao */
  LOGOUT: `${SURI_API_BASE}/api/auth/logout`,
  /** GET - Verifica se esta autenticado, retorna { authenticated, email } */
  ME: `${SURI_API_BASE}/api/auth/me`,
} as const;

// ============================================================================
// ENDPOINTS CRUD DE CLIENTES
// ============================================================================
export const SURI_CLIENTS = {
  /** GET - Lista todos os clientes */
  LIST: `${SURI_API_BASE}/api/clients`,
  /** POST - Cria novo cliente */
  CREATE: `${SURI_API_BASE}/api/clients`,
  /** GET - Obtem cliente por ID */
  GET: (id: number) => `${SURI_API_BASE}/api/clients/${id}`,
  /** PUT - Atualiza cliente por ID */
  UPDATE: (id: number) => `${SURI_API_BASE}/api/clients/${id}`,
  /** DELETE - Deleta cliente por ID */
  DELETE: (id: number) => `${SURI_API_BASE}/api/clients/${id}`,
} as const;

// ============================================================================
// ENDPOINTS DE METRICAS E OBSERVABILITY
// ============================================================================
export const SURI_ADMIN = {
  /** GET - Lista metricas de todos os clientes */
  METRICS: `${SURI_API_BASE}/api/admin/metrics`,
  /** GET - Metricas de um cliente especifico por slug */
  METRICS_BY_SLUG: (slug: string) => `${SURI_API_BASE}/api/admin/metrics/${slug}`,
  /** GET - Logs de auditoria, aceita query params: client_id, user_id, limit */
  AUDIT_LOGS: `${SURI_API_BASE}/api/admin/audit`,
  /** GET - Lista clientes com suas metricas agregadas */
  CLIENTS_WITH_METRICS: `${SURI_API_BASE}/api/admin/clients/with-metrics`,
  /** WebSocket - Metricas em tempo real */
  get WS_METRICS(): string {
    const base = SURI_API_BASE || (typeof window !== 'undefined' ? window.location.origin : '');
    const wsBase = base.replace(/^http/, 'ws');
    return `${wsBase}/api/admin/ws/metrics`;
  },
} as const;


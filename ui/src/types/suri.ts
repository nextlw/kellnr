// ============================================================================
// TIPOS BASEADOS NOS DTOs DO BACKEND SURI (src/admin/clients.rs)
// ESTES TIPOS DEVEM SER IDENTICOS AOS STRUCTS RUST
// ============================================================================

/**
 * DTO completo de cliente para leitura
 * Baseado em: suri/src/admin/clients.rs - ClientDto
 */
export interface ClientDto {
  /** ID unico do cliente (BIGSERIAL) */
  id: number;
  /** ID do chatbot Suri (ex: cb60303853) */
  chatbot_id: string;
  /** Nome do cliente (ex: Seletros Eletrodomesticos) */
  client_name: string;
  /** Tipo do provedor de pagamento: erede, pagarme, mercadopago, none */
  provider_type: string;
  /** Credenciais criptografadas (JSON string) */
  credentials_encrypted: string;
  /** Configuracoes JSON adicionais */
  settings_json: string | null;
  /** Se o cliente esta ativo */
  is_active: boolean;
  /** Slug unico do cliente (ex: seletros) */
  slug: string | null;
  /** Tipo de ERP: winthor, citel, none */
  erp_type: string | null;
  /** Configuracao do ERP (JSONB) */
  erp_config: Record<string, unknown> | null;
  /** Configuracao Suri (JSONB) - base_url, token */
  suri_config: Record<string, unknown> | null;
  /** Ambiente de pagamento: sandbox, production, none */
  payment_environment: string | null;
  /** Configuracoes gerais (JSONB) */
  general_config: Record<string, unknown> | null;
  /** Data de criacao (ISO 8601) */
  created_at: string;
  /** Data de atualizacao (ISO 8601) */
  updated_at: string;
}

/**
 * DTO para criacao de cliente
 * Baseado em: suri/src/admin/clients.rs - CreateClientDto
 */
export interface CreateClientDto {
  chatbot_id: string;
  client_name: string;
  provider_type: string;
  credentials_encrypted: string;
  settings_json?: string | null;
  slug?: string | null;
  erp_type?: string | null;
  erp_config?: Record<string, unknown> | null;
  suri_config?: Record<string, unknown> | null;
  payment_environment?: string | null;
  general_config?: Record<string, unknown> | null;
  is_active: boolean;
}

/**
 * DTO para atualizacao parcial de cliente
 * Todos os campos sao opcionais - apenas campos fornecidos serao atualizados
 * Baseado em: suri/src/admin/clients.rs - UpdateClientDto
 */
export interface UpdateClientDto {
  chatbot_id?: string;
  client_name?: string;
  provider_type?: string;
  credentials_encrypted?: string;
  settings_json?: string | null;
  slug?: string | null;
  erp_type?: string | null;
  erp_config?: Record<string, unknown> | null;
  suri_config?: Record<string, unknown> | null;
  payment_environment?: string | null;
  general_config?: Record<string, unknown> | null;
  is_active?: boolean;
}

// ============================================================================
// TIPOS DE METRICAS (src/admin/metrics.rs)
// ============================================================================

/**
 * Metricas de um cliente
 * Baseado em: suri/src/admin/metrics.rs - ClientMetrics
 */
export interface ClientMetrics {
  /** ID do cliente */
  client_id: number;
  /** Nome do cliente */
  client_name: string;
  /** ID do chatbot */
  chatbot_id: string;
  /** Slug do cliente */
  slug: string;

  // Requisicoes
  /** Total de requisicoes */
  requests_total: number;
  /** Requisicoes no ultimo minuto */
  requests_last_minute: number;
  /** Requisicoes na ultima hora */
  requests_last_hour: number;
  /** Total de erros */
  errors_total: number;
  /** Erros no ultimo minuto */
  errors_last_minute: number;

  // Latencia
  /** Latencia media em ms */
  avg_latency_ms: number;
  /** Latencia P95 em ms */
  p95_latency_ms: number;
  /** Latencia P99 em ms */
  p99_latency_ms: number;

  // Pagamentos
  /** Total de pagamentos */
  payments_total: number;
  /** Pagamentos pendentes */
  payments_pending: number;
  /** Pagamentos pagos */
  payments_paid: number;
  /** Pagamentos falhados */
  payments_failed: number;

  // ERP Sync
  /** Ultima sincronizacao ERP (ISO 8601 ou null) */
  last_erp_sync: string | null;
  /** Sincronizacoes ERP com sucesso */
  erp_sync_success: number;
  /** Sincronizacoes ERP com erros */
  erp_sync_errors: number;

  // Status
  /** Status ativo */
  is_active: boolean;
  /** Ultima atividade (ISO 8601 ou null) */
  last_activity: string | null;

  /** Timestamp da ultima atualizacao */
  updated_at: string;
}

/**
 * Cliente com metricas agregadas
 * Retornado por: GET /api/admin/clients/with-metrics
 */
export interface ClientWithMetrics {
  client: ClientSummary;
  metrics: ClientMetrics;
}

/**
 * Resumo do cliente (para listagem)
 */
export interface ClientSummary {
  id: number;
  chatbot_id: string;
  client_name: string;
  provider_type: string;
  is_active: boolean;
  slug: string | null;
  erp_type: string | null;
  payment_environment: string | null;
}

// ============================================================================
// TIPOS DE AUDITORIA (src/admin/audit.rs)
// ============================================================================

/**
 * Log de auditoria
 */
export interface AuditLog {
  id: number;
  user_id: number;
  user_email: string;
  operation: string;
  resource_type: string;
  resource_id: number | null;
  changes: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

// ============================================================================
// TIPOS DE WEBSOCKET (src/admin/websocket.rs)
// ============================================================================

/**
 * Mensagem WebSocket
 * Baseado em: suri/src/admin/websocket.rs - WsMessage
 */
export type WsMessage =
  | { type: 'metrics_update'; client_slug: string; metrics: ClientMetrics }
  | { type: 'metrics_bulk_update'; metrics: ClientMetrics[] }
  | { type: 'ping' }
  | { type: 'pong' };

// ============================================================================
// TIPOS DE AUTENTICACAO (src/admin/auth.rs)
// ============================================================================

/**
 * Request de login
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Response de login
 */
export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
}

/**
 * Response de verificacao de autenticacao
 */
export interface AuthCheckResponse {
  authenticated: boolean;
  email?: string;
}

// ============================================================================
// ENUMS E CONSTANTES
// ============================================================================

export const PROVIDER_TYPES = ['erede', 'pagarme', 'mercadopago', 'none'] as const;
export type ProviderType = typeof PROVIDER_TYPES[number];

export const ERP_TYPES = ['winthor', 'citel', 'none'] as const;
export type ErpType = typeof ERP_TYPES[number];

export const PAYMENT_ENVIRONMENTS = ['sandbox', 'production', 'none'] as const;
export type PaymentEnvironment = typeof PAYMENT_ENVIRONMENTS[number];


<template>
  <v-container fluid>
    <!-- Header com titulo e botao refresh -->
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center mb-4">
          <h1 class="text-h4">Dashboard de Metricas</h1>
          <v-btn color="primary" @click="loadMetrics" :loading="loading">
            <v-icon start>mdi-refresh</v-icon>
            Atualizar
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Erro de carregamento -->
    <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">
      {{ error }}
    </v-alert>

    <!-- Loading -->
    <v-row v-if="loading && clientsWithMetrics.length === 0">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate size="64" color="primary" />
        <p class="mt-4">Carregando metricas...</p>
      </v-col>
    </v-row>

    <!-- Cards de Resumo -->
    <v-row v-if="clientsWithMetrics.length > 0">
      <v-col cols="12" md="3" v-for="card in summaryCards" :key="card.title">
        <v-card elevation="2">
          <v-card-text class="text-center">
            <div class="text-caption text-uppercase text-medium-emphasis">{{ card.title }}</div>
            <div class="text-h4 mt-2" :class="card.colorClass">{{ card.value }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Grafico de Barras -->
    <v-row class="mt-4" v-if="clientsWithMetrics.length > 0">
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title>Requisicoes por Cliente</v-card-title>
          <v-card-text>
            <div v-for="client in clientsWithMetrics" :key="client.client.id" class="mb-3">
              <div class="d-flex justify-space-between mb-1">
                <span class="text-body-2">{{ client.client.client_name }}</span>
                <span class="text-body-2 font-weight-medium">{{ formatNumber(client.metrics.requests_total) }}</span>
              </div>
              <v-progress-linear
                :model-value="getBarWidth(client.metrics.requests_total)"
                :color="client.client.is_active ? 'success' : 'grey'"
                height="20"
                rounded
              />
            </div>
            <div v-if="clientsWithMetrics.length === 0" class="text-center text-medium-emphasis">
              Nenhum cliente encontrado
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Grid de Clientes -->
    <v-row class="mt-4" v-if="clientsWithMetrics.length > 0">
      <v-col cols="12" md="4" v-for="item in clientsWithMetrics" :key="item.client.id">
        <v-card
          @click="goToClient(item.client.id)"
          class="cursor-pointer h-100"
          elevation="2"
          hover
        >
          <v-card-title class="d-flex align-center">
            <span class="text-truncate">{{ item.client.client_name }}</span>
            <v-chip
              :color="item.client.is_active ? 'success' : 'error'"
              size="small"
              class="ml-2"
              variant="flat"
            >
              {{ item.client.is_active ? 'Ativo' : 'Inativo' }}
            </v-chip>
          </v-card-title>
          <v-card-subtitle v-if="item.client.slug">
            {{ item.client.slug }}
          </v-card-subtitle>
          <v-card-text>
            <v-row dense>
              <v-col cols="6">
                <div class="text-caption text-medium-emphasis">Requisicoes</div>
                <div class="text-h6">{{ formatNumber(item.metrics.requests_total) }}</div>
              </v-col>
              <v-col cols="6">
                <div class="text-caption text-medium-emphasis">Taxa de Erro</div>
                <div class="text-h6" :class="getErrorRateClass(item.metrics)">
                  {{ getErrorRate(item.metrics).toFixed(1) }}%
                </div>
              </v-col>
              <v-col cols="6">
                <div class="text-caption text-medium-emphasis">Latencia Media</div>
                <div class="text-h6">{{ item.metrics.avg_latency_ms.toFixed(0) }}ms</div>
              </v-col>
              <v-col cols="6">
                <div class="text-caption text-medium-emphasis">Req/min</div>
                <div class="text-h6">{{ item.metrics.requests_last_minute }}</div>
              </v-col>
            </v-row>
            <!-- Barra de Uptime -->
            <div class="mt-3">
              <div class="d-flex justify-space-between mb-1">
                <span class="text-caption">Pagamentos</span>
                <span class="text-caption">{{ item.metrics.payments_paid }}/{{ item.metrics.payments_total }}</span>
              </div>
              <v-progress-linear
                :model-value="getPaymentSuccessRate(item.metrics)"
                :color="getPaymentSuccessRate(item.metrics) > 80 ? 'success' : 'warning'"
                height="8"
                rounded
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Mensagem vazia -->
    <v-row v-if="!loading && clientsWithMetrics.length === 0 && !error">
      <v-col cols="12" class="text-center">
        <v-icon size="64" color="grey">mdi-chart-box-outline</v-icon>
        <p class="mt-4 text-medium-emphasis">Nenhum cliente com metricas encontrado</p>
        <v-btn color="primary" to="/admin/clients/new">
          <v-icon start>mdi-plus</v-icon>
          Adicionar Cliente
        </v-btn>
      </v-col>
    </v-row>

    <!-- Indicador de WebSocket -->
    <v-chip
      :color="wsConnected ? 'success' : 'error'"
      size="small"
      class="position-fixed"
      style="bottom: 20px; right: 20px; z-index: 1000;"
      variant="flat"
    >
      <v-icon start size="small">{{ wsConnected ? 'mdi-wifi' : 'mdi-wifi-off' }}</v-icon>
      {{ wsConnected ? 'Tempo Real' : 'Desconectado' }}
    </v-chip>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import SuriMetricsService from '../services/suri-metrics';
import type { ClientWithMetrics, ClientMetrics, WsMessage } from '../types/suri';

const router = useRouter();
const loading = ref(false);
const error = ref('');
const clientsWithMetrics = ref<ClientWithMetrics[]>([]);
const wsConnected = ref(false);
let wsConnection: { send: (msg: WsMessage) => void; close: () => void } | null = null;
let refreshInterval: ReturnType<typeof setInterval> | null = null;

// Carregar dados reais do backend
async function loadMetrics() {
  loading.value = true;
  error.value = '';
  try {
    clientsWithMetrics.value = await SuriMetricsService.getClientsWithMetrics();
  } catch (err) {
    console.error('Erro ao carregar metricas:', err);
    error.value = 'Erro ao carregar metricas. Verifique se o servidor Suri esta rodando.';
  } finally {
    loading.value = false;
  }
}

// Cards de resumo calculados
const summaryCards = computed(() => {
  const total = clientsWithMetrics.value.length;
  const active = clientsWithMetrics.value.filter(c => c.client.is_active).length;
  const requests = clientsWithMetrics.value.reduce((sum, c) => sum + c.metrics.requests_total, 0);
  const avgErrorRate = total > 0
    ? clientsWithMetrics.value.reduce((sum, c) => sum + getErrorRate(c.metrics), 0) / total
    : 0;

  return [
    { title: 'Total de Clientes', value: total.toString(), colorClass: 'text-info' },
    { title: 'Clientes Ativos', value: active.toString(), colorClass: 'text-success' },
    { title: 'Total de Requisicoes', value: formatNumber(requests), colorClass: '' },
    { title: 'Taxa de Erro Media', value: avgErrorRate.toFixed(1) + '%', colorClass: avgErrorRate > 5 ? 'text-error' : 'text-success' },
  ];
});

// Helpers
function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toString();
}

function getErrorRate(metrics: ClientMetrics): number {
  if (metrics.requests_total === 0) return 0;
  return (metrics.errors_total / metrics.requests_total) * 100;
}

function getErrorRateClass(metrics: ClientMetrics): string {
  const rate = getErrorRate(metrics);
  if (rate > 5) return 'text-error';
  if (rate > 1) return 'text-warning';
  return 'text-success';
}

function getBarWidth(requests: number): number {
  const max = Math.max(...clientsWithMetrics.value.map(c => c.metrics.requests_total), 1);
  return (requests / max) * 100;
}

function getPaymentSuccessRate(metrics: ClientMetrics): number {
  if (metrics.payments_total === 0) return 100;
  return (metrics.payments_paid / metrics.payments_total) * 100;
}

function goToClient(id: number) {
  router.push(`/admin/clients/${id}`);
}

// WebSocket para tempo real
function connectWebSocket() {
  try {
    wsConnection = SuriMetricsService.connectWebSocket(
      (msg) => {
        if (msg.type === 'metrics_bulk_update') {
          msg.metrics.forEach(newMetrics => {
            const idx = clientsWithMetrics.value.findIndex(c => c.client.slug === newMetrics.slug);
            if (idx >= 0) {
              clientsWithMetrics.value[idx].metrics = newMetrics;
            }
          });
        } else if (msg.type === 'metrics_update') {
          const idx = clientsWithMetrics.value.findIndex(c => c.client.slug === msg.client_slug);
          if (idx >= 0) {
            clientsWithMetrics.value[idx].metrics = msg.metrics;
          }
        }
      },
      () => { wsConnected.value = false; },
      () => { wsConnected.value = false; }
    );
    wsConnected.value = true;
  } catch (err) {
    console.error('Erro ao conectar WebSocket:', err);
    wsConnected.value = false;
  }
}

onMounted(() => {
  loadMetrics();
  connectWebSocket();
  // Auto-refresh a cada 30 segundos
  refreshInterval = setInterval(loadMetrics, 30000);
});

onUnmounted(() => {
  if (wsConnection) wsConnection.close();
  if (refreshInterval) clearInterval(refreshInterval);
});
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>


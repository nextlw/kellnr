<template>
  <v-card elevation="2" class="h-100">
    <v-card-title class="d-flex align-center">
      <v-icon start>mdi-text-box-multiple-outline</v-icon>
      Logs em Tempo Real
      <v-spacer />
      <v-chip
        :color="wsConnected ? 'success' : 'error'"
        size="small"
        variant="flat"
        class="mr-2"
      >
        <v-icon start size="small">{{ wsConnected ? 'mdi-wifi' : 'mdi-wifi-off' }}</v-icon>
        {{ wsConnected ? 'Conectado' : 'Desconectado' }}
      </v-chip>
      <v-btn
        :icon="paused ? 'mdi-play' : 'mdi-pause'"
        size="small"
        variant="text"
        @click="togglePause"
      >
        <v-tooltip activator="parent" location="top">
          {{ paused ? 'Continuar' : 'Pausar' }}
        </v-tooltip>
      </v-btn>
      <v-btn
        icon="mdi-delete-outline"
        size="small"
        variant="text"
        @click="clearLogs"
      >
        <v-tooltip activator="parent" location="top">Limpar</v-tooltip>
      </v-btn>
    </v-card-title>

    <!-- Filtro por cliente -->
    <v-card-text class="pb-0">
      <v-select
        v-model="selectedClient"
        :items="clientOptions"
        label="Filtrar por Cliente"
        variant="outlined"
        density="compact"
        clearable
        hide-details
      />
    </v-card-text>

    <!-- Lista de Logs -->
    <v-card-text ref="logsContainer" class="logs-container" @scroll="handleScroll">
      <div v-if="filteredLogs.length === 0" class="text-center text-medium-emphasis py-8">
        <v-icon size="48">mdi-text-box-outline</v-icon>
        <p class="mt-2">Aguardando logs...</p>
      </div>

      <div
        v-for="(log, index) in filteredLogs"
        :key="index"
        class="log-entry py-2"
        :class="getLogClass(log)"
      >
        <div class="d-flex align-center">
          <v-chip
            :color="getLogColor(log)"
            size="x-small"
            variant="flat"
            class="mr-2"
          >
            {{ log.type }}
          </v-chip>
          <span class="text-caption text-medium-emphasis">
            {{ formatTime(log.timestamp) }}
          </span>
          <v-chip
            v-if="log.client_slug"
            size="x-small"
            variant="tonal"
            class="ml-2"
          >
            {{ log.client_slug }}
          </v-chip>
        </div>
        <div class="log-message mt-1">
          <template v-if="log.type === 'metrics_update'">
            <span class="font-weight-medium">{{ log.client_slug }}</span>:
            {{ log.metrics.requests_last_minute }} req/min,
            {{ log.metrics.avg_latency_ms.toFixed(0) }}ms latencia
          </template>
          <template v-else-if="log.type === 'metrics_bulk_update'">
            Atualização em lote: {{ log.metrics.length }} clientes
          </template>
          <template v-else>
            {{ JSON.stringify(log) }}
          </template>
        </div>
      </div>
    </v-card-text>

    <!-- Indicador de auto-scroll -->
    <v-fab
      v-if="!autoScroll && filteredLogs.length > 0"
      icon="mdi-chevron-down"
      color="primary"
      size="small"
      class="scroll-to-bottom"
      @click="scrollToBottom"
    />
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import SuriMetricsService from '../services/suri-metrics';
import type { WsMessage, ClientMetrics } from '../types/suri';

interface LogEntry {
  type: string;
  timestamp: Date;
  client_slug?: string;
  metrics: ClientMetrics | ClientMetrics[];
}

const props = defineProps<{
  clients?: { slug: string; name: string }[];
  maxLogs?: number;
}>();

const maxLogCount = computed(() => props.maxLogs || 100);

const logsContainer = ref<HTMLElement | null>(null);
const logs = ref<LogEntry[]>([]);
const paused = ref(false);
const wsConnected = ref(false);
const autoScroll = ref(true);
const selectedClient = ref<string | null>(null);

let wsConnection: { send: (msg: WsMessage) => void; close: () => void } | null = null;

// Opcoes de clientes para filtro
const clientOptions = computed(() => {
  const slugs = new Set<string>();
  logs.value.forEach(log => {
    if (log.client_slug) slugs.add(log.client_slug);
    if (log.type === 'metrics_bulk_update' && Array.isArray(log.metrics)) {
      (log.metrics as ClientMetrics[]).forEach((m: ClientMetrics) => slugs.add(m.slug));
    }
  });
  return Array.from(slugs).map(slug => ({ title: slug, value: slug }));
});

// Logs filtrados
const filteredLogs = computed(() => {
  if (!selectedClient.value) return logs.value;
  return logs.value.filter(log => {
    if (log.client_slug === selectedClient.value) return true;
    if (log.type === 'metrics_bulk_update' && Array.isArray(log.metrics)) {
      return (log.metrics as ClientMetrics[]).some((m: ClientMetrics) => m.slug === selectedClient.value);
    }
    return false;
  });
});

// Conectar WebSocket
function connectWebSocket() {
  try {
    wsConnection = SuriMetricsService.connectWebSocket(
      (msg) => {
        if (paused.value) return;

        const entry: LogEntry = {
          type: msg.type,
          timestamp: new Date(),
          client_slug: undefined,
          metrics: {} as ClientMetrics,
        };

        if (msg.type === 'metrics_update') {
          entry.client_slug = msg.client_slug;
          entry.metrics = msg.metrics;
        } else if (msg.type === 'metrics_bulk_update') {
          entry.metrics = msg.metrics;
        }

        logs.value.push(entry);

        // Limitar quantidade de logs
        if (logs.value.length > maxLogCount.value) {
          logs.value = logs.value.slice(-maxLogCount.value);
        }

        // Auto-scroll
        if (autoScroll.value) {
          nextTick(() => scrollToBottom());
        }
      },
      () => { wsConnected.value = false; },
      () => {
        wsConnected.value = false;
        // Tentar reconectar apos 5 segundos
        setTimeout(connectWebSocket, 5000);
      }
    );
    wsConnected.value = true;
  } catch (err) {
    console.error('Erro ao conectar WebSocket:', err);
    wsConnected.value = false;
  }
}

function togglePause() {
  paused.value = !paused.value;
}

function clearLogs() {
  logs.value = [];
}

function scrollToBottom() {
  if (logsContainer.value) {
    logsContainer.value.scrollTop = logsContainer.value.scrollHeight;
  }
  autoScroll.value = true;
}

function handleScroll() {
  if (!logsContainer.value) return;
  const { scrollTop, scrollHeight, clientHeight } = logsContainer.value;
  autoScroll.value = scrollTop + clientHeight >= scrollHeight - 50;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
}

function getLogColor(log: LogEntry): string {
  switch (log.type) {
    case 'metrics_update': return 'info';
    case 'metrics_bulk_update': return 'success';
    case 'ping': return 'grey';
    case 'pong': return 'grey';
    default: return 'default';
  }
}

function getLogClass(log: LogEntry): string {
  return `log-${log.type.replace(/_/g, '-')}`;
}

// Watch para pausar
watch(paused, (isPaused) => {
  if (!isPaused && autoScroll.value) {
    nextTick(() => scrollToBottom());
  }
});

onMounted(() => {
  connectWebSocket();
});

onUnmounted(() => {
  if (wsConnection) {
    wsConnection.close();
  }
});
</script>

<style scoped>
.logs-container {
  max-height: 400px;
  overflow-y: auto;
  font-family: 'Fira Code', 'Monaco', monospace;
  font-size: 0.85rem;
}

.log-entry {
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
}

.log-entry:last-child {
  border-bottom: none;
}

.log-message {
  word-break: break-all;
}

.scroll-to-bottom {
  position: absolute;
  bottom: 16px;
  right: 16px;
}

.log-metrics-update {
  background-color: rgba(33, 150, 243, 0.05);
}

.log-metrics-bulk-update {
  background-color: rgba(76, 175, 80, 0.05);
}
</style>


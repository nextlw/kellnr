<template>
  <v-container fluid>
    <!-- Header -->
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center mb-4">
          <h1 class="text-h4">Logs e Auditoria</h1>
          <v-btn color="primary" @click="loadAuditLogs" :loading="loading">
            <v-icon start>mdi-refresh</v-icon>
            Atualizar
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Erro -->
    <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">
      {{ error }}
    </v-alert>

    <v-row>
      <!-- Logs em Tempo Real -->
      <v-col cols="12" md="6">
        <RealtimeLogs :max-logs="50" />
      </v-col>

      <!-- Logs de Auditoria -->
      <v-col cols="12" md="6">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center">
            <v-icon start>mdi-history</v-icon>
            Historico de Auditoria
          </v-card-title>

          <!-- Filtros -->
          <v-card-text class="pb-0">
            <v-row dense>
              <v-col cols="6">
                <v-select
                  v-model="filterClientId"
                  :items="clientOptions"
                  label="Cliente"
                  variant="outlined"
                  density="compact"
                  clearable
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-select
                  v-model="filterLimit"
                  :items="limitOptions"
                  label="Limite"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-card-text>

          <!-- Lista de Logs -->
          <v-card-text>
            <v-list v-if="auditLogs.length > 0" lines="three" density="compact">
              <v-list-item
                v-for="log in auditLogs"
                :key="log.id"
                class="px-0"
              >
                <template #prepend>
                  <v-avatar :color="getOperationColor(log.operation)" size="40">
                    <v-icon>{{ getOperationIcon(log.operation) }}</v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title>
                  {{ log.operation }} - {{ log.resource_type }}
                  <span v-if="log.resource_id" class="text-medium-emphasis">
                    #{{ log.resource_id }}
                  </span>
                </v-list-item-title>

                <v-list-item-subtitle>
                  <div>
                    <v-icon size="x-small">mdi-account</v-icon>
                    {{ log.user_email }}
                  </div>
                  <div>
                    <v-icon size="x-small">mdi-clock-outline</v-icon>
                    {{ formatDate(log.created_at) }}
                  </div>
                  <div v-if="log.ip_address">
                    <v-icon size="x-small">mdi-ip</v-icon>
                    {{ log.ip_address }}
                  </div>
                </v-list-item-subtitle>

                <template #append>
                  <v-btn
                    icon="mdi-information-outline"
                    size="small"
                    variant="text"
                    @click="showDetails(log)"
                  />
                </template>
              </v-list-item>
            </v-list>

            <div v-else-if="loading" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" />
            </div>

            <div v-else class="text-center py-8 text-medium-emphasis">
              <v-icon size="48">mdi-file-document-outline</v-icon>
              <p class="mt-2">Nenhum log de auditoria encontrado</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog de Detalhes -->
    <v-dialog v-model="detailsDialog" max-width="600">
      <v-card>
        <v-card-title>Detalhes do Log</v-card-title>
        <v-card-text v-if="selectedLog">
          <v-list density="compact">
            <v-list-item>
              <v-list-item-title>ID</v-list-item-title>
              <v-list-item-subtitle>{{ selectedLog.id }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>Operacao</v-list-item-title>
              <v-list-item-subtitle>{{ selectedLog.operation }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>Tipo de Recurso</v-list-item-title>
              <v-list-item-subtitle>{{ selectedLog.resource_type }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>ID do Recurso</v-list-item-title>
              <v-list-item-subtitle>{{ selectedLog.resource_id || '-' }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>Usuario</v-list-item-title>
              <v-list-item-subtitle>{{ selectedLog.user_email }} (ID: {{ selectedLog.user_id }})</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>IP</v-list-item-title>
              <v-list-item-subtitle>{{ selectedLog.ip_address || '-' }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>Data</v-list-item-title>
              <v-list-item-subtitle>{{ formatDate(selectedLog.created_at) }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>

          <v-divider class="my-4" />

          <div class="text-subtitle-2 mb-2">Alteracoes</div>
          <pre class="changes-json">{{ JSON.stringify(selectedLog.changes, null, 2) }}</pre>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="detailsDialog = false">Fechar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import RealtimeLogs from '../components/RealtimeLogs.vue';
import SuriMetricsService from '../services/suri-metrics';
import SuriClientsService from '../services/suri-clients';
import type { AuditLog, ClientDto } from '../types/suri';

const loading = ref(false);
const error = ref('');
const auditLogs = ref<AuditLog[]>([]);
const clients = ref<ClientDto[]>([]);
const detailsDialog = ref(false);
const selectedLog = ref<AuditLog | null>(null);

// Filtros
const filterClientId = ref<number | null>(null);
const filterLimit = ref(50);

// Opcoes
const limitOptions = [
  { title: '25 registros', value: 25 },
  { title: '50 registros', value: 50 },
  { title: '100 registros', value: 100 },
  { title: '200 registros', value: 200 },
];

const clientOptions = ref<{ title: string; value: number }[]>([]);

// Carregar clientes para filtro
async function loadClients() {
  try {
    clients.value = await SuriClientsService.listClients();
    clientOptions.value = clients.value.map(c => ({
      title: c.client_name,
      value: c.id,
    }));
  } catch (err) {
    console.error('Erro ao carregar clientes:', err);
  }
}

// Carregar logs de auditoria
async function loadAuditLogs() {
  loading.value = true;
  error.value = '';
  try {
    auditLogs.value = await SuriMetricsService.getAuditLogs(
      filterClientId.value ?? undefined,
      filterLimit.value
    );
  } catch (err) {
    console.error('Erro ao carregar logs:', err);
    error.value = 'Erro ao carregar logs de auditoria.';
  } finally {
    loading.value = false;
  }
}

// Helpers
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getOperationColor(operation: string): string {
  if (operation.includes('CREATE') || operation.includes('INSERT')) return 'success';
  if (operation.includes('UPDATE') || operation.includes('EDIT')) return 'warning';
  if (operation.includes('DELETE') || operation.includes('REMOVE')) return 'error';
  return 'info';
}

function getOperationIcon(operation: string): string {
  if (operation.includes('CREATE') || operation.includes('INSERT')) return 'mdi-plus';
  if (operation.includes('UPDATE') || operation.includes('EDIT')) return 'mdi-pencil';
  if (operation.includes('DELETE') || operation.includes('REMOVE')) return 'mdi-delete';
  if (operation.includes('LOGIN')) return 'mdi-login';
  if (operation.includes('LOGOUT')) return 'mdi-logout';
  return 'mdi-information';
}

function showDetails(log: AuditLog) {
  selectedLog.value = log;
  detailsDialog.value = true;
}

// Recarregar quando filtros mudarem
watch([filterClientId, filterLimit], () => {
  loadAuditLogs();
});

onMounted(() => {
  loadClients();
  loadAuditLogs();
});
</script>

<style scoped>
.changes-json {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  font-family: 'Fira Code', 'Monaco', monospace;
  font-size: 0.85rem;
}
</style>


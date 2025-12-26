<template>
  <v-container fluid>
    <!-- Header -->
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center mb-4">
          <h1 class="text-h4">Gerenciar Clientes</h1>
          <div>
            <v-btn color="primary" class="mr-2" @click="loadClients" :loading="loading">
              <v-icon start>mdi-refresh</v-icon>
              Atualizar
            </v-btn>
            <v-btn color="success" to="/admin/clients/new">
              <v-icon start>mdi-plus</v-icon>
              Novo Cliente
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Erro de carregamento -->
    <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">
      {{ error }}
    </v-alert>

    <!-- Sucesso -->
    <v-alert v-if="success" type="success" class="mb-4" closable @click:close="success = ''">
      {{ success }}
    </v-alert>

    <!-- Filtros -->
    <v-row class="mb-4">
      <v-col cols="12" md="3">
        <v-text-field
          v-model="search"
          label="Buscar"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          clearable
        />
      </v-col>
      <v-col cols="12" md="2">
        <v-select
          v-model="filterStatus"
          :items="statusOptions"
          label="Status"
          variant="outlined"
          density="compact"
          hide-details
          clearable
        />
      </v-col>
      <v-col cols="12" md="2">
        <v-select
          v-model="filterProvider"
          :items="providerOptions"
          label="Provider"
          variant="outlined"
          density="compact"
          hide-details
          clearable
        />
      </v-col>
      <v-col cols="12" md="2">
        <v-select
          v-model="filterErp"
          :items="erpOptions"
          label="ERP"
          variant="outlined"
          density="compact"
          hide-details
          clearable
        />
      </v-col>
    </v-row>

    <!-- Tabela de Clientes -->
    <v-card elevation="2">
      <v-data-table
        :headers="headers"
        :items="filteredClients"
        :loading="loading"
        :search="search"
        :items-per-page="10"
        class="elevation-0"
      >
        <!-- Coluna Status -->
        <template #item.is_active="{ item }">
          <v-chip
            :color="item.is_active ? 'success' : 'error'"
            size="small"
            variant="flat"
          >
            {{ item.is_active ? 'Ativo' : 'Inativo' }}
          </v-chip>
        </template>

        <!-- Coluna Provider -->
        <template #item.provider_type="{ item }">
          <v-chip
            :color="getProviderColor(item.provider_type)"
            size="small"
            variant="tonal"
          >
            {{ item.provider_type }}
          </v-chip>
        </template>

        <!-- Coluna ERP -->
        <template #item.erp_type="{ item }">
          <v-chip
            v-if="item.erp_type && item.erp_type !== 'none'"
            :color="getErpColor(item.erp_type)"
            size="small"
            variant="tonal"
          >
            {{ item.erp_type }}
          </v-chip>
          <span v-else class="text-medium-emphasis">-</span>
        </template>

        <!-- Coluna Ambiente -->
        <template #item.payment_environment="{ item }">
          <v-chip
            v-if="item.payment_environment && item.payment_environment !== 'none'"
            :color="item.payment_environment === 'production' ? 'error' : 'warning'"
            size="small"
            variant="tonal"
          >
            {{ item.payment_environment }}
          </v-chip>
          <span v-else class="text-medium-emphasis">-</span>
        </template>

        <!-- Coluna Acoes -->
        <template #item.actions="{ item }">
          <v-btn
            icon
            size="small"
            variant="text"
            color="primary"
            @click="editClient(item)"
          >
            <v-icon>mdi-pencil</v-icon>
            <v-tooltip activator="parent" location="top">Editar</v-tooltip>
          </v-btn>
          <v-btn
            icon
            size="small"
            variant="text"
            color="error"
            @click="confirmDelete(item)"
          >
            <v-icon>mdi-delete</v-icon>
            <v-tooltip activator="parent" location="top">Excluir</v-tooltip>
          </v-btn>
        </template>

        <!-- Slot vazio -->
        <template #no-data>
          <div class="text-center py-8">
            <v-icon size="64" color="grey">mdi-account-group-outline</v-icon>
            <p class="mt-4 text-medium-emphasis">Nenhum cliente encontrado</p>
            <v-btn color="primary" to="/admin/clients/new" class="mt-2">
              <v-icon start>mdi-plus</v-icon>
              Adicionar Cliente
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog de Confirmacao de Exclusao -->
    <v-dialog v-model="deleteDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">
          Confirmar Exclusao
        </v-card-title>
        <v-card-text>
          Tem certeza que deseja excluir o cliente <strong>{{ clientToDelete?.client_name }}</strong>?
          Esta acao nao pode ser desfeita.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">
            Cancelar
          </v-btn>
          <v-btn color="error" variant="flat" @click="deleteClient" :loading="deleting">
            Excluir
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import SuriClientsService from '../services/suri-clients';
import type { ClientDto } from '../types/suri';
import { PROVIDER_TYPES, ERP_TYPES } from '../types/suri';

const router = useRouter();
const loading = ref(false);
const deleting = ref(false);
const error = ref('');
const success = ref('');
const clients = ref<ClientDto[]>([]);
const deleteDialog = ref(false);
const clientToDelete = ref<ClientDto | null>(null);

// Filtros
const search = ref('');
const filterStatus = ref<boolean | null>(null);
const filterProvider = ref<string | null>(null);
const filterErp = ref<string | null>(null);

// Opcoes de filtro
const statusOptions = [
  { title: 'Ativo', value: true },
  { title: 'Inativo', value: false },
];

const providerOptions = PROVIDER_TYPES.map(p => ({ title: p, value: p }));
const erpOptions = ERP_TYPES.map(e => ({ title: e, value: e }));

// Headers da tabela
const headers = [
  { title: 'Nome', key: 'client_name', sortable: true },
  { title: 'Slug', key: 'slug', sortable: true },
  { title: 'Chatbot ID', key: 'chatbot_id', sortable: true },
  { title: 'Provider', key: 'provider_type', sortable: true },
  { title: 'ERP', key: 'erp_type', sortable: true },
  { title: 'Ambiente', key: 'payment_environment', sortable: true },
  { title: 'Status', key: 'is_active', sortable: true },
  { title: 'Acoes', key: 'actions', sortable: false, align: 'end' as const },
];

// Clientes filtrados
const filteredClients = computed(() => {
  let result = clients.value;

  if (filterStatus.value !== null) {
    result = result.filter(c => c.is_active === filterStatus.value);
  }

  if (filterProvider.value) {
    result = result.filter(c => c.provider_type === filterProvider.value);
  }

  if (filterErp.value) {
    result = result.filter(c => c.erp_type === filterErp.value);
  }

  return result;
});

// Carregar clientes do backend
async function loadClients() {
  loading.value = true;
  error.value = '';
  try {
    clients.value = await SuriClientsService.listClients();
  } catch (err) {
    console.error('Erro ao carregar clientes:', err);
    error.value = 'Erro ao carregar clientes. Verifique se o servidor Suri esta rodando.';
  } finally {
    loading.value = false;
  }
}

// Editar cliente
function editClient(client: ClientDto) {
  router.push(`/admin/clients/${client.id}`);
}

// Confirmar exclusao
function confirmDelete(client: ClientDto) {
  clientToDelete.value = client;
  deleteDialog.value = true;
}

// Excluir cliente
async function deleteClient() {
  if (!clientToDelete.value) return;

  deleting.value = true;
  try {
    await SuriClientsService.deleteClient(clientToDelete.value.id);
    success.value = `Cliente "${clientToDelete.value.client_name}" excluido com sucesso!`;
    await loadClients();
  } catch (err) {
    console.error('Erro ao excluir cliente:', err);
    error.value = 'Erro ao excluir cliente. Tente novamente.';
  } finally {
    deleting.value = false;
    deleteDialog.value = false;
    clientToDelete.value = null;
  }
}

// Cores por provider
function getProviderColor(provider: string): string {
  const colors: Record<string, string> = {
    erede: 'red',
    pagarme: 'green',
    mercadopago: 'blue',
    none: 'grey',
  };
  return colors[provider] || 'grey';
}

// Cores por ERP
function getErpColor(erp: string): string {
  const colors: Record<string, string> = {
    winthor: 'purple',
    citel: 'orange',
    none: 'grey',
  };
  return colors[erp] || 'grey';
}

onMounted(() => {
  loadClients();
});
</script>


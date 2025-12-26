<template>
  <v-container fluid>
    <!-- Header -->
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-4">
          <v-btn icon variant="text" @click="goBack" class="mr-2">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <h1 class="text-h4">{{ isEdit ? 'Editar Cliente' : 'Novo Cliente' }}</h1>
        </div>
      </v-col>
    </v-row>

    <!-- Loading -->
    <v-row v-if="loading">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate size="64" color="primary" />
        <p class="mt-4">Carregando...</p>
      </v-col>
    </v-row>

    <!-- Erro -->
    <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">
      {{ error }}
    </v-alert>

    <!-- Sucesso -->
    <v-alert v-if="success" type="success" class="mb-4" closable @click:close="success = ''">
      {{ success }}
    </v-alert>

    <!-- Formulario -->
    <v-form v-if="!loading" ref="formRef" @submit.prevent="saveClient">
      <v-row>
        <!-- Informacoes Basicas -->
        <v-col cols="12" md="6">
          <v-card elevation="2">
            <v-card-title>Informacoes Basicas</v-card-title>
            <v-card-text>
              <v-text-field
                v-model="form.client_name"
                label="Nome do Cliente *"
                :rules="[rules.required, rules.minLength(3)]"
                variant="outlined"
                class="mb-3"
              />

              <v-text-field
                v-model="form.chatbot_id"
                label="Chatbot ID *"
                placeholder="cbXXXXXXXX"
                :rules="[rules.required, rules.chatbotId]"
                variant="outlined"
                class="mb-3"
              />

              <v-text-field
                v-model="form.slug"
                label="Slug"
                placeholder="nome-do-cliente"
                :rules="[rules.slug]"
                variant="outlined"
                class="mb-3"
                hint="Identificador unico em URL. Deixe vazio para gerar automaticamente."
              />

              <v-switch
                v-model="form.is_active"
                label="Cliente Ativo"
                color="success"
                hide-details
              />
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Configuracoes de Pagamento -->
        <v-col cols="12" md="6">
          <v-card elevation="2">
            <v-card-title>Configuracoes de Pagamento</v-card-title>
            <v-card-text>
              <v-select
                v-model="form.provider_type"
                :items="providerOptions"
                label="Provedor de Pagamento *"
                :rules="[rules.required]"
                variant="outlined"
                class="mb-3"
              />

              <v-select
                v-model="form.payment_environment"
                :items="environmentOptions"
                label="Ambiente"
                variant="outlined"
                class="mb-3"
              />

              <CredentialsEditor
                v-model="form.credentials_encrypted"
                :provider-type="form.provider_type"
                class="mb-3"
              />
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Configuracoes de ERP -->
        <v-col cols="12" md="6">
          <v-card elevation="2">
            <v-card-title>Configuracoes de ERP</v-card-title>
            <v-card-text>
              <v-select
                v-model="form.erp_type"
                :items="erpOptions"
                label="Tipo de ERP"
                variant="outlined"
                class="mb-3"
              />

              <v-textarea
                v-model="erpConfigJson"
                label="Configuracao ERP (JSON)"
                variant="outlined"
                rows="4"
                :rules="[rules.json]"
                class="mb-3"
                hint="Configuracoes especificas do ERP em formato JSON"
              />
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Configuracoes Suri -->
        <v-col cols="12" md="6">
          <v-card elevation="2">
            <v-card-title>Configuracoes Suri</v-card-title>
            <v-card-text>
              <v-textarea
                v-model="suriConfigJson"
                label="Configuracao Suri (JSON)"
                variant="outlined"
                rows="4"
                :rules="[rules.json]"
                class="mb-3"
                hint="base_url, token, etc."
              />

              <v-textarea
                v-model="generalConfigJson"
                label="Configuracoes Gerais (JSON)"
                variant="outlined"
                rows="4"
                :rules="[rules.json]"
                hint="Outras configuracoes em formato JSON"
              />
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Configuracoes Adicionais -->
        <v-col cols="12">
          <v-card elevation="2">
            <v-card-title>Configuracoes Adicionais</v-card-title>
            <v-card-text>
              <v-textarea
                v-model="form.settings_json"
                label="Settings JSON"
                variant="outlined"
                rows="3"
                :rules="[rules.json]"
                hint="Configuracoes legadas em formato JSON string"
              />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Botoes -->
      <v-row class="mt-4">
        <v-col cols="12" class="d-flex justify-end">
          <v-btn variant="text" @click="goBack" class="mr-2">
            Cancelar
          </v-btn>
          <v-btn color="primary" type="submit" :loading="saving">
            <v-icon start>mdi-content-save</v-icon>
            {{ isEdit ? 'Salvar Alteracoes' : 'Criar Cliente' }}
          </v-btn>
        </v-col>
      </v-row>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SuriClientsService from '../services/suri-clients';
import CredentialsEditor from '../components/CredentialsEditor.vue';
import type { CreateClientDto, UpdateClientDto } from '../types/suri';
import { PROVIDER_TYPES, ERP_TYPES, PAYMENT_ENVIRONMENTS } from '../types/suri';

const route = useRoute();
const router = useRouter();
const formRef = ref();
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const success = ref('');

// Verifica se e edicao
const isEdit = computed(() => route.params.id && route.params.id !== 'new');
const clientId = computed(() => parseInt(route.params.id as string));

// Formulario
const form = ref({
  client_name: '',
  chatbot_id: '',
  slug: '',
  provider_type: 'none',
  payment_environment: 'none',
  erp_type: 'none',
  is_active: true,
  credentials_encrypted: '{}',
  settings_json: '',
});

// JSONs editaveis
const erpConfigJson = ref('{}');
const suriConfigJson = ref('{}');
const generalConfigJson = ref('{}');

// Opcoes de select
const providerOptions = PROVIDER_TYPES.map(p => ({ title: p.toUpperCase(), value: p }));
const erpOptions = ERP_TYPES.map(e => ({ title: e.toUpperCase(), value: e }));
const environmentOptions = PAYMENT_ENVIRONMENTS.map(e => ({ title: e.toUpperCase(), value: e }));

// Regras de validacao
const rules = {
  required: (v: string) => !!v || 'Campo obrigatorio',
  minLength: (min: number) => (v: string) => (v && v.length >= min) || `Minimo ${min} caracteres`,
  chatbotId: (v: string) => /^cb\d+$/.test(v) || 'Formato invalido. Use cbXXXXXXXX',
  slug: (v: string) => !v || /^[a-z0-9-]+$/.test(v) || 'Apenas letras minusculas, numeros e hifen',
  json: (v: string) => {
    if (!v || v.trim() === '') return true;
    try {
      JSON.parse(v);
      return true;
    } catch {
      return 'JSON invalido';
    }
  },
};

// Carregar cliente para edicao
async function loadClient() {
  if (!isEdit.value) return;

  loading.value = true;
  error.value = '';
  try {
    const client = await SuriClientsService.getClient(clientId.value);
    form.value = {
      client_name: client.client_name,
      chatbot_id: client.chatbot_id,
      slug: client.slug || '',
      provider_type: client.provider_type,
      payment_environment: client.payment_environment || 'none',
      erp_type: client.erp_type || 'none',
      is_active: client.is_active,
      credentials_encrypted: client.credentials_encrypted,
      settings_json: client.settings_json || '',
    };
    erpConfigJson.value = client.erp_config ? JSON.stringify(client.erp_config, null, 2) : '{}';
    suriConfigJson.value = client.suri_config ? JSON.stringify(client.suri_config, null, 2) : '{}';
    generalConfigJson.value = client.general_config ? JSON.stringify(client.general_config, null, 2) : '{}';
  } catch (err) {
    console.error('Erro ao carregar cliente:', err);
    error.value = 'Erro ao carregar cliente. Verifique se o ID e valido.';
  } finally {
    loading.value = false;
  }
}

// Salvar cliente
async function saveClient() {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  saving.value = true;
  error.value = '';
  success.value = '';

  try {
    // Parse JSONs
    const erpConfig = erpConfigJson.value.trim() ? JSON.parse(erpConfigJson.value) : null;
    const suriConfig = suriConfigJson.value.trim() ? JSON.parse(suriConfigJson.value) : null;
    const generalConfig = generalConfigJson.value.trim() ? JSON.parse(generalConfigJson.value) : null;

    if (isEdit.value) {
      // Atualizar
      const data: UpdateClientDto = {
        client_name: form.value.client_name,
        chatbot_id: form.value.chatbot_id,
        slug: form.value.slug || null,
        provider_type: form.value.provider_type,
        payment_environment: form.value.payment_environment || null,
        erp_type: form.value.erp_type || null,
        is_active: form.value.is_active,
        credentials_encrypted: form.value.credentials_encrypted,
        settings_json: form.value.settings_json || null,
        erp_config: erpConfig,
        suri_config: suriConfig,
        general_config: generalConfig,
      };
      await SuriClientsService.updateClient(clientId.value, data);
      success.value = 'Cliente atualizado com sucesso!';
    } else {
      // Criar
      const data: CreateClientDto = {
        client_name: form.value.client_name,
        chatbot_id: form.value.chatbot_id,
        slug: form.value.slug || null,
        provider_type: form.value.provider_type,
        payment_environment: form.value.payment_environment || null,
        erp_type: form.value.erp_type || null,
        is_active: form.value.is_active,
        credentials_encrypted: form.value.credentials_encrypted,
        settings_json: form.value.settings_json || null,
        erp_config: erpConfig,
        suri_config: suriConfig,
        general_config: generalConfig,
      };
      const result = await SuriClientsService.createClient(data);
      success.value = 'Cliente criado com sucesso!';
      // Redirecionar para edicao
      setTimeout(() => {
        router.push(`/admin/clients/${result.id}`);
      }, 1000);
    }
  } catch (err) {
    console.error('Erro ao salvar cliente:', err);
    error.value = 'Erro ao salvar cliente. Verifique os dados e tente novamente.';
  } finally {
    saving.value = false;
  }
}

function goBack() {
  router.push('/admin/clients');
}

// Auto-gerar slug a partir do nome
watch(() => form.value.client_name, (newName) => {
  if (!isEdit.value && !form.value.slug && newName) {
    form.value.slug = newName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
});

onMounted(() => {
  loadClient();
});
</script>


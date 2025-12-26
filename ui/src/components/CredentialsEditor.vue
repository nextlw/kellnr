<template>
  <div>
    <v-card variant="outlined" class="pa-3">
      <v-card-subtitle class="px-0">Credenciais do Provedor</v-card-subtitle>

      <!-- Template E-Rede -->
      <template v-if="providerType === 'erede'">
        <v-text-field
          v-model="credentials.client_id"
          label="Client ID"
          variant="outlined"
          density="compact"
          class="mb-2"
        />
        <v-text-field
          v-model="credentials.client_secret"
          label="Client Secret"
          variant="outlined"
          density="compact"
          type="password"
          :append-inner-icon="showSecret ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showSecret = !showSecret"
          :type="showSecret ? 'text' : 'password'"
        />
      </template>

      <!-- Template Pagar.me -->
      <template v-else-if="providerType === 'pagarme'">
        <v-text-field
          v-model="credentials.api_key"
          label="API Key"
          variant="outlined"
          density="compact"
          class="mb-2"
          :append-inner-icon="showSecret ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showSecret = !showSecret"
          :type="showSecret ? 'text' : 'password'"
        />
        <v-text-field
          v-model="credentials.encryption_key"
          label="Encryption Key"
          variant="outlined"
          density="compact"
          :append-inner-icon="showSecret2 ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showSecret2 = !showSecret2"
          :type="showSecret2 ? 'text' : 'password'"
        />
      </template>

      <!-- Template MercadoPago -->
      <template v-else-if="providerType === 'mercadopago'">
        <v-text-field
          v-model="credentials.access_token"
          label="Access Token"
          variant="outlined"
          density="compact"
          class="mb-2"
          :append-inner-icon="showSecret ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showSecret = !showSecret"
          :type="showSecret ? 'text' : 'password'"
        />
        <v-text-field
          v-model="credentials.public_key"
          label="Public Key"
          variant="outlined"
          density="compact"
        />
      </template>

      <!-- Sem provedor ou none -->
      <template v-else>
        <v-alert type="info" variant="tonal" density="compact">
          Selecione um provedor de pagamento para configurar as credenciais.
        </v-alert>
      </template>

      <!-- Modo avancado -->
      <v-expansion-panels class="mt-3" variant="accordion">
        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon start size="small">mdi-code-json</v-icon>
            Modo Avancado (JSON)
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-textarea
              v-model="jsonValue"
              variant="outlined"
              rows="4"
              :rules="[jsonRule]"
              hint="Edite o JSON diretamente"
            />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = defineProps<{
  modelValue: string;
  providerType: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const showSecret = ref(false);
const showSecret2 = ref(false);

// Templates por provedor
interface CredentialsErede {
  client_id: string;
  client_secret: string;
}

interface CredentialsPagarme {
  api_key: string;
  encryption_key: string;
}

interface CredentialsMercadopago {
  access_token: string;
  public_key: string;
}

type CredentialsType = CredentialsErede | CredentialsPagarme | CredentialsMercadopago | Record<string, unknown>;

// Parse credenciais do modelValue
const credentials = ref<CredentialsType>({});

// Inicializar credenciais
function parseCredentials(value: string): CredentialsType {
  try {
    return JSON.parse(value) || {};
  } catch {
    return {};
  }
}

// Atualizar quando o provedor mudar
watch(() => props.providerType, (newType) => {
  const current = parseCredentials(props.modelValue);

  // Criar estrutura default baseada no tipo
  if (newType === 'erede') {
    credentials.value = {
      client_id: (current as CredentialsErede).client_id || '',
      client_secret: (current as CredentialsErede).client_secret || '',
    };
  } else if (newType === 'pagarme') {
    credentials.value = {
      api_key: (current as CredentialsPagarme).api_key || '',
      encryption_key: (current as CredentialsPagarme).encryption_key || '',
    };
  } else if (newType === 'mercadopago') {
    credentials.value = {
      access_token: (current as CredentialsMercadopago).access_token || '',
      public_key: (current as CredentialsMercadopago).public_key || '',
    };
  } else {
    credentials.value = current;
  }
}, { immediate: true });

// Inicializar com o valor atual
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    credentials.value = parseCredentials(newValue);
  }
}, { immediate: true });

// Emitir mudancas
watch(credentials, (newCredentials) => {
  emit('update:modelValue', JSON.stringify(newCredentials));
}, { deep: true });

// JSON para modo avancado
const jsonValue = computed({
  get: () => JSON.stringify(credentials.value, null, 2),
  set: (value: string) => {
    try {
      credentials.value = JSON.parse(value);
    } catch {
      // Ignora JSON invalido
    }
  },
});

// Regra de validacao JSON
const jsonRule = (v: string) => {
  try {
    JSON.parse(v);
    return true;
  } catch {
    return 'JSON invalido';
  }
};
</script>


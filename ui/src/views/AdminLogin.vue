<template>
  <v-container fluid class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12">
          <v-card-title class="text-center">
            <v-icon size="48" color="primary" class="mb-2">mdi-shield-account</v-icon>
            <div class="text-h5">Admin Panel</div>
            <div class="text-caption text-medium-emphasis">Gateway de Integrações Suri</div>
          </v-card-title>
          <v-card-text>
            <v-form ref="formRef" @submit.prevent="submit" v-model="isFormValid">
              <v-text-field
                v-model="email"
                label="Email"
                prepend-inner-icon="mdi-email"
                variant="outlined"
                :rules="emailRules"
                type="email"
                autocomplete="email"
                required
                class="mb-3"
              />

              <v-text-field
                v-model="password"
                label="Senha"
                prepend-inner-icon="mdi-lock"
                :type="showPassword ? 'text' : 'password'"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
                variant="outlined"
                :rules="passwordRules"
                autocomplete="current-password"
                required
                class="mb-3"
              />

              <v-alert
                v-if="error"
                type="error"
                class="mb-4"
                density="compact"
                closable
                @click:close="error = ''"
              >
                {{ error }}
              </v-alert>

              <v-alert
                v-if="success"
                type="success"
                class="mb-4"
                density="compact"
              >
                {{ success }}
              </v-alert>

              <v-btn
                color="primary"
                size="large"
                type="submit"
                block
                :disabled="!isFormValid"
                :loading="loading"
              >
                <v-icon start>mdi-login</v-icon>
                Entrar no Admin Panel
              </v-btn>

              <v-divider class="my-4" />

              <div class="text-center">
                <v-btn variant="text" to="/" size="small">
                  <v-icon start>mdi-arrow-left</v-icon>
                  Voltar para o Nexcrate
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>

        <!-- Informações de ajuda -->
        <v-card class="mt-4" variant="outlined">
          <v-card-text class="text-center text-medium-emphasis">
            <v-icon size="small">mdi-information</v-icon>
            <span class="ml-1">Credenciais padrão: admin@admin.com / admin123</span>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useStore } from "../store/store";
import { useRoute, useRouter } from "vue-router";

const formRef = ref();
const isFormValid = ref(false);
const loading = ref(false);
const error = ref("");
const success = ref("");
const email = ref("");
const password = ref("");
const showPassword = ref(false);

const store = useStore();
const route = useRoute();
const router = useRouter();

// Validation rules
const emailRules = [
  (v: string) => !!v || 'Email é obrigatório',
  (v: string) => /.+@.+\..+/.test(v) || 'Email inválido',
];

const passwordRules = [
  (v: string) => !!v || 'Senha é obrigatória',
  (v: string) => v.length >= 6 || 'Senha deve ter pelo menos 6 caracteres',
];

async function submit() {
  if (!isFormValid.value) return;

  loading.value = true;
  error.value = "";
  success.value = "";

  try {
    const loginSuccess = await store.loginSuri(email.value, password.value);

    if (loginSuccess) {
      success.value = "Login realizado com sucesso!";

      // Redirecionar para a página solicitada ou dashboard
      const redirect = route.query.redirect as string;
      setTimeout(() => {
        if (redirect && redirect.startsWith('/admin')) {
          router.push(redirect);
        } else {
          router.push('/admin');
        }
      }, 500);
    } else {
      error.value = "Email ou senha incorretos";
    }
  } catch (err) {
    console.error('Erro no login:', err);
    error.value = "Erro ao conectar com o servidor. Verifique se o backend Suri está rodando.";
  } finally {
    loading.value = false;
  }
}
</script>


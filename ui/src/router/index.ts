import { createRouter, createWebHistory } from 'vue-router'
import Crates from "../views/Crates.vue";
import Login from "../views/Login.vue";
import Settings from "../views/Settings.vue";
import PublishDocs from "../views/PublishDocs.vue";
import Crate from "../views/Crate.vue";
import DocQueue from "../views/DocQueue.vue";
import Landing from "../views/Landing.vue";
import AdminDashboard from "../views/AdminDashboard.vue";
import AdminClients from "../views/AdminClients.vue";
import AdminClientForm from "../views/AdminClientForm.vue";
import AdminLogs from "../views/AdminLogs.vue";
import { auth_required } from "../common/auth";
import { useStore } from "../store/store";

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: Landing,
    meta: {
      requiresAuth: true,
    }
  },
  {
    path: '/crates',
    name: 'Crates',
    component: Crates,
    meta: {
      requiresAuth: true,
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      requiresAuth: false,
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: {
      requiresAuth: true,
    }
  },
  {
    path: '/publishdocs',
    name: 'PublishDocs',
    component: PublishDocs,
    meta: {
      requiresAuth: true,
    }
  },
  {
    path: '/crate',
    name: 'Crate',
    component: Crate,
    meta: {
      requiresAuth: true,
    }
  },
  {
    path: '/docqueue',
    name: 'DocQueue',
    component: DocQueue,
    meta: {
      requiresAuth: true,
    }
  },
  // Rotas do Admin Panel Suri
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: {
      requiresAuth: true,
      requiresSuriAuth: true,
    }
  },
  {
    path: '/admin/clients',
    name: 'AdminClients',
    component: AdminClients,
    meta: {
      requiresAuth: true,
      requiresSuriAuth: true,
    }
  },
  {
    path: '/admin/clients/new',
    name: 'AdminClientNew',
    component: AdminClientForm,
    meta: {
      requiresAuth: true,
      requiresSuriAuth: true,
    }
  },
  {
    path: '/admin/clients/:id',
    name: 'AdminClientEdit',
    component: AdminClientForm,
    meta: {
      requiresAuth: true,
      requiresSuriAuth: true,
    }
  },
  {
    path: '/admin/logs',
    name: 'AdminLogs',
    component: AdminLogs,
    meta: {
      requiresAuth: true,
      requiresSuriAuth: true,
    }
  }
]

const currentPath = window.location.pathname;
const base = currentPath.substring(0, currentPath.lastIndexOf("/") + 1);

const router = createRouter({
  history: createWebHistory(base),
  routes,
});

router.beforeEach(async (to) => {
  const store = useStore();

  // Check if the "auth_required" setting is enabled in NexCode.
  // If it is enabled, the user must be authenticated to view any page, exept the login page.
  // If the user is not authenticated, he will be redirected to the login page.
  if (await auth_required()) {
    if (to.matched.some(record => record.meta.requiresAuth)) {
      if (!store.loggedIn) {
        console.debug("Auth required. Redirecting to login page.");
        return { name: 'Login' }
      }
      else {
        console.debug("Auth required. User is authenticated.");
      }
    }
  }
  else {
    console.debug("Auth not required.");
  }

  // Verificar autenticacao Suri para rotas admin
  if (to.matched.some(record => record.meta.requiresSuriAuth)) {
    const isAuth = await store.checkSuriAuth();
    if (!isAuth) {
      console.debug("Suri auth required. Redirecting to login page.");
      return { name: 'Login', query: { redirect: to.fullPath } };
    }
    console.debug("Suri auth verified. User is authenticated.");
  }
});

export default router

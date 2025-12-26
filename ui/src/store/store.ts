import { defineStore } from 'pinia'
import SuriAuthService from '../services/suri-auth'

export interface State {
    loggedInUser: string | null
    loggedInUserIsAdmin: boolean
    theme: string
    cargoSmallLogo: string
    kellnrSmallLogo: string
    rememberMe: boolean
    rememberMeUser: string | null
    searchCache: boolean
    lightBackgroundImage: string
    darkBackgroundImage: string
    currentBackgroundImage: string
    // Estado adicional para Admin Suri
    suriAuthenticated: boolean
    suriUser: { email: string } | null
    suriLoading: boolean
}

export const useStore = defineStore('store', {
    state: (): State => ({
        loggedInUser: null,
        loggedInUserIsAdmin: false,
        theme: 'dark',
        cargoSmallLogo: 'img/cargo-logo-small-light.png',
        kellnrSmallLogo: 'img/kellnr-logo-small-dark.png',
        rememberMe: false,
        rememberMeUser: null,
        searchCache: false,
        lightBackgroundImage: 'img/blob-scene-haikei3.svg',
        darkBackgroundImage: 'img/layered-peaks-haikei.svg',
        currentBackgroundImage: 'img/layered-peaks-haikei.svg', // Default to dark
        // Estado inicial para Admin Suri
        suriAuthenticated: false,
        suriUser: null,
        suriLoading: false,
    }),
    getters: {
        loggedIn: (state) => state.loggedInUser !== null,
        isDark: (state) => state.theme === 'dark',
        isSuriLoggedIn: (state) => state.suriAuthenticated && state.suriUser !== null
    },
    actions: {
        login(payload: { "user": string, "is_admin": boolean }) {
            this.loggedInUser = payload.user
            this.loggedInUserIsAdmin = payload.is_admin
        },
        logout() {
            this.loggedInUser = null
            this.loggedInUserIsAdmin = false
        },
        toggleTheme() {
            if (this.theme === 'light') {
                this.theme = 'dark'
                this.kellnrSmallLogo = 'img/kellnr-logo-small-dark.png'
                this.currentBackgroundImage = this.darkBackgroundImage
                // Update Vuetify theme dynamically
                this.updateVuetifyTheme('dark')
            } else {
                this.theme = 'light'
                this.cargoSmallLogo = 'img/cargo-logo-small-light.png'
                this.kellnrSmallLogo = 'img/kellnr-logo-small-light.png'
                this.currentBackgroundImage = this.lightBackgroundImage
                // Update Vuetify theme dynamically
                this.updateVuetifyTheme('light')
            }

            // Toggle highlight.js theme
            this.toggleHighlightTheme()
        },
        updateVuetifyTheme(theme: string) {
            // Access Vuetify instance and update theme
            const vuetify = document.querySelector('html')?.getAttribute('data-vue-app')
                ? (window as any)?.$vuetify
                : null;

            if (vuetify && vuetify.theme) {
                vuetify.theme.global.name.value = theme;
            }
        },
        toggleHighlightTheme() {
            // Toggle between highlight.js themes
            const isDark = this.theme === 'dark';

            // Select all highlight.js style links
            const hlLight = document.querySelector('link[href*="highlight.js/styles/github.css"]');
            const hlDark = document.querySelector('link[href*="highlight.js/styles/github-dark.css"]');

            if (hlLight && hlDark) {
                hlLight.setAttribute('disabled', isDark.toString());
                hlDark.setAttribute('disabled', (!isDark).toString());
            }
        },
        // Actions para Admin Suri
        async loginSuri(email: string, password: string): Promise<boolean> {
            this.suriLoading = true;
            try {
                const response = await SuriAuthService.login(email, password);
                if (response.success) {
                    this.suriAuthenticated = true;
                    this.suriUser = { email };
                    return true;
                }
                return false;
            } catch (error) {
                console.error('Erro ao fazer login Suri:', error);
                return false;
            } finally {
                this.suriLoading = false;
            }
        },
        async logoutSuri(): Promise<void> {
            try {
                await SuriAuthService.logout();
            } finally {
                this.suriAuthenticated = false;
                this.suriUser = null;
            }
        },
        async checkSuriAuth(): Promise<boolean> {
            try {
                const response = await SuriAuthService.checkAuth();
                this.suriAuthenticated = response.authenticated;
                this.suriUser = response.email ? { email: response.email } : null;
                return response.authenticated;
            } catch {
                this.suriAuthenticated = false;
                this.suriUser = null;
                return false;
            }
        }
    },
    persist: true
})

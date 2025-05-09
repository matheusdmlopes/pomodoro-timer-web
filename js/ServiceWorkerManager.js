/**
 * Gerenciador centralizado do Service Worker para o Pomodoro Timer
 * Responsável pelo registro, monitoramento e comunicação com o Service Worker
 */

class ServiceWorkerManager {
    constructor() {
        this.isSupported = 'serviceWorker' in navigator;
        this.registration = null;
        this.status = 'uninitialized';
        this.callbacks = {
            message: [],
            registration: [],
            error: []
        };

        // Inicializar se o navegador suportar Service Workers
        if (this.isSupported) {
            this.init();
        } else {
            console.warn('Este navegador não suporta Service Workers.');
        }
    }

    /**
     * Inicializa o gerenciador de Service Worker
     * @returns {Promise<ServiceWorkerRegistration|null>} Promessa resolvida com o registro ou null
     */
    async init() {
        if (!this.isSupported) {
            return null;
        }

        try {
            this.status = 'registering';

            // Registrar o Service Worker
            this.registration = await navigator.serviceWorker.register('/sw.js');
            this.status = 'registered';
            console.log('Service Worker registrado com sucesso:', this.registration.scope);

            // Configurar listener para mensagens
            this._setupMessageListener();

            // Notificar callbacks
            this._notifyRegistrationCallbacks(this.registration);

            return this.registration;
        } catch (error) {
            this.status = 'failed';
            console.error('Erro ao registrar Service Worker:', error);

            // Notificar callbacks de erro
            this._notifyErrorCallbacks(error);

            return null;
        }
    }

    /**
     * Aguarda até que o Service Worker esteja pronto (estado 'activated')
     * @returns {Promise<ServiceWorkerRegistration|null>} Promessa resolvida com o registro ou null
     */
    async whenReady() {
        if (!this.isSupported) {
            return null;
        }

        try {
            // Se já tivermos um registro, verificar se está ativo
            if (this.registration && this.registration.active) {
                return this.registration;
            }

            // Caso contrário, esperar pelo estado 'ready'
            this.registration = await navigator.serviceWorker.ready;
            this.status = 'ready';
            console.log('Service Worker está ativo e pronto para uso');
            return this.registration;
        } catch (error) {
            console.error('Erro ao aguardar Service Worker ficar pronto:', error);
            return null;
        }
    }

    /**
     * Envia uma mensagem para o Service Worker
     * @param {any} message Mensagem a ser enviada
     * @returns {Promise<boolean>} Promessa resolvida com true se a mensagem foi enviada
     */
    async sendMessage(message) {
        if (!this.isSupported || !this.registration || !this.registration.active) {
            return false;
        }

        try {
            this.registration.active.postMessage(message);
            return true;
        } catch (error) {
            console.error('Erro ao enviar mensagem para o Service Worker:', error);
            return false;
        }
    }

    /**
     * Adiciona um callback para quando o Service Worker for registrado
     * @param {Function} callback Função a ser chamada com o registro
     */
    onRegistration(callback) {
        if (typeof callback === 'function') {
            this.callbacks.registration.push(callback);

            // Se já tivermos um registro, chamar o callback imediatamente
            if (this.registration) {
                callback(this.registration);
            }
        }
    }

    /**
     * Adiciona um callback para quando o Service Worker enviar uma mensagem
     * @param {Function} callback Função a ser chamada com o evento da mensagem
     */
    onMessage(callback) {
        if (typeof callback === 'function') {
            this.callbacks.message.push(callback);
        }
    }

    /**
     * Adiciona um callback para quando ocorrer um erro no Service Worker
     * @param {Function} callback Função a ser chamada com o erro
     */
    onError(callback) {
        if (typeof callback === 'function') {
            this.callbacks.error.push(callback);
        }
    }

    /**
     * Configura o listener para mensagens do Service Worker
     * @private
     */
    _setupMessageListener() {
        if (!this.isSupported) {
            return;
        }

        navigator.serviceWorker.addEventListener('message', event => {
            // Notificar todos os callbacks registrados
            this._notifyMessageCallbacks(event);
        });
    }

    /**
     * Notifica todos os callbacks de registro
     * @param {ServiceWorkerRegistration} registration O registro do Service Worker
     * @private
     */
    _notifyRegistrationCallbacks(registration) {
        this.callbacks.registration.forEach(callback => {
            try {
                callback(registration);
            } catch (error) {
                console.error('Erro em callback de registro:', error);
            }
        });
    }

    /**
     * Notifica todos os callbacks de mensagem
     * @param {MessageEvent} event O evento de mensagem
     * @private
     */
    _notifyMessageCallbacks(event) {
        this.callbacks.message.forEach(callback => {
            try {
                callback(event);
            } catch (error) {
                console.error('Erro em callback de mensagem:', error);
            }
        });
    }

    /**
     * Notifica todos os callbacks de erro
     * @param {Error} error O erro ocorrido
     * @private
     */
    _notifyErrorCallbacks(error) {
        this.callbacks.error.forEach(callback => {
            try {
                callback(error);
            } catch (err) {
                console.error('Erro em callback de erro:', err);
            }
        });
    }
}

// Criar uma instância global
let serviceWorkerManager;

// Inicializar quando o documento estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    serviceWorkerManager = new ServiceWorkerManager();

    // Expor para uso global
    window.serviceWorkerManager = serviceWorkerManager;
}); 
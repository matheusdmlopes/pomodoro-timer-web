/**
 * Browser notifications functionality for the Pomodoro Timer
 */

class NotificationManager {
    constructor() {
        this.isSupported = 'Notification' in window;
        this.permissionGranted = false;
        this.notificationEnabled = false;
        this.initialized = false;
        this.iconUrl = 'assets/favicon.ico'; // Usando o favicon existente
        this.serviceWorkerRegistration = null;

        // Inicializar se o navegador suportar notificações
        if (this.isSupported) {
            this.checkPermission();
            // Não é mais necessário inicializar o Service Worker aqui
            // Vamos apenas configurar para usá-lo quando estiver disponível
        } else {
            console.warn('Este navegador não suporta notificações.');
        }
    }

    /**
     * Obtém o registro do Service Worker do gerenciador centralizado
     * @returns {Promise<ServiceWorkerRegistration|null>} Promessa resolvida com o registro ou null
     */
    async getServiceWorkerRegistration() {
        // Se já tivermos uma referência, retorná-la
        if (this.serviceWorkerRegistration) {
            return this.serviceWorkerRegistration;
        }

        // Se o gerenciador de Service Worker estiver disponível, pedir o registro
        if (window.serviceWorkerManager) {
            try {
                this.serviceWorkerRegistration = await window.serviceWorkerManager.whenReady();
                return this.serviceWorkerRegistration;
            } catch (error) {
                console.error('Erro ao obter registro do Service Worker:', error);
                return null;
            }
        }

        // Fallback para o método antigo se o gerenciador não estiver disponível
        if ('serviceWorker' in navigator) {
            try {
                this.serviceWorkerRegistration = await navigator.serviceWorker.ready;
                return this.serviceWorkerRegistration;
            } catch (error) {
                console.error('Erro ao obter registro do Service Worker (fallback):', error);
                return null;
            }
        }

        return null;
    }

    /**
     * Verifica a permissão atual de notificações
     */
    checkPermission() {
        this.permissionGranted = Notification.permission === 'granted';
        this.initialized = true;
        console.log('Status da permissão de notificação:', Notification.permission);
        return this.permissionGranted;
    }

    /**
     * Solicita permissão para enviar notificações
     * @returns {Promise<boolean>} Promise resolvida com true se a permissão foi concedida
     */
    async requestPermission() {
        if (!this.isSupported) {
            console.warn('Não é possível solicitar permissão - navegador não suporta notificações.');
            return false;
        }

        try {
            console.log('Solicitando permissão de notificação...');
            const permission = await Notification.requestPermission();
            this.permissionGranted = permission === 'granted';
            console.log('Permissão de notificação:', permission);

            // Se a permissão foi concedida, garantir que temos o registro do Service Worker
            if (this.permissionGranted) {
                await this.getServiceWorkerRegistration();
            }

            return this.permissionGranted;
        } catch (error) {
            console.error('Erro ao solicitar permissão para notificações:', error);
            this.permissionGranted = false;
            return false;
        }
    }

    /**
     * Verifica se as notificações estão habilitadas e com permissão concedida
     * @returns {boolean} Verdadeiro se as notificações podem ser enviadas
     */
    canNotify() {
        const result = this.isSupported && this.permissionGranted && this.notificationEnabled;
        if (!result && this.notificationEnabled) {
            console.warn('Notificações estão habilitadas mas não podem ser enviadas:', {
                isSupported: this.isSupported,
                permissionGranted: this.permissionGranted,
                notificationEnabled: this.notificationEnabled
            });
        }
        return result;
    }

    /**
     * Habilita ou desabilita as notificações
     * @param {boolean} enabled Estado das notificações
     */
    setEnabled(enabled) {
        console.log('Notificações do navegador:', enabled ? 'habilitadas' : 'desabilitadas');
        this.notificationEnabled = enabled;
        if (enabled && !this.permissionGranted) {
            this.requestPermission().then(granted => {
                this.permissionGranted = granted;
                if (!granted) {
                    // Se a permissão for negada, desabilitar a opção
                    this.notificationEnabled = false;
                    if (document.getElementById('browser-notifications-enabled')) {
                        document.getElementById('browser-notifications-enabled').checked = false;
                    }
                    console.warn('Permissão para notificações negada.');
                }
            });
        }
    }

    /**
     * Envia uma notificação
     * @param {string} title Título da notificação
     * @param {object} options Opções da notificação
     * @returns {Promise<boolean>} Promise resolvida com true se a notificação foi enviada
     */
    async sendNotification(title, options = {}) {
        if (!this.canNotify()) {
            if (this.notificationEnabled && !this.permissionGranted) {
                this.requestPermission();
            }
            return false;
        }

        // Configurações padrão
        const defaultOptions = {
            icon: this.iconUrl,
            badge: this.iconUrl,
            silent: false,
            requireInteraction: false
        };

        // Mesclar opções
        const notificationOptions = { ...defaultOptions, ...options };

        try {
            console.log('Enviando notificação:', title, notificationOptions);

            // Obter o registro do Service Worker se necessário para actions
            if (notificationOptions.actions && !this.serviceWorkerRegistration) {
                this.serviceWorkerRegistration = await this.getServiceWorkerRegistration();
            }

            // Verificar se temos Service Worker disponível para notificações com ações
            if (this.serviceWorkerRegistration && notificationOptions.actions) {
                // Usar Service Worker para notificações com actions
                await this.serviceWorkerRegistration.showNotification(title, notificationOptions);
                return true;
            } else {
                // Usar API de Notification padrão para notificações simples
                const notificationOpts = { ...notificationOptions };

                // Remover propriedades não suportadas na API padrão
                delete notificationOpts.actions;

                const notification = new Notification(title, notificationOpts);

                // Manipulador de evento de clique
                notification.onclick = function () {
                    window.focus();
                    if (notificationOptions.onClick) {
                        notificationOptions.onClick();
                    }
                    this.close();
                };

                // Fechar automaticamente após 5 segundos se não requerer interação
                if (!notificationOptions.requireInteraction) {
                    setTimeout(() => {
                        notification.close();
                    }, 5000);
                }

                return true;
            }
        } catch (error) {
            console.error('Erro ao enviar notificação:', error);
            return false;
        }
    }

    /**
     * Envia uma notificação de timer concluído
     * @param {string} mode Modo atual (pomodoro, short-break, long-break)
     * @param {number} completedSessions Número de sessões concluídas
     */
    notifyTimerComplete(mode, completedSessions) {
        console.log('Notificação de timer concluído solicitada. Modo:', mode, 'Sessões:', completedSessions);

        if (!this.canNotify()) {
            console.warn('Não é possível enviar notificação de timer concluído - canNotify() retornou false');
            return;
        }

        if (!window.i18n) {
            console.error('Objeto i18n não disponível! Usando textos padrão.');
            const defaultTitle = mode === 'pomodoro' ? 'Work time finished!' :
                mode === 'short-break' ? 'Short break finished!' :
                    mode === 'long-break' ? 'Long break finished!' : 'Timer finished!';

            const defaultBody = `Sessions completed: ${completedSessions}`;

            return this.sendNotification(defaultTitle, {
                body: defaultBody,
                requireInteraction: true,
                onClick: () => {
                    if (window.timer && typeof window.timer.start === 'function') {
                        window.timer.start();
                    }
                }
            });
        }

        try {
            const i18n = window.i18n;
            let title, body;

            // Determinar título com base no modo
            switch (mode) {
                case 'pomodoro':
                    title = i18n.get('notificationPomodoro');
                    break;
                case 'short-break':
                    title = i18n.get('notificationShortBreak');
                    break;
                case 'long-break':
                    title = i18n.get('notificationLongBreak');
                    break;
                default:
                    title = i18n.get('appTitle');
            }

            // Corpo da mensagem com contagem de sessões
            body = i18n.get('notificationMessage').replace('{0}', completedSessions);

            console.log('Enviando notificação com título:', title, 'e corpo:', body);

            // Configurar ações somente se temos Service Worker
            const options = {
                body: body,
                requireInteraction: true,
                onClick: () => {
                    // Se a notificação for clicada, iniciar o próximo ciclo
                    if (window.timer && typeof window.timer.start === 'function') {
                        window.timer.start();
                    }
                }
            };

            // Verificar se o Service Worker está disponível para adicionar ações
            this.getServiceWorkerRegistration().then(registration => {
                if (registration) {
                    options.actions = [
                        {
                            action: 'start-next',
                            title: i18n.get('notificationStart')
                        }
                    ];
                }

                // Enviar notificação
                this.sendNotification(title, options);
            });
        } catch (error) {
            console.error('Erro ao processar notificação:', error);

            // Fallback em caso de erro
            const defaultTitle = 'Timer Completed';
            const defaultBody = `Sessions completed: ${completedSessions}`;

            this.sendNotification(defaultTitle, {
                body: defaultBody,
                requireInteraction: true
            });
        }
    }
}

// Inicializar o gerenciador de notificações quando a página carregar
let notificationManager;
document.addEventListener('DOMContentLoaded', () => {
    notificationManager = new NotificationManager();

    // Expor para uso global
    window.notificationManager = notificationManager;

    // Verificar configurações salvas e aplicar estado inicial
    const savedSettings = JSON.parse(localStorage.getItem('pomodoroSettings')) || {};

    // Se a permissão já estiver concedida e a configuração estiver ativada, habilitar automaticamente
    if (Notification.permission === 'granted' && savedSettings.browserNotificationsEnabled) {
        console.log('Permissão de notificação já concedida, habilitando notificações automaticamente');
        notificationManager.permissionGranted = true;
        notificationManager.setEnabled(true);
    }
    // Se a configuração estiver ativada mas a permissão não estiver concedida, tentar solicitar
    else if (savedSettings.browserNotificationsEnabled) {
        console.log('Configuração de notificação ativada, solicitando permissão');
        notificationManager.setEnabled(true);
    }

    // Adicionar evento para solicitar permissão quando o checkbox for marcado
    const notificationCheckbox = document.getElementById('browser-notifications-enabled');
    if (notificationCheckbox) {
        notificationCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                // Solicitar permissão se o checkbox for marcado
                notificationManager.requestPermission().then(granted => {
                    if (!granted) {
                        // Se a permissão for negada, desmarcar o checkbox
                        e.target.checked = false;

                        // Atualizar as configurações
                        if (window.settingsManager && window.settingsManager.saveSettings) {
                            window.settingsManager.saveSettings();
                        }

                        // Informar ao usuário
                        alert(window.i18n ? window.i18n.get('notificationPermissionNeeded') : 'Permission needed for notifications');
                    }
                });
            } else {
                // Desabilitar notificações
                notificationManager.setEnabled(false);
            }
        });
    }

    // Configurar listener para mensagens do Service Worker via ServiceWorkerManager
    if (window.serviceWorkerManager) {
        // Usar o novo gerenciador para receber mensagens
        window.serviceWorkerManager.onMessage(event => {
            if (event.data && event.data.action === 'start-timer') {
                if (window.timer && typeof window.timer.start === 'function') {
                    window.timer.start();
                }
            }
        });
    } else {
        // Fallback para o método antigo
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', event => {
                if (event.data && event.data.action === 'start-timer') {
                    if (window.timer && typeof window.timer.start === 'function') {
                        window.timer.start();
                    }
                }
            });
        }
    }
}); 
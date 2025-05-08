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

        // Inicializar se o navegador suportar notificações
        if (this.isSupported) {
            this.checkPermission();
        } else {
            console.warn('Este navegador não suporta notificações.');
        }
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
     * @returns {Notification|null} Objeto de notificação ou null se não for possível notificar
     */
    sendNotification(title, options = {}) {
        if (!this.canNotify()) {
            if (this.notificationEnabled && !this.permissionGranted) {
                this.requestPermission();
            }
            return null;
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
            const notification = new Notification(title, notificationOptions);

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

            return notification;
        } catch (error) {
            console.error('Erro ao enviar notificação:', error);
            return null;
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

            // Enviar notificação
            this.sendNotification(title, {
                body: body,
                requireInteraction: true,
                actions: [
                    {
                        action: 'start-next',
                        title: i18n.get('notificationStart')
                    }
                ],
                onClick: () => {
                    // Se a notificação for clicada, iniciar o próximo ciclo
                    if (window.timer && typeof window.timer.start === 'function') {
                        window.timer.start();
                    }
                }
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
}); 
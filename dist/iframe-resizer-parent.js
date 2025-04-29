class IFrameResizer {
    constructor(iframe, options = {}) {
        this.iframe = iframe instanceof HTMLElement ? iframe : document.querySelector(iframe);
        if (!this.iframe) {
            console.error("Iframe element not found or selector invalid.");
            return;
        }

        const defaultOptions = {
            targetOrigin: '*',
            log: false,
            onResize: null,
            onScroll: null,
        };
        this.options = { ...defaultOptions, ...options };
        this.customMessageHandlers = new Map(); // Map für Custom-Events

        this.handleMessage = this.handleMessage.bind(this); // Bind the proper method
        window.addEventListener('message', this.handleMessage); // Attach handleMessage to the event listener

        this.log('ParentIFrameResizer initialized');

        // Automatische Initialnachricht an den iFrame senden
        this.sendMessage('init');
    }

    // Methode zum Registrieren eines Custom-Event-Handlers
    onMessage(type, callback) {
        if (typeof type !== 'string') {
            console.error(`[LOG][IFRAME PARENT]: Invalid type for message handler. Expected a string, but received:`, type);
            return;
        }

        if (typeof callback !== 'function') {
            console.error(`[LOG][IFRAME PARENT]: Invalid callback for message handler. Expected a function, but received:`, callback);
            return;
        }

        this.customMessageHandlers.set(type, callback);
        this.log(`Custom message handler registered for type: ${type}`);
        return this; // Ermöglicht die Verkettung von Methoden
    }

    // Haupt-Message-Handler
    handleMessage(event) {
        if (event.source !== this.iframe.contentWindow) {
            this.log('Message received, but it is not from the expected iframe source.');
            return;
        }

        this.log('Message received', event.data);

        // Validierung der Nachricht
        if (typeof event.data !== 'object' || event.data === null || !event.data.type) {
            this.log('Invalid message format or missing type in event data.', event.data);
            return;
        }

        const { type, ...payload } = event.data;

        // Standardnachrichten wie 'resize' und 'scroll' behandeln
        switch (type) {
            case 'resize':
                if (typeof this.options.onResize === 'function') {
                    this.options.onResize(payload.width, payload.height);
                } else {
                    this.log('No onResize handler defined in options.', payload);
                }
                break;

            case 'scroll':
                if (typeof this.options.onScroll === 'function') {
                    this.options.onScroll(payload.left, payload.top);
                } else {
                    this.log('No onScroll handler defined in options.', payload);
                }
                break;

            default:
                // Custom-Nachrichtentyp verarbeiten
                if (this.customMessageHandlers.has(type)) {
                    try {
                        const handler = this.customMessageHandlers.get(type);
                        handler(payload, event); // Custom-Handler ausführen
                        this.log(`Custom message processed: ${type}`, payload);
                    } catch (error) {
                        this.log(`Error in custom message handler for type: ${type}`, error, true);
                    }
                } else {
                    this.log(`No handler registered for message type: ${type}`, payload, false, true);
                }
        }
    }

    // Nachricht an den iFrame senden
    sendMessage(type, data = {}) {
        if (!this.iframe || !this.iframe.contentWindow) {
            this.log('Error: Iframe not found or contentWindow not available.', { iframe: this.iframe });
            return;
        }
        if (!type || typeof type !== 'string') {
            this.log('Error: Message type is invalid or not specified.', { type });
            return;
        }
        if (!this.options.targetOrigin || this.options.targetOrigin === '*') {
            this.log('Warning: Sending message to a potentially insecure targetOrigin ("*")', { targetOrigin: this.options.targetOrigin });
        }

        try {
            this.iframe.contentWindow.postMessage({ type, ...data }, this.options.targetOrigin);
            this.log('Message sent to iframe', { type, data, targetOrigin: this.options.targetOrigin });
        } catch (error) {
            this.log('Error sending message to iframe:', error);
        }
    }

    // Debug-Log-Ausgabe
    log(message, data = null, error = false, warn = false) {
        if (this.options.log) {
            if (!error && !warn) {
                console.log(`[LOG][IFRAME PARENT][${window.location.host}]: ${message}`, data);
            } else if (error) {
                console.error(`[LOG][IFRAME PARENT][${window.location.host}]: ${message}`, data);
            } else {
                console.warn(`[LOG][IFRAME PARENT][${window.location.host}]: ${message}`, data);
            }
        }
    }

    // Entferne alle registrierten Event-Handler
    destroy() {
        this.log('Destroying ParentIFrameResizer');
        window.removeEventListener('message', this.handleMessage);
        this.customMessageHandlers.clear();
    }
}

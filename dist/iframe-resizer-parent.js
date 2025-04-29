// noinspection JSUnresolvedReference,JSUnusedGlobalSymbols

/**
 * IFrameResizer class for the parent window
 * Manages communication with child iframes and handles resizing events
 */
class IFrameResizer {
    /**
     * Creates an instance of IFrameResizer
     * @param {HTMLElement|string} iframe - The iframe element or selector
     * @param {Object} options - Configuration options
     */
    constructor(iframe, options = {}) {
        const defaultOptions = {
            targetOrigin: '*',
            log: false,
            onResize: null,
            onScroll: null,
            initData: {}
        };
        this.options = { ...defaultOptions, ...options };

        this.iframe = iframe instanceof HTMLElement ? iframe : document.querySelector(iframe);
        if (!this.iframe) {
            this.log('Iframe element not found or selector invalid.', null, true, false);
            return;
        }

        this.customMessageHandlers = new Map(); // Map für Custom-Events
        this.isReady = false;
        this.readyCallback = null;

        this.handleMessage = this.handleMessage.bind(this); // Bind the proper method
        window.addEventListener('message', this.handleMessage); // Attach handleMessage to the event listener

        // Ready-Handler registrieren
        this.onMessage('ready', (payload) => {
            this.isReady = true;
            this.log('Child iframe is ready', payload);
            if (this.readyCallback) {
                this.readyCallback(payload);
            }
        });

        this.log('ParentIFrameResizer initialized');
    }

    /**
     * Registers a callback to be executed when the iframe is ready
     * @param {Function} callback - Function to be called when iframe is ready
     * @returns {IFrameResizer} Current instance for method chaining
     */
    onReady(callback) {
        if (this.isReady) {
            callback();
        } else {
            this.readyCallback = callback;
        }
        return this;
    }

    /**
     * Registers a custom message handler for specific message types
     * @param {string} type - Message type to handle
     * @param {Function} callback - Handler function for the message type
     * @returns {IFrameResizer} Current instance for method chaining
     */
    onMessage(type, callback) {
        if (typeof type !== 'string') {
            this.log(`Invalid type for message handler. Expected a string, but received:`, typeof type, true, false);
            return this;
        }

        if (typeof callback !== 'function') {
            this.log(`Invalid callback for message handler. Expected a function, but received:`, typeof callback, true, false);
            return this;
        }

        this.customMessageHandlers.set(type, callback);
        this.log(`Custom message handler registered for type: ${type}`);
        return this; // Ermöglicht die Verkettung von Methoden
    }

    /**
     * Main message handler for incoming postMessages
     * Processes resize, scroll and custom message types
     * @param {MessageEvent} event - The message event from the iframe
     */
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

    /**
     * Sends a message to the child iframe
     * @param {string} type - The type of message to send
     * @param {Object} data - Data to be sent with the message
     */
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

    /**
     * Logs debug information if logging is enabled
     * @param {string} message - Message to log
     * @param {*} data - Additional data to log
     * @param {boolean} error - Whether to log as error
     * @param {boolean} warn - Whether to log as warning
     */
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

    /**
     * Cleans up event listeners and handlers
     * Should be called when the iframe is removed
     */
    destroy() {
        this.log('Destroying ParentIFrameResizer');
        window.removeEventListener('message', this.handleMessage);
        this.customMessageHandlers.clear();
    }
}

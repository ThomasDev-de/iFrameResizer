if (typeof window.IFrameResizer === 'undefined') {
    /**
     * @typedef {Object} IFrameResizerFactory
     * @property {Function|null} onReady
     * @property {function(Object): Object} create
     * @property {function(): boolean} hasParent
     */

    /** @type {IFrameResizerFactory} */
    const factory = {
        onReady: null,
        create: (options = {}) => {
            const IFrameResizerInstance = new window.IFrameResizerClass(options);

            if (typeof factory.onReady === 'function') {
                factory.onReady(IFrameResizerInstance);
            }

            return IFrameResizerInstance;
        },
        hasParent: () => window.IFrameResizerClass.hasParent()
    };

    window.IFrameResizer = factory;

    /**
     * Main class for handling iframe resizing and communication with the parent window
     * Implements a singleton pattern to ensure only one instance is active
     */
    window.IFrameResizerClass = class IFrameResizer {
        static instance = null; // Holds the single instance of IFrameResizer

        /**
         * Creates a new IFrameResizer instance with the given options
         * @param {Object} options - Configuration options for the resizer
         */
        constructor(options = {}) {
            const defaultOptions = {
                targetOrigin: '*',
                resize: true,
                scroll: true,
                log: false,
                initData: {}
            };
            this.options = {...defaultOptions, ...options};
            // Check if we are in an iFrame
            if (!IFrameResizer.hasParent()) {
                this.log(`Not running inside an iFrame. Initialization aborted.`, null, true, false);
                return; // No iFrame, no initialization
            } else {
                this.log(`Running inside an iFrame.`);
            }

            // Instance check and clean up old ones (singleton pattern)
            if (IFrameResizer.instance !== null) {
                IFrameResizer.instance.destroy();
            }

            IFrameResizer.instance = this;

            this.lastHeight = null;
            this.lastWidth = null;
            this.observer = null;
            this.customMessageHandlers = new Map();

            // Message handler setup
            this.handleMessage = this.handleMessage.bind(this); // Bind method to instance
            window.addEventListener('message', this.handleMessage);

            this.log('Initializing', this.options);

            this.initWhenBodyIsReady();
        }

        /**
         * Starts listeners after document.body exists
         */
        initWhenBodyIsReady() {
            if (!document.body) {
                document.addEventListener('DOMContentLoaded', () => this.initWhenBodyIsReady(), {once: true});
                return;
            }

            if (this.options.resize) {
                this.initResizeListener();
                this.onResize(true);
            }
            if (this.options.scroll) {
                this.initScrollListener();
            }

            this.sendReady();
        }

        /**
         * Initializes the resize listener using ResizeObserver
         * Monitors the document body for size changes
         */
        initResizeListener() {
            this.onResize = this.onResize.bind(this);

            if (typeof ResizeObserver !== 'function') {
                this.log('ResizeObserver is not available. Automatic resizing disabled.', null, true, false);
                return;
            }

            // Callback function for the ResizeObserver
            const resizeObserverCallback = (entries) => {
                for (const entry of entries) {
                    if (entry.target === document.body) {
                        this.onResize();
                    }
                }
            };

            this.observer = new ResizeObserver(resizeObserverCallback);
            this.observer.observe(document.body);
        }

        /**
         * Sends a ready signal after listeners are registered
         */
        sendReady() {
            this.log('Sending ready message');
            setTimeout(() => {
                this.sendMessage('ready', {});
            }, 0);
        }

        /**
         * Initializes the scroll listener
         * Attaches scroll event handler to the window
         */
        initScrollListener() {
            this.onScroll = this.onScroll.bind(this);
            window.addEventListener('scroll', this.onScroll);
        }

        /**
         * Handles resize events and send new dimensions to parent
         * @param {boolean} force - Force sending dimensions even if unchanged
         */
        onResize(force = false) {
            if (IFrameResizer.instance && document.body) {
                // const reflow = document.body.offsetHeight; // Erzwungener Reflow zur Sicherstellung der Browser-Berechnung
                const newHeight = document.body.scrollHeight; // Höhe basierend auf aktuellem Inhalt
                const newWidth = document.body.scrollWidth;
                if (force || newHeight !== this.lastHeight || newWidth !== this.lastWidth) { // newWidth berücksichtigen
                    this.lastHeight = newHeight;
                    this.lastWidth = newWidth; // newWidth speichern
                    this.sendMessage('resize', {height: newHeight, width: newWidth}); // newWidth mitsenden
                }
            }
        }

        /**
         * Handles scroll events and sends scroll position to parent
         */
        onScroll() {
            if (IFrameResizer.instance) {
                const top = window.scrollY || document.documentElement.scrollTop;
                const left = window.scrollX || document.documentElement.scrollLeft;
                this.sendMessage('scroll', {top, left});
            }
        }

        /**
         * Processes incoming messages from the parent window
         * Validates origin and routes messages to appropriate handlers
         * @param {MessageEvent} event - The message event from the parent
         */
        handleMessage(event) {
            // Message origin validation
            if (this.options.targetOrigin !== '*' && event.origin !== this.options.targetOrigin) {
                this.log(`Message origin mismatch: expected ${this.options.targetOrigin}, got ${event.origin}`, null, false, true);
                return;
            }

            if (typeof event.data !== 'object' || event.data === null || !event.data.type) {
                this.log('Invalid message format or missing type in event data.', event.data, false, true);
                return;
            }

            const {type, ...data} = event.data;

            // Wenn event.data keinen "type" hat, ergibt dies undefined
            if (!this.customMessageHandlers.has(type)) {
                this.log(`No handler registered for message type: ${type}`, data, false, true);
                return; // Keine Aktion, da kein Handler registriert wurde
            }


            if (this.customMessageHandlers.has(type)) {
                const handler = this.customMessageHandlers.get(type);
                try {
                    handler(data, event); // Den registrierten Callback aufrufen
                    this.log(`Custom message processed: ${type}`, data);
                } catch (error) {
                    this.log(`Error in custom message handler for type: ${type}`, error, true);
                }
            } else {
                this.log(`No handler registered for message type: ${type}`, data, false, true);
            }
        }

        /**
         * Registers a custom message handler for a specific message type
         * @param {string} type - The message type to handle
         * @param {Function} callback - The callback function to execute
         * @returns {IFrameResizer} Current instance for chaining
         */
        onMessage(type, callback) {
            if (IFrameResizer.instance) {
                if (typeof type === 'string' && typeof callback === 'function') {
                    this.customMessageHandlers.set(type, callback);
                    this.log(`Custom message handler registered for type: ${type}`);
                } else {
                    this.log(`Invalid handler for message type: ${type}. Expected a string and a function.`, null, true, false);
                }
            }
            return this; // Rückgabe der aktuellen Instanz für Verkettung
        }

        /**
         * Sends a message to the parent window
         * @param {string} type - The type of message to send
         * @param {Object} data - The data to send with the message
         * @returns {IFrameResizer} Current instance for chaining
         */
        sendMessage(type, data) {
            if (IFrameResizer.instance) {
                this.log('postMessage', {type, ...data});
                window.parent.postMessage({type, ...data}, this.options.targetOrigin);
            } else {
                this.log('IFrameResizer is not initialized. Cannot send message.', null, true, false);
            }
            return this;
        }

        /**
         * Logs messages if logging is enabled in options
         * @param {string} message - The message to log
         * @param {*} data - Additional data to log
         * @param {boolean} error - Whether to log as error
         * @param {boolean} warn - Whether to log as warning
         */
        log(message, data = null, error = false, warn = false) {
            if (this.options.log) {
                if (!error && !warn) {
                    console.log(`[LOG][IFRAME CHILD][${window.location.host}]: ${message}`, data);
                } else if (error) {
                    console.error(`[LOG][IFRAME CHILD][${window.location.host}]: ${message}`, data);
                } else {
                    console.warn(`[LOG][IFRAME CHILD][${window.location.host}]: ${message}`, data);
                }
            }
        }

        /**
         * Cleans up the IFrameResizer instance
         * Removes all event listeners and clears registered handlers
         */
        destroy() {
            this.log('Destroying IFrameResizer instance');

            if (this.options.resize) {
                this.observer && this.observer.unobserve(document.body);
            }
            if (this.options.scroll) {
                window.removeEventListener('scroll', this.onScroll);
            }
            this.customMessageHandlers.clear(); // Entferne alle registrierten Handler
            // entfernt den Message-Listener
            window.removeEventListener('message', this.handleMessage);

            this.observer = null;
            this.lastHeight = null;
            this.lastWidth = null;
            IFrameResizer.instance = null;
        }

        /**
         * Checks if the current window is inside an iframe
         * @returns {boolean} True if running inside an iframe
         */
        static hasParent() {
            return window.self !== window.top;
        }
    };
}

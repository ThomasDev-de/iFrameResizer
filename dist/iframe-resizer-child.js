/**
 * IFrameResizer: A JavaScript utility class for resizing and communicating iFrames with their parent windows.
 *
 * @name IFrameResizer
 * @version 1.0.0
 * @author Thomas Kirsch
 * @date 2025-01-16
 *
 * @description
 * The `IFrameResizer` class provides a solution for managing the dimensions and scrolling of an embedded
 * iFrame from within the iFrame itself. It is designed to work in conjunction with the parent window, sending
 * messages about size or scroll position changes via `postMessage` API. This class ensures seamless
 * communication and adaptation of the iFrame content, improving user experience and simplifying integration.
 *
 * Key Features:
 * - Automatically detects changes in DOM content to resize the parent iFrame.
 * - Sends scroll event information to the parent.
 * - Designed with a singleton pattern to ensure only one instance of the utility runs at a time.
 * - Includes logging features for easier debugging.
 *
 * Usage Example:
 * ```JavaScript
 * // Create a new instance of IFrameResizer with custom options
 * const IFrameResizer = window.IFrameResizer.create({
 *    targetOrigin: 'https://example.com', // Specify the parent window's origin
 *    resize: true, // Enable resize listener
 *    scroll: true, // Enable scroll listener
 *    log: true, // Enable debugging logs
 * });
 * ```
 *
 * @class IFrameResizer
 */
window.IFrameResizer = {
    onReady: null,
    create: (options = {}) => {
        const IFrameResizerInstance = new IFrameResizer(options);

        if (typeof window.IFrameResizer.onReady === 'function') {
            window.IFrameResizer.onReady(IFrameResizerInstance);
        }

        return IFrameResizerInstance;
    }
};

class IFrameResizer {
    static instance = null;

    constructor(options = {}) {
        // Check if we are in an iFrame
        if (!IFrameResizer.hasParent()) {
            console.error(`[LOG][IFRAME CHILD][${window.location.host}]: Not running inside an iFrame. Initialization aborted.`);
            return; // No iFrame, no initialization
        } else {
            console.log(`[LOG][IFRAME CHILD][${window.location.host}]: Running inside an iFrame.`);
        }

        // Instance check and clean up old ones (singleton pattern)
        if (IFrameResizer.instance !== null) {
            IFrameResizer.instance.destroy();
        }

        IFrameResizer.instance = this;

        this.lastHeight = null;
        this.lastWidth = null;
        const defaultOptions = {
            targetOrigin: '*',
            resize: true,
            scroll: true,
            log: false
        };
        this.options = {...defaultOptions, ...options};
        this.observer = null;

        // Map zur Registrierung von Custom-Message-Handlern
        this.customMessageHandlers = new Map();

        // Message handler setup
        this.handleMessage = this.handleMessage.bind(this); // Bind method to instance
        window.addEventListener('message', this.handleMessage);


        this.log('Initializing', this.options);

        if (this.options.resize) {
            this.initResizeListener();
        }
        if (this.options.scroll) {
            this.initScrollListener();
        }
        this.sendMessage('init')
    }

    // Starts resize listener
    initResizeListener() {
        this.onResize = this.onResize.bind(this);

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

    // Starts a scroll listener
    initScrollListener() {
        this.onScroll = this.onScroll.bind(this);
        window.addEventListener('scroll', this.onScroll);
    }

    // Called when the size changes
    onResize(force = false) {
        if (IFrameResizer.instance) {
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

    // Called when scrolling
    onScroll() {
        if (IFrameResizer.instance) {
            const top = window.scrollY || document.documentElement.scrollTop;
            const left = window.scrollX || document.documentElement.scrollLeft;
            this.sendMessage('scroll', {top, left});
        }
    }

    // Verarbeitet eingehende Nachrichten vom parent-Fenster
    handleMessage(event) {
        // Message origin validation
        if (this.options.targetOrigin !== '*' && event.origin !== this.options.targetOrigin) {
            this.log(`Message origin mismatch: expected ${this.options.targetOrigin}, got ${event.origin}`, null, false, true);
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

    // Registriert einen Custom-Message-Handler für einen bestimmten Typ
    onMessage(type, callback) {
        if (IFrameResizer.instance) {
            if (typeof type === 'string' && typeof callback === 'function') {
                this.customMessageHandlers.set(type, callback);
                this.log(`Custom message handler registered for type: ${type}`);
            } else {
                console.error(`[LOG][IFRAME CHILD]: Invalid handler for message type: ${type}. Callback must be a function.`);
            }
        }
        return this; // Rückgabe der aktuellen Instanz für Verkettung
    }

    // Sends a message to the parent window
    sendMessage(type, data) {
        if (IFrameResizer.instance) {
            this.log('postMessage', {type, ...data});
            window.parent.postMessage({type, ...data}, this.options.targetOrigin);
        } else {
            console.error(`[LOG][IFRAME CHILD][${window.location.host}]: IFrameResizer is not initialized. Cannot send message.`);
        }
        return this;
    }

    // Debug logging if enabled
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

    // Destroys the instance and removes all event listeners
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

    // Here is the method that checks whether we are in an iFrame
    static hasParent() {
        return window.self !== window.top;
    }
}

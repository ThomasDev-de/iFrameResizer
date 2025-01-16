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
 * ```javascript
 * // Create a new instance of IFrameResizer with custom options
 * const IFrameResizer = window.IFrameResizer.create({
 *    targetOrigin: 'https://example.com', // Specify the parent window's origin
 *    resize: true, // Enable resize listener
 *    scroll: true, // Enable scroll listener
 *    log: true,    // Enable debugging logs
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
    static instance;

    constructor(options = {}) {
        // Check if we are in an iFrame
        if (!IFrameResizer.hasParent()) {
            console.log('Not running inside an iFrame. Initialization aborted.');
            return; // Kein iFrame, keine Initialisierung
        } else {
            console.log('Running inside an iFrame.');
        }

        // Instance check and clean up old ones (singleton pattern)
        if (IFrameResizer.instance) {
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

        this.log('Initializing', this.options);

        if (this.options.resize) {
            this.initResizeListener();
        }
        if (this.options.scroll) {
            this.initScrollListener();
        }
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
        // const reflow = document.body.offsetHeight; // Erzwungener Reflow zur Sicherstellung der Browser-Berechnung
        const newHeight = document.body.scrollHeight; // Höhe basierend auf aktuellem Inhalt
        const newWidth = document.body.scrollWidth;
        if (force || newHeight !== this.lastHeight || newWidth !== this.lastWidth) { // newWidth berücksichtigen
            this.lastHeight = newHeight;
            this.lastWidth = newWidth; // newWidth speichern
            this.sendMessage('resize', { height: newHeight, width: newWidth }); // newWidth mitsenden
        }
    }

    // Called when scrolling
    onScroll() {
        const top = window.scrollY || document.documentElement.scrollTop;
        const left = window.scrollX || document.documentElement.scrollLeft;
        this.sendMessage('scroll', {top, left});
    }

    // Sends a message to the parent window
    sendMessage(type, data) {
        this.log('postMessage', {type, ...data});
        window.parent.postMessage({type, ...data}, this.options.targetOrigin);
    }

    // Debug logging if enabled
    log(message, data) {
        if (this.options.log) {
            console.log(`[LOG][IFRAME CHILD][${window.location.host}]: ${message}`, data);
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

        this.observer = null;
        this.lastHeight = null;
        this.lastWidth = null;
    }

    // Here is the method that checks whether we are in an iFrame
    static hasParent() {
        return window.self !== window.top;
    }
}

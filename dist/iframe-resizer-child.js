window.iFrameResizer = {
    onReady: null,
    create: (options = {}) => {
        const iframeResizerInstance = new IframeResizer(options);

        if (typeof window.iFrameResizer.onReady === 'function') {
            window.iFrameResizer.onReady(iframeResizerInstance);
        }

        return iframeResizerInstance;
    }
};

class IframeResizer {
    constructor( options = {}) {
        this.lastHeight = null; // Store the last sent height
        const defaultOptions = {
            targetOrigin : '*',
            resize: true,
            scroll: true,
            log: false // Log option, default false
        };
        this.options = { ...defaultOptions, ...options };

        this.log('Initializing', this.options)
        if (this.options.resize) {
            this.initResizeListener();
        }
        if (this.options.scroll) {
            this.initScrollListener();
        }
    }

    initResizeListener() {
        // Listen for window resize events
        window.addEventListener('resize', this.onResize.bind(this));

        // Initialize MutationObserver to detect content changes
            const targetNode = document.documentElement;
            const config = { childList: true, subtree: true, attributes: true };

            const observer = new MutationObserver(() => this.onResize());
            observer.observe(targetNode, config);

    }

    initScrollListener() {
        // Listen for scroll events
        window.addEventListener('scroll', this.onScroll.bind(this));
    }

    onResize() {
        // Send resize message with current height
        const height = document.documentElement.scrollHeight;
        // Only send the message if the height has changed
        if (height !== this.lastHeight) {
            this.lastHeight = height; // Update last sent height
            this.sendMessage('resize', { height });
        }
    }

    onScroll() {
        // Send scroll message with current top and left position
        const top = window.scrollY || document.documentElement.scrollTop;
        const left = window.scrollX || document.documentElement.scrollLeft;
        this.sendMessage('scroll', { top, left });
    }

    log(message, data) {
        if (this.options.log) {
            console.log("[LOG][iframe child]: "+message, data);
        }
    }


    sendMessage(type, data) {
        this.log("Sending message", { type, ...data });
        // Send message to parent window
        window.parent.postMessage({ type, ...data }, this.options.targetOrigin);
    }
}
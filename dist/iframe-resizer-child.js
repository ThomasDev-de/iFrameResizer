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
    static instance; // Singleton-Referenz speichern

    constructor(options = {}) {
        // Prüfen, ob bereits eine Instanz existiert
        if (IframeResizer.instance) {
            IframeResizer.instance.destroy(); // Zerstören der alten Instanz
        }

        // Neue Instanz zuweisen
        IframeResizer.instance = this;

        this.lastHeight = null; // Zuletzt gesendete Höhe
        const defaultOptions = {
            targetOrigin: '*',
            resize: true,
            scroll: true,
            log: false
        };
        this.options = { ...defaultOptions, ...options };
        this.observer = null;

        this.log('Initializing', this.options);

        if (this.options.resize) {
            this.initResizeListener();
        }
        if (this.options.scroll) {
            this.initScrollListener();
        }
    }

    initResizeListener() {
        // Event-Listener initialisieren
        this.onResize = this.onResize.bind(this);
        window.addEventListener('resize', this.onResize);

        // MutationObserver initialisieren
        const targetNode = document.documentElement;
        const config = { childList: true, subtree: true, attributes: true };

        this.observer = new MutationObserver(() => this.onResize());
        this.observer.observe(targetNode, config);
    }

    initScrollListener() {
        this.onScroll = this.onScroll.bind(this);
        window.addEventListener('scroll', this.onScroll);
    }

    onResize() {
        const height = document.documentElement.scrollHeight;
        if (height !== this.lastHeight) {
            this.lastHeight = height;
            this.sendMessage('resize', { height });
        }
    }

    onScroll() {
        const top = window.scrollY || document.documentElement.scrollTop;
        const left = window.scrollX || document.documentElement.scrollLeft;
        this.sendMessage('scroll', { top, left });
    }

    sendMessage(type, data) {
        this.log('Sending message', { type, ...data });
        window.parent.postMessage({ type, ...data }, this.options.targetOrigin);
    }

    log(message, data) {
        if (this.options.log) {
            console.log("[LOG]["+window.location.host+"][iframe child]: " + message, data);
        }
    }

    destroy() {
        this.log('Destroying IframeResizer instance');

        // Event-Listener entfernen
        if (this.options.resize) {
            window.removeEventListener('resize', this.onResize);
        }
        if (this.options.scroll) {
            window.removeEventListener('scroll', this.onScroll);
        }

        // MutationObserver stoppen
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        this.lastHeight = null;
    }
}

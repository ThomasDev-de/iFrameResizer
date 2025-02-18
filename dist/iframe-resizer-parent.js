class IFrameResizer {
    constructor(iframe, options = {}) {
        this.iframe = iframe instanceof HTMLElement ? iframe : document.querySelector(iframe);
        if (!this.iframe) {
            console.error("Iframe element not found or selector invalid.");
            return;
        }
        const defaultOptions = {
            targetOrigin:'*',
            log: false,
            onResize: null,
            onScroll: null,
        };
        this.options = { ...defaultOptions, ...options };
        this.onMessage = this.onMessage.bind(this);
        window.addEventListener('message', this.onMessage);
        this.log('ParentIFrameResizer initialized');

    }

    onMessage(event) {
        if (event.source !== this.iframe.contentWindow) {
            return;
        }
        this.log('Message received', event.data);


        switch (event.data.type) {
            case 'resize':
                if (typeof this.options.onResize === 'function') {
                    this.options.onResize(event.data.width, event.data.height);
                }
                break;
            case 'scroll':
                if (typeof this.options.onScroll === 'function') {  // Prüfung hinzugefügt
                    this.options.onScroll(event.data.left, event.data.top);
                }
                break;
        }
    }

    sendMessage(type, data) {
        if (!this.iframe || !this.iframe.contentWindow) {
            this.log('Error: Iframe not found or contentWindow not available', { iframe: this.iframe });
            return; // or throw an error
        }
        if (!this.options.targetOrigin) {
            this.log('Error: targetOrigin not specified.  Please provide a targetOrigin in the options.');
            return;
        }


        this.iframe.contentWindow.postMessage({ type, ...data }, this.options.targetOrigin);
        this.log('Message sent to iframe', { type, data, targetOrigin: this.options.targetOrigin });

    }

    log(message, data) {
        if (this.options.log) {
            console.log(`[LOG][IFRAME PARENT][${window.location.host}]: ${message}`, data);
        }
    }

    destroy() {
        this.log('Destroying ParentIFrameResizer');
        window.removeEventListener('message', this.onMessage);
    }
}
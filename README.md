# iFrameResizer

A simple JavaScript library for resizing iframes and communicating scroll events to the parent window.

## Usage

### Child (iFrame)

### Installation

Include the `iframe-resizer-child.min.js` script in your **child** iframe HTML:

```html
<script src="dist/iframe-resizer-child.min.js"></script>
```

1. **Create an instance:**

```javascript
const resizer = window.iFrameResizer.create({
    targetOrigin: 'https://your-parent-domain.com', // **IMPORTANT:** Replace with your parent domain
    resize: true,        // Enable resize events (default: true)
    scroll: true,        // Enable scroll events (default: true)
    log: false           // Enable logging (default: false)
});

// Alternatively, use onReady callback:
window.iFrameResizer.onReady = (instance) => {
    console.log('iFrameResizer is ready');
    instance.sendMessage('custom-event', { /* your data */ });
};

const resizer = window.iFrameResizer.create({ /* your options */ });
```

*   **`targetOrigin`**:  **Crucial for security!**  Must match the parent window's origin.  Do **not** use `*` in production.
*   `resize`:  Enables automatic height adjustment based on content changes and window resize events.
*   `scroll`: Enables sending scroll events (top and left position) to the parent.
*   `log`: Enables logging within the iframe (for debugging).

2. **Sending custom messages:** You can send custom messages to the parent using:

```javascript
resizer.sendMessage('your-custom-event-type', { /* your data */ });
```
3**Receive custom events:** You can receive messages in the following ways:
```javascript
resizer
    .onMessage('your-custom-event-type', (data, event) => { /* your logic here */ });
    .onMessage('your-custom-event-type-2', (data, event) => { /* your logic here */ });
```

Hier eine **vollständige Markdown-Dokumentation** ohne Darstellungskonflikte:

---

### IFrameResizer Parent Class

The `IFrameResizer` class is used to establish communication between a parent page and a child iframe. It helps with resizing, sending/receiving messages, and handling events like scroll or custom messages.

---

#### Features

- Easy iframe resizing and custom scroll management.
- Callback functions to handle iframe messages, resizing, and scrolling.
- Secure two-way communication using the postMessage API.

---

#### Installation

Include the `iframe-resizer-parent.js` file in your project or import the module into your application.

---

#### Usage Example

```html
<!-- Parent Page -->
<iframe id="myIframe" src="child.html"></iframe>
```

```javascript
// Parent Window (e.g., parent.js)
const iframe = document.getElementById('myIframe');

const resizer = new IFrameResizer(iframe, {
    log: true, // Enables logging
    targetOrigin: 'https://example.com', // Domain restriction for security
    onResize: (width, height) => {
        console.log(`Iframe resized: ${width}x${height}`);
    },
    onScroll: (left, top) => {
        console.log(`Iframe scrolled to: left=${left}, top=${top}`);
    }
});

// Listen for custom messages sent by the iframe
resizer.onMessage('hello', (data) => {
    console.log('Message from iframe:', data);
});

// Send initialization message to the iframe
resizer.sendMessage('init', { message: 'Hello iframe!' });

// Clean up if the iframe is no longer used
resizer.destroy();
```

#### Options:

*   **`targetOrigin`:**  Enter the domain of the communication partner here.
*   **`onResize(width, height)`:**  A callback function that is triggered when the iframe's size changes.  Receives the new width and height as arguments.  Note: Applying the resize to the iframe is the responsibility of this callback.
*   **`onScroll(left, top)`:** A callback function that is triggered when the iframe is scrolled. Receives the new left and top scroll positions as arguments.
*   **`initData`:**  If set, it will send the specified data when it finishes initializing.
*   **`log`:**  If set to `true`, enables logging for debugging purposes.


#### Best Practices:

*   **Multiple Iframes:** Create a separate `IFrameResizer` instance for each iframe you want to manage.
*   **Dynamic Origins:** Be cautious when using dynamic origins.  Validate origins carefully to prevent security risks.
*   **Security (XSS Prevention):** Always verify the origin of incoming messages to protect against cross-site scripting attacks.  Avoid using '\*' as the `targetOrigin` in production. It’s best to set it dynamically, for example, using the referrer.
*   **Error Handling:** Implement proper error handling for invalid selectors or iframes. Check if the iframe element exists before creating the `IFrameResizer` instance.
*   **Cleanup:** Call the `destroy()` method when the resizer is no longer needed to remove event listeners and prevent memory leaks.


1. **Listen for messages:**

```javascript
IFrameResizer.onMessage('eventName', callback)
```

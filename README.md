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


### Parent Window

### Class-based Usage

The `IFrameResizer` class provides a more structured way to manage iframe resizing and scrolling, especially when dealing with multiple iframes or dynamic origins.  It offers better organization and encapsulation compared to the native approach.

#### Example:

```javascript
// Get the iframe element (can be an ID or a selector)
const iframe = document.getElementById('myIframe'); 
// or
const iframe = document.querySelector('.my-iframe-class');


const resizer = new IFrameResizer(iframe, {
    log: true, // Enable logging for debugging
    onResize: (width, height) => {
        console.log(`Iframe resized to: width ${width}, height ${height}`);
         // Apply resizing logic here if needed, e.g.,
        // iframe.style.width = width + 'px';
        // iframe.style.height = height + 'px';
    },
    onScroll: (left, top) => {
        console.log(`Iframe scrolled to: left ${left}, top ${top}`);
    }
});


// To send a message to the iframe (requires setup in the child iframe's code):
iframe.contentWindow.postMessage({ type: 'myCustomEvent', data: 'Message from parent' }, '*'); // Use a specific targetOrigin for security in production


// Clean up when the resizer is no longer needed (e.g., when the iframe is removed)
resizer.destroy();


```

#### Options:

*   **`onResize(width, height)`:**  A callback function that is triggered when the iframe's size changes.  Receives the new width and height as arguments.  Note: Applying the resize to the iframe is the responsibility of this callback.
*   **`onScroll(left, top)`:** A callback function that is triggered when the iframe is scrolled. Receives the new left and top scroll positions as arguments.
*   **`log`:**  If set to `true`, enables logging for debugging purposes.


#### Best Practices:

*   **Multiple Iframes:** Create a separate `IFrameResizer` instance for each iframe you want to manage.
*   **Dynamic Origins:** Be cautious when using dynamic origins.  Validate origins carefully to prevent security risks.
*   **Security (XSS Prevention):** Always verify the origin of incoming messages to protect against cross-site scripting attacks.  Avoid using '\*' as the `targetOrigin` in production. It’s best to set it dynamically, for example, using the referrer.
*   **Error Handling:** Implement proper error handling for invalid selectors or iframes. Check if the iframe element exists before creating the `IFrameResizer` instance.
*   **Cleanup:** Call the `destroy()` method when the resizer is no longer needed to remove event listeners and prevent memory leaks.

### Native Usage

When using the `IFrameResizer` class, you can directly manage iframes with more control.

#### Example

```javascript
// Importing the library (if using a module bundler)
// Import the IFrameResizer class

// Example: Using the IFrameResizer class

const resizer = new IFrameResizer({
    iframeId: 'your-iframe-id', // Replace with your iframe's ID
    targetOrigin: 'https://your-iframe-domain.com', // **IMPORTANT:** Replace with your iframe's origin
    onResize: ({ height, width }) => {
        console.log(`Resized iframe to ${height}px height and ${width}px width`);
    },
    onScroll: ({ top, left }) => {
        console.log(`Iframe scrolled to top: ${top}, left: ${left}`);
    }
});

// Listen for messages
resizer.listen();

// Destroy the resizer instance when no longer needed
function cleanup() {
    resizer.destroy();
    console.log('Resizer instance destroyed');
}
```

*   **`iframeId`**: Specifies the iframe's ID when resizing directly with the `IFrameResizer` class.
*   **`targetOrigin`**: For security, explicitly match the iframe's origin.
*   **`onResize`**: Optional callback for handling resize events.
*   **`onScroll`**: Optional callback for tracking scroll positions.
*   **`listen()`**: Starts listening to iframe events using the `IFrameResizer` class.

*   **`destroy()`**: Properly cleans up listeners and instance when done, using the `IFrameResizer` class.

Add support for handling width adjustments and optional onResize callbacks using the IFrameResizer class.

1. **Listen for messages:**

```javascript
window.addEventListener('message', (event) => {
    // Security check: verify origin
    if (event.origin !== 'https://your-iframe-domain.com') { // Replace with your iframe domain
        return;
    }

    switch (event.data.type) {
        case 'resize':
            // Adjust iframe height and width
            const iframe = document.getElementById('your-iframe-id'); // Replace with your iframe's ID
            iframe.style.height = event.data.height + 'px';
            iframe.style.width = event.data.width ? event.data.width + 'px' : iframe.style.width;
            break;
        case 'scroll':
            // Handle scroll position
            console.log('Scroll:', event.data.top, event.data.left);
            break;
        case 'your-custom-event-type':
            // Handle your custom event or resize callback
            console.log('Custom Event:', event.data);
            break;
    }
});

```

*   **Security Check:**  **Essential!** Always verify the `event.origin` to prevent cross-site scripting attacks.
*   **Dynamic Origin Handling:** If working with multiple origins, maintain a whitelist of trusted origins or dynamically match as needed.
*   **Handling Messages:**  Use a `switch` statement to handle different message types.

2. **Custom onResize Callback:** Add an optional custom callback for resize actions:

```javascript
window.addEventListener('message', (event) => {
    // Add this within the switch statement's resize case
    if (typeof onResizeCallback === 'function') {
        onResizeCallback({ height: event.data.height, width: event.data.width });
    }
});
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
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

1. **Listen for messages:**

```javascript
window.addEventListener('message', (event) => {
    // Security check: verify origin
    if (event.origin !== 'https://your-iframe-domain.com') { // Replace with your iframe domain
        return;
    }

    switch (event.data.type) {
        case 'resize':
            // Adjust iframe height
            const iframe = document.getElementById('your-iframe-id'); // Replace with your iframe's ID
            iframe.style.height = event.data.height + 'px';
            break;
        case 'scroll':
            // Handle scroll position
            console.log('Scroll:', event.data.top, event.data.left);
            break;
        case 'your-custom-event-type':
            // Handle your custom event
            console.log('Custom Event:', event.data);
            break;
    }
});

```

*   **Security Check:**  **Essential!** Always verify the `event.origin` to prevent cross-site scripting attacks.
*   **Handling Messages:**  Use a `switch` statement to handle different message types.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
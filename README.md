# IFrameResizer

A lightweight JavaScript library for seamless iframe communication and automatic resizing.

## Features

- Automatic iframe height adjustment in the parent page
- Optional iframe width adjustment
- Two-way communication between parent and child frames
- Scroll position synchronization
- Custom event handling
- Ready-state detection
- Origin validation for parent and child messages
- Configurable logging
- Singleton pattern in a child frame

## Installation

Add both scripts to your project:

```html
<!-- In parent page -->
<script src="/dist/iframe-resizer-parent.min.js"></script>

<!-- In child page -->
<script src="/dist/iframe-resizer-child.min.js"></script>
```

## Demo

Open `demo/index.html` in a browser or serve the project directory locally:

```bash
php -S localhost:8000
```

Then visit `http://localhost:8000/demo/`.

## Usage

### Parent Page

Basic setup:

```javascript
const resizer = new IFrameResizer('#myIframe', {
    targetOrigin: 'https://child-domain.com',
    log: true,
    onResize: (width, height) => {
        console.log(`Iframe resized to ${width}x${height}`);
    }
}).onReady(() => {
    console.log('Iframe is ready!');
});
```

By default, the parent script applies the reported child height to the iframe element.
Use `autoResize: false` if you only want to receive resize events without changing iframe styles.

Resize width as well as height:

```javascript
const resizer = new IFrameResizer('#myIframe', {
    targetOrigin: 'https://child-domain.com',
    resizeWidth: true
});
```

Advanced usage with custom messages:

```javascript
const resizer = new IFrameResizer('#myIframe', {
    targetOrigin: 'https://child-domain.com',
    log: true
});

// Handle custom messages
resizer.onMessage('customEvent', (payload) => {
    console.log('Custom event received:', payload);
});

// Send message to child
resizer.sendMessage('updateContent', {data: 'Hello Child!'});
```

### Child Page

Basic setup:

```javascript
window.IFrameResizer.create({
    targetOrigin: 'https://parent-domain.com',
    log: true
});
```

The child script waits until `document.body` is available, registers listeners, sends an initial forced `resize` event, and then sends a `ready` event.

Advanced usage with custom messages:

```javascript
const resizer = window.IFrameResizer.create({
    targetOrigin: 'https://parent-domain.com',
    log: true
});

// Handle custom messages
resizer.onMessage('updateContent', (payload) => {
    console.log('Update received:', payload);
});

// Send message to parent
resizer.sendMessage('customEvent', {data: 'Hello Parent!'});
```

## Configuration Options

### Parent Options

| Option       | Type     | Default | Description                                           |
|--------------|----------|---------|-------------------------------------------------------|
| targetOrigin | string   | '*'     | Allowed child origin for received and sent messages   |
| autoResize   | boolean  | true    | Automatically apply child height to the iframe        |
| resizeWidth  | boolean  | false   | Also apply child width to the iframe                  |
| log          | boolean  | false   | Enable console logging                                |
| onResize     | function | null    | Callback for resize events                            |
| onScroll     | function | null    | Callback for scroll events                            |

### Child Options

| Option       | Type    | Default | Description                                           |
|--------------|---------|---------|-------------------------------------------------------|
| targetOrigin | string  | '*'     | Allowed parent origin for received and sent messages  |
| log          | boolean | false   | Enable console logging                                |
| resize       | boolean | true    | Enable resize tracking and resize messages            |
| scroll       | boolean | true    | Enable scroll tracking                                |

## API Reference

### Parent Methods

- `onReady(callback)`: Register callback for iframe ready state
- `onMessage(type, callback)`: Register custom message handler
- `sendMessage(type, data)`: Send a message to child iframe
- `destroy()`: Clean up event listeners

### Child Methods

- `window.IFrameResizer.hasParent()`: Check if the script is running inside an iframe
- `onMessage(type, callback)`: Register custom message handler
- `sendMessage(type, data)`: Send a message to parent
- `destroy()`: Clean up instance and listeners

## Events

### Built-in Events

- `ready`: Sent when child iframe is initialized
- `resize`: Triggered on size changes and once during child initialization
- `scroll`: Triggered on scroll position changes

### Custom Events

You can define and handle custom events using `onMessage()` and `sendMessage()`.

## Security

For production use, set `targetOrigin` on both parent and child instead of using the default `'*'`.
Messages from other origins are ignored when a concrete origin is configured.

## Browser Support

- All modern browsers (Chrome, Firefox, Safari, Edge)
- Requires `ResizeObserver` support for automatic resize tracking (or polyfill)
- Requires `postMessage` support

## License

MIT License

## Contributing

Feel free to submit issues and pull requests.

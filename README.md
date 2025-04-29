# IFrameResizer

A lightweight JavaScript library for seamless iframe communication and automatic resizing.

## Features

- Automatic iframe height and width adjustment
- Two-way communication between parent and child frames
- Scroll position synchronization
- Custom event handling
- Ready-state detection
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

## Usage

### Parent Page

Basic setup:

```javascript
const resizer = new IFrameResizer('#myIframe', {
    log: true,
    onResize: (width, height) => {
        console.log(`Iframe resized to ${width}x${height}`);
    }
}).onReady(() => {
    console.log('Iframe is ready!');
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
    log: true
});
```

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

| Option       | Type     | Default | Description                    |
|--------------|----------|---------|--------------------------------|
| targetOrigin | string   | '*'     | Allowed origin for postMessage |
| log          | boolean  | false   | Enable console logging         |
| onResize     | function | null    | Callback for resize events     |
| onScroll     | function | null    | Callback for scroll events     |

### Child Options

| Option       | Type    | Default | Description                    |
|--------------|---------|---------|--------------------------------|
| targetOrigin | string  | '*'     | Allowed origin for postMessage |
| log          | boolean | false   | Enable console logging         |
| resize       | boolean | true    | Enable auto-resizing           |
| scroll       | boolean | true    | Enable scroll tracking         |

## API Reference

### Parent Methods

- `onReady(callback)`: Register callback for iframe ready state
- `onMessage(type, callback)`: Register custom message handler
- `sendMessage(type, data)`: Send a message to child iframe
- `destroy()`: Clean up event listeners

### Child Methods

- `onMessage(type, callback)`: Register custom message handler
- `sendMessage(type, data)`: Send a message to parent
- `destroy()`: Clean up instance and listeners

## Events

### Built-in Events

- `ready`: Sent when child iframe is initialized
- `resize`: Triggered on size changes
- `scroll`: Triggered on scroll position changes

### Custom Events

You can define and handle custom events using `onMessage()` and `sendMessage()`.

## Browser Support

- All modern browsers (Chrome, Firefox, Safari, Edge)
- Requires `ResizeObserver` support (or polyfill)
- Requires `postMessage` support

## License

MIT License

## Contributing

Feel free to submit issues and pull requests.
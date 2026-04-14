<docmach type="wrapper" replacement="content" file="docs/assets/docs.html">


# Cradova Basics

Quick reference for the fundamentals of Cradova.

## What is Cradova?

A lightweight, reactive UI framework for building web applications with:
- No virtual DOM - direct DOM manipulation
- Signal-based reactivity (pub/sub)
- VJS specification (no JSX)
- ~15KB bundle size

## Core Differences from React

| Feature | React | Cradova |
|---------|-------|---------|
| DOM | Virtual DOM + diffing | Direct manipulation |
| State | useState/setState | Signal + hooks |
| JSX | Required | Not used |
| Bundle | ~45KB | ~15KB |
| Learning curve | Higher | Lower |

## Key Concepts

### 1. VJS - Virtual JavaScript
No JSX. Elements created with function calls:

```ts
// Cradova (no JSX)
div(
  h1("Title"),
  p("Description"),
  button("Click", { onclick: handler })
)

// React (JSX)
<div>
  <h1>Title</h1>
  <p>Description</p>
  <button onClick={handler}>Click</button>
</div>
```

### 2. Direct DOM
No virtual DOM reconciliation:

```ts
// Cradova updates ONLY the changed element directly
signal.data.count = 5; // Directly updates DOM
```

### 3. Signal Reactivity
Pub/sub pattern for state:

```ts
const store = new Signal({ count: 0 });
store.data.count = 1; // Triggers updates
```

## Installation

```bash
npm i cradova
```

## Quick Start

```ts
import { div, h1, button, Page, Router } from "cradova";

const App = function(ctx: Comp) {
  const [count, setCount] = ctx.useState(0);
  
  return div(
    h1("Count: " + count),
    button("+1", { onclick: () => setCount(c => c + 1) })
  );
};

const HomePage = new Page({
  title: "My App",
  template: () => App()
});

Router.BrowserRoutes({ "/": HomePage });
```

## Required HTML

```html
<div data-wrapper="app"></div>
<script type="module" src="./index.js"></script>
```

## Exports from Cradova

### Elements
`div`, `p`, `span`, `h1`-`h6`, `button`, `input`, `textarea`, `select`, `img`, `a`, `ul`, `ol`, `li`, `table`, `tr`, `td`, `form`, `label`, `section`, `header`, `footer`, `nav`, `main`, `video`, `audio`, `canvas`, `iframe`, `raw`

### Core
`Page`, `Router`, `Signal`, `List`, `Comp`

### Control Flow
`$if`, `$ifelse`, `$switch`, `$case`

### Hooks (use via ctx)
`useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`

## Important Rules

1. **Regular functions only** for components - not arrow functions
2. **ctx required** for hooks to work
3. **Signal values must be objects** - not arrays or primitives
4. **Use .bind("name")** for refs

## File Structure

```
project/
├── index.html
├── index.ts
├── pages/
│   ├── home.ts
│   └── about.ts
├── components/
│   └── Button.ts
└── store/
    └── index.ts
```

## Common Errors

```
TypeError: Cannot read properties of undefined (reading 'useState')
```
→ Using arrow function instead of regular function

```
Error: Initial signal value must be an object
```
→ Signal value is array or primitive, wrap in object

```
ctx is undefined
```
→ Arrow function doesn't receive ctx, use `function(ctx) {}`

## Next Steps

- [CONVENTIONS.md](CONVENTIONS.md) - Critical function vs arrow rules
- [STATE.md](STATE.md) - Signal and hooks
- [COMPONENTS.md](COMPONENTS.md) - Creating components
- [ROUTING.md](ROUTING.md) - Page and Router
- [EXAMPLES.md](EXAMPLES.md) - Working code

</docmach>
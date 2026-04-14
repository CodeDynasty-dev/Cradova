<docmach type="wrapper" replacement="content" file="docs/assets/docs.html">

---
name: cradova
description: Build web applications with Cradova - a lightweight reactive framework. Use when working with Cradova, creating web apps, building SPAs, or comparing frontend frameworks. Includes guidance on Signal-based state, hooks, routing, and performance optimization.
---

# Cradova Framework

Cradova is a lightweight, reactive UI framework for building web applications. It uses direct DOM manipulation (no virtual DOM), signal-based pub/sub reactivity, and a VJS (Virtual JavaScript) specification instead of JSX.

## When to Use Cradova

- Building SPAs or PWAs
- Projects where bundle size matters (~15KB framework)
- Apps requiring fine-grained reactivity
- When you want simplicity without JSX
- Projects targeting low-end devices

## Critical Conventions

**ALWAYS use regular functions, NOT arrow functions**, for reactive components:

```ts
// CORRECT - regular function receives ctx with hooks
const MyComponent = function(ctx: Comp) {
  const [count, setCount] = ctx.useState(0);
  return div("Count: " + count);
};

// WRONG - arrow function does NOT receive ctx
const Broken = () => {
  // ctx is undefined - hooks will fail!
  const [count, setCount] = ctx.useState(0); // ERROR
  return div(count);
};
```

**Why?** Regular functions get a state tree from Cradova's rendering system. Arrow functions don't receive `ctx`, making them non-reactive. This convention controls how many state objects exist in the DOM.

## Quick Start

```ts
import { div, h1, button, Page, Router } from "cradova";

// Create a reactive component using a REGULAR function
const Counter = function(ctx: Comp) {
  const [count, setCount] = ctx.useState(0);
  
  return div(
    h1("Count: " + count),
    button("Increment", {
      onclick() { setCount(c => c + 1); }
    })
  );
};

// Define a page
const HomePage = new Page({
  title: "My App",
  template: function(ctx) { return Counter(ctx); }
});

// Set up routing
Router.BrowserRoutes({
  "/": HomePage
});
```

## Core Concepts

### State Management
- **Signal** - Global reactive state with pub/sub
- **useState** - Component-local state
- **useEffect** - Side effects and lifecycle
- **useMemo** / **useCallback** - Performance optimization
- **useRef** - DOM element references

### Routing
- **Page** - Define pages with template, title, activation hooks
- **Router.BrowserRoutes** - Configure routes
- **Router.navigate()** - Programmatic navigation
- Lazy loading via dynamic imports

### Control Flow
- **$if** - Conditional rendering
- **$ifelse** - If/else conditionals  
- **$switch/$case** - Switch statement rendering

### DOM Elements
- All standard HTML elements: div, p, button, h1-h6, img, input, etc.
- **raw()** - Inject raw HTML
- **ref.bind("name")** - Reference DOM elements

## See Also

- [CONVENTIONS.md](CONVENTIONS.html) - Detailed function vs arrow function rules
- [STATE.md](STATE.html) - Signal and hooks deep dive
- [COMPONENTS.md](COMPONENTS.html) - Creating and using components
- [ROUTING.md](ROUTING.html) - Page and Router configuration
- [CONTROL-FLOW.md](CONTROL-FLOW.html) - Conditional rendering
- [PERFORMANCE.md](PERFORMANCE.html) - List virtualization, optimization
- [EXAMPLES.md](EXAMPLES.html) - Complete code examples
- [PRODUCTION.md](PRODUCTION.html) - Real-world patterns and 

</docmach>
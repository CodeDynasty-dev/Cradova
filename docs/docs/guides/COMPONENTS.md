<docmach type="wrapper" replacement="content" file="docs/assets/docs.html">


# Cradova Components

This guide covers creating components and using DOM elements in Cradova.

## Creating Components

Components are regular functions that receive `ctx` for state and lifecycle:

```ts
// ✅ CORRECT - regular function with ctx
const MyComponent = function(ctx: Comp) {
  const [count, setCount] = ctx.useState(0);
  
  return div(
    h1("Hello World"),
    p("Count: " + count),
    button("Click", { onclick: () => setCount(c => c + 1) })
  );
};

// ❌ WRONG - arrow functions don't get ctx
const Broken = () => { /* can't use hooks */ };
```

### Component Structure

```ts
const Card = function(ctx: Comp) {
  // 1. Local state
  const [active, setActive] = ctx.useState(false);
  
  // 2. Effects for lifecycle
  ctx.useEffect(() => {
    console.log("Card mounted");
    return () => console.log("Card unmounted");
  }, []);
  
  // 3. Memoized values
  const cardClass = ctx.useMemo(() => 
    active ? "card active" : "card", 
  [active]);
  
  // 4. Render
  return div(
    { className: cardClass },
    h2("Card Title"),
    p("Card content here"),
    button(active ? "Active" : "Inactive", {
      onclick: () => setActive(!active)
    })
  );
};
```

## Primitive DOM Elements

Cradova provides all standard HTML elements:

```ts
import { 
  div, p, span, 
  h1, h2, h3, h4, h5, h6,
  button, input, textarea, select,
  img, a, 
  ul, ol, li,
  table, tr, td,
  form, label,
  section, header, footer, nav, main,
  video, audio, canvas, iframe
} from "cradova";
```

### Basic Usage

```ts
// Element with content
div("Hello World")

// Element with children
div(
  h1("Title"),
  p("Description")
)

// Element with props
div(
  { className: "container", id: "main" },
  h1("Title")
)

// Event handlers
button("Click me", {
  onclick() {
    console.log("Clicked!");
  }
})
```

### Props and Attributes

```ts
// Class, ID, style
div(
  { 
    className: "my-class another-class",
    id: "unique-id",
    style: { color: "red", fontSize: "16px" }
  },
  "Content"
)

// Data and aria attributes
div({
  "data-user-id": "123",
  "aria-label": "Click here",
  "aria-expanded": "false"
})

// Boolean attributes
input({ 
  type: "checkbox", 
  checked: true,
  disabled: false 
})
```

## Raw HTML

Use `raw()` for raw HTML injection:

```ts
import { raw, div } from "cradova";

// With template string
const CustomHTML = raw(`
  <div class="custom">
    <h2>Raw HTML Content</h2>
    <p>This is injected directly</p>
  </div>
`);

// Use in component
div(
  h1("Section"),
  CustomHTML
)
```

## References (useRef)

Get DOM element references:

```ts
const FormExample = function(ctx: Comp) {
  const inputRef = ctx.useRef<HTMLInputElement>();
  const containerRef = ctx.useRef<HTMLElement>();
  
  const handleClick = () => {
    // Access element by name
    const input = inputRef.current("username");
    console.log("Input value:", input?.value);
    
    // Get container
    const container = containerRef.current("form-container");
    container?.classList.add("submitted");
  };
  
  return div(
    { ref: containerRef.bind("form-container") },
    input({ 
      ref: inputRef.bind("username"),
      type: "text",
      placeholder: "Enter name"
    }),
    button("Submit", { onclick: handleClick })
  );
};
```

## Element Creation Flow

```
import { div, h1, button } from "cradova"

element(args) → makeElement() → append to DOM
     ↓
  [children, props, text]
     ↓
  Process in order:
  1. Functions → execute (if regular) or call (if arrow)
  2. Arrays → unroll and append
  3. Objects → apply as props/attributes
  4. Strings → set as textContent
```

## Event Handlers

```ts
// Click handler
button("Click", {
  onclick() {
    console.log("Clicked");
  }
})

// Input handler
input({
  oninput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    console.log(value);
  }
})

// Form handler
form({
  onsubmit(e: Event) {
    e.preventDefault();
    console.log("Submitted");
  }
})
```

## Children Pattern

```ts
// Pass component as child
const Card = function(ctx: Comp) {
  return div({ className: "card" }, ctx.children);
};

// Use with children
div(
  Card({ children: h1("Title") }),
  Card({ children: p("Description") })
)
```

## Conditional Classes

```ts
const MyComponent = function(ctx: Comp) {
  const [active, setActive] = ctx.useState(false);
  
  return div({
    className: [
      "component",
      active ? "active" : "",
      ctx.useMemo(() => large ? "large" : "", [large])
    ].join(" ").trim()
  });
};
```

## invoke - Component with Arguments

Use `invoke` to render a component with additional arguments:

```ts
const UserCard = function(ctx: Comp, user: { name: string; email: string }) {
  return div(
    h3(user.name),
    p(user.email)
  );
};

// Render with arguments
invoke(UserCard, { name: "Alice", email: "alice@example.com" });
```

## Fragment - Grouping Elements

Use `fragment` (or `frag`) to group elements without extra DOM nodes:

```ts
const MyComponent = function(ctx: Comp) {
  return fragment(
    div("First"),
    div("Second")
  );
};

// Or raw HTML fragment
const Fragment = raw(`
  <div>First</div>
  <div>Second</div>
`);
```

## Best Practices

1. **Use regular functions** - Required for ctx access
2. **Type your components** - Use `Comp` type for ctx
3. **Return single root** - Wrap multiple elements in div
4. **Extract complex logic** - Use hooks for reusability
5. **Use semantic HTML** - Use proper elements (nav, header, etc.)
6. **Handle events properly** - Use proper event types


</docmach>
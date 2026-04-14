<docmach type="wrapper" replacement="content" file="docs/assets/docs.html">

# Cradova State Management

This guide covers all state management options in Cradova: Signal for global state, and hooks for component-local state.

## Signal (Global State)

Signal is Cradova's reactive state container using pub/sub pattern.

### Creating a Signal

```ts
import { Signal } from "cradova";

// Basic signal
const counter = new Signal({ count: 0 });

// With localStorage persistence
const user = new Signal(
  { name: "John", loggedIn: false },
  { persistName: "my-app-user" }
);
```

**Important**: Signal values MUST be objects. Arrays and primitives will throw an error:

```ts
// ❌ WRONG - array
const items = new Signal(["a", "b", "c"]); // Error!

// ✅ CORRECT - wrap in object
const items = new Signal({ list: ["a", "b", "c"] });
```

### Using Signal Data

```ts
const store = new Signal({ value: 0 });

// Read
console.log(store.data.value);

// Write (triggers reactivity)
store.data.value = 1;

// Or use set() method
store.set({ value: 2 });
```

### Signal Methods

```ts
const signal = new Signal({ name: "John" });

// Publish changes manually
signal.publish("name", "Jane");

// Computed subscriptions
signal.computed("name", function() {
  console.log("Name changed to:", this.innerText);
});

// Clear persisted data
signal.clearPersist();
```

### Array Operations with Signal

Since Signal requires objects, wrap arrays:

```ts
// Store array in object
const posts = new Signal({ list: [] });

// Add item
posts.set({ list: [...posts.data.list, newPost] });

// Remove item
posts.set({ 
  list: posts.data.list.filter(p => p.id !== id) 
});

// Update item
posts.set({
  list: posts.data.list.map(p => 
    p.id === id ? { ...p, updated: true } : p
  )
});
```

## Hooks (Component State)

Hooks only work inside regular function components (not arrow functions).

### useState

```ts
const Counter = function(ctx: Comp) {
  const [count, setCount] = ctx.useState(0);
  const [name, setName] = ctx.useState("John");
  
  return div(
    h1("Count: " + count),
    button("+1", { onclick: () => setCount(count + 1) }),
    button("-1", { onclick: () => setCount(c => c - 1) }),
    button("Reset", { onclick: () => setCount(0) })
  );
};
```

**useState returns**: `[currentValue, setterFunction]`

- Setter can take new value or function: `setCount(5)` or `setCount(c => c + 1)`

### useEffect

```ts
const MyComponent = function(ctx: Comp) {
  const [data, setData] = ctx.useState(null);
  
  // Run on mount and when dependencies change
  ctx.useEffect(() => {
    fetch("/api/data")
      .then(r => r.json())
      .then(setData);
      
    // Cleanup function - runs on unmount
    return () => console.log("Cleanup");
  }, []); // Empty = run once on mount
  
  // Run when 'data' changes
  ctx.useEffect(() => {
    console.log("Data changed:", data);
  }, [data]);
  
  return div(data || "Loading...");
};
```

**useEffect rules**:
- Return cleanup function for unsubscribe/cancel
- Empty dependency array = run once on mount
- No array = run on every render
- Array with deps = run when deps change

### useMemo

```ts
const ExpensiveComponent = function(ctx: Comp) {
  const [items, setItems] = ctx.useState([]);
  
  // Memoize expensive calculation
  const sortedItems = ctx.useMemo(() => {
    return items
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter(item => item.active);
  }, [items]); // Recalculate only when items changes
  
  return div(sortedItems.map(item => p(item.name)));
};
```

### useCallback

```ts
const Parent = function(ctx: Comp) {
  const [count, setCount] = ctx.useState(0);
  
  // Memoize callback - same reference across renders
  const handleClick = ctx.useCallback(() => {
    setCount(c => c + 1);
  }, []); // Empty = never changes
  
  return div(
    h1("Count: " + count),
    button("Click", { onclick: handleClick })
  );
};
```

### useRef

```ts
const FormComponent = function(ctx: Comp) {
  const inputRef = ctx.useRef<HTMLInputElement>();
  const formRef = ctx.useRef<HTMLFormElement>();
  
  const handleSubmit = () => {
    const value = inputRef.current("myInput")?.value;
    console.log("Submitted:", value);
  };
  
  return form(
    { ref: formRef.bind("myForm") },
    input({ 
      ref: inputRef.bind("myInput"),
      type: "text" 
    }),
    button("Submit", { onclick: handleSubmit })
  );
};
```

**useRef pattern**: Use `ref.bind("name")` to bind the ref, then access with `ref.current("name")`.

## State Management Pattern

For production apps, combine Signal (global) + hooks (local):

```ts
// Global store - shared across components
const AppStore = new Signal({ 
  user: null, 
  theme: "light" 
});

// Component - local state
const Settings = function(ctx: Comp) {
  const [loading, setLoading] = ctx.useState(false);
  
  // Access global state directly
  const theme = AppStore.data.theme;
  
  ctx.useEffect(() => {
    // Sync local state with global
    setLoading(true);
    loadSettings().then(() => setLoading(false));
  }, []);
  
  return div(
    h1("Settings"),
    p("Theme: " + theme)
  );
};
```

## Common Patterns

### Toggle State
```ts
const [isOpen, setIsOpen] = ctx.useState(false);
const toggle = () => setIsOpen(!isOpen);
```

### Form State
```ts
const [form, setForm] = ctx.useState({ name: "", email: "" });
const updateField = (field) => (e) => {
  setForm({ ...form, [field]: e.target.value });
};
```

### Async State
```ts
const [data, setData] = ctx.useState(null);
const [loading, setLoading] = ctx.useState(true);
const [error, setError] = ctx.useState(null);

ctx.useEffect(() => {
  fetchData()
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));
}, []);
```

</docmach>
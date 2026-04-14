<docmach type="wrapper" replacement="content" file="docs/assets/docs.html">


# Cradova Conventions

This document covers the critical conventions that AI agents must follow when working with Cradova.

## Regular Functions vs Arrow Functions (CRITICAL)

This is the MOST IMPORTANT convention in Cradova. Failing to follow this will result in runtime errors.

### Rule

**Use regular functions (function declarations) for all reactive components.** Arrow functions do NOT receive `ctx` and will not have access to hooks.

```ts
// ✅ CORRECT
function MyComponent(ctx: Comp) { }
const MyComponent = function(ctx: Comp) { }

// ❌ WRONG - arrow functions do NOT get ctx
const MyComponent = () => { }
const MyComponent = (ctx) => { }
```

### Why This Exists

1. **State Tree Access**: Regular functions receive a `ctx` parameter from Cradova's rendering system, which provides access to the component's state tree.

2. **Hook Availability**: Only regular functions can use:
   - `ctx.useState(initialValue)`
   - `ctx.useEffect(effect, deps)`
   - `ctx.useMemo(factory, deps)`
   - `ctx.useCallback(callback, deps)`
   - `ctx.useRef<T>()`

3. **DOM State Control**: The function's `ctx` allows Cradova to track and manage how many state objects exist in the DOM, enabling fine-grained reactivity.

4. **Arrow Functions are Static**: Arrow functions are rendered once without reactivity - they're suitable for pure presentational components but cannot manage state.

### Examples

#### Correct: Regular Function Component
```ts
const Counter = function(ctx: Comp) {
  const [count, setCount] = ctx.useState(0);
  
  ctx.useEffect(() => {
    console.log("Component mounted");
    return () => console.log("Cleanup");
  }, []);
  
  return div(
    h1("Count: " + count),
    button("Click", { onclick: () => setCount(count + 1) })
  );
};
```

#### Wrong: Arrow Function
```ts
const Counter = (ctx) => {
  // ctx is undefined! This will fail:
  const [count, setCount] = ctx.useState(0); // TypeError
  return div(count);
};
```

## Page Templates

Page templates MUST use regular functions to access page lifecycle hooks:

```ts
// ✅ CORRECT
const HomePage = new Page({
  title: "Home",
  template: function(ctx: Comp) {
    const [view, setView] = ctx.useState("home");
    return div(h1("Welcome"));
  },
  onActivate() {
    console.log("Page activated");
  }
});

// ❌ WRONG
const BrokenPage = new Page({
  title: "Home",
  template: (ctx) => {  // ctx undefined!
    const [view, setView] = ctx.useState("home"); // Fails
    return div(view);
  }
});
```

## When Arrow Functions Are OK

Arrow functions work for:
- Pure presentational components that don't need state
- Callbacks passed as event handlers
- Inline render functions in control flow (but pass `ctx` explicitly if needed)

```ts
// OK - arrow function as callback
button("Click", {
  onclick: () => console.log("clicked")
});

// OK - arrow in $case (but template must be function)
$case("value", () => div("content"))
```

## Best Practices

1. **Always use TypeScript types**: Define `ctx: Comp` for autocomplete
2. **Keep functions small**: Extract complex logic
3. **Use memoization**: `ctx.useMemo` for expensive computations
4. **Clean up effects**: Always return cleanup function from `useEffect`
5. **Use Signal for global state**: Share across components without prop drilling

## Summary Table

| Pattern | Regular Function | Arrow Function |
|---------|-----------------|-----------------|
| Receives `ctx` | ✅ Yes | ❌ No |
| Hooks available | ✅ useState, useEffect, etc. | ❌ Undefined |
| Reactive | ✅ Yes | ❌ No |
| Use for | Components, Pages | Pure callbacks, inline |
| Example | `function(ctx) { }` | `() => { }` |

## Common Mistakes to Avoid

1. Using arrow functions for Page templates
2. Forgetting to pass `ctx` to child components
3. Not returning cleanup from useEffect
4. Using `.data` without Signal wrapper (must be object, not array/primitive)
5. Trying to use hooks outside of component function scope

</docmach>
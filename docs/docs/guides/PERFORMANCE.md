<docmach type="wrapper" replacement="content" file="docs/assets/docs.html">


# Cradova Performance

This guide covers performance optimization in Cradova including the List class and virtualized rendering.

## Why Performance Matters

Cradova uses direct DOM manipulation without virtual DOM diffing. This is generally faster, but large lists can still impact performance. Use these techniques to optimize.

## List Class

For large arrays, use the List class which provides efficient rendering:

```ts
import { List, p, div } from "cradova";

// Create list with render function
const itemsList = new List(
  ["Item 1", "Item 2", "Item 3"],
  (item, index) => p(item, { id: "item-" + index })
);

// Render in component
const MyComponent = function(ctx: Comp) {
  return div(itemsList.Element);
};

// Add item
itemsList.push("New Item");

// Remove item
itemsList.splice(0, 1);

// Update item
itemsList[0] = "Updated";
```

### List with Object Data

```ts
interface Todo {
  id: number;
  text: string;
  done: boolean;
}

const todos = new List<Todo>(
  [
    { id: 1, text: "Learn Cradova", done: false },
    { id: 2, text: "Build app", done: true }
  ],
  (todo, index) => div(
    { className: todo.done ? "done" : "" },
    p(todo.text),
    button(todo.done ? "Undo" : "Complete", {
      onclick: () => {
        const newTodos = [...todos.data];
        newTodos[index] = { ...todo, done: !todo.done };
        todos.data = newTodos;
      }
    })
  )
);
```

### List Options

```ts
const list = new List(data, renderFn, {
  itemHeight: 50,      // Fixed height for virtualization
  containerHeight: 400 // Container height
});
```

## Virtualized List

For very large lists (1000+ items), use virtualized-list:

```ts
import { List, virtualizedList } from "cradova";

const bigList = new List(
  Array(10000).fill(0).map((_, i) => `Item ${i}`),
  (item, index) => div(p(item)),
  { 
    itemHeight: 40,
    containerHeight: 600,
    virtualized: true
  }
);
```

## useMemo for Expensive Calculations

```ts
const ExpensiveComponent = function(ctx: Comp) {
  const [items, setItems] = ctx.useState([]);
  
  // Only recalculate when items change
  const sorted = ctx.useMemo(() => {
    return items
      .filter(i => i.active)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(i => ({ ...i, displayName: i.name.toUpperCase() }));
  }, [items]);
  
  // Expensive computation not needed on every render
  const total = ctx.useMemo(() => 
    items.reduce((sum, i) => sum + i.price, 0),
  [items]);
  
  return div(
    h1("Total: $" + total),
    sorted.map(item => p(item.displayName))
  );
};
```

## useCallback for Stable References

```ts
const Parent = function(ctx: Comp) {
  const [count, setCount] = ctx.useState(0);
  
  // Stable reference - won't cause child re-renders
  const handleClick = ctx.useCallback(() => {
    setCount(c => c + 1);
  }, []);
  
  return div(
    h1("Count: " + count),
    // Child only re-renders when count changes, not on every render
    ChildComponent({ onClick: handleClick })
  );
};
```

## Avoiding Unnecessary Re-renders

```ts
// ❌ WRONG - new function every render
const BadComponent = function(ctx: Comp) {
  return button("Click", {
    onclick: () => console.log("clicked") // New function each render
  });
};

// ✅ CORRECT - stable function
const GoodComponent = function(ctx: Comp) {
  const handleClick = ctx.useCallback(() => {
    console.log("clicked");
  }, []);
  
  return button("Click", { onclick: handleClick });
};
```

## Signal vs useState

Use Signal for global/shared state, useState for component-local:

```ts
// Global state - use Signal
const AppStore = new Signal({ user: null, theme: "light" });

// Component state - use useState
const MyComponent = function(ctx: Comp) {
  const [local, setLocal] = ctx.useState("");
  
  // Reading global state (triggers when it changes)
  const theme = AppStore.data.theme;
  
  return div();
};
```

## Optimizing Large Lists

### 1. Pagination

```ts
const PaginatedList = function(ctx: Comp) {
  const [items, setItems] = ctx.useState(allItems);
  const [page, setPage] = ctx.useState(0);
  const pageSize = 20;
  
  const currentPage = ctx.useMemo(() => {
    const start = page * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page]);
  
  return div(
    currentPage.map(item => p(item.name)),
    div(
      button("Prev", { disabled: page === 0, onclick: () => setPage(p => p - 1) }),
      button("Next", { disabled: (page + 1) * pageSize >= items.length, onclick: () => setPage(p => p + 1) })
    )
  );
};
```

### 2. Infinite Scroll

```ts
const InfiniteList = function(ctx: Comp) {
  const [items, setItems] = ctx.useState(initialItems);
  const [loading, setLoading] = ctx.useState(false);
  
  ctx.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY + window.innerHeight >= document.body.offsetHeight - 100) {
        loadMore();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const loadMore = async () => {
    if (loading) return;
    setLoading(true);
    const more = await fetchMore();
    setItems([...items, ...more]);
    setLoading(false);
  };
  
  return div(
    items.map(item => p(item.name)),
    loading ? p("Loading...") : null
  );
};
```

### 3. Window Virtualization

For extremely long lists (10k+ items), only render visible items:

```ts
const VirtualList = function(ctx: Comp) {
  const [items, setItems] = ctx.useState(largeArray);
  const [scrollTop, setScrollTop] = ctx.useState(0);
  
  const visibleItems = ctx.useMemo(() => {
    const itemHeight = 50;
    const visibleCount = Math.ceil(window.innerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    
    return items.slice(startIndex, startIndex + visibleCount);
  }, [items, scrollTop]);
  
  ctx.useEffect(() => {
    const handleScroll = () => setScrollTop(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  return div(
    { style: { height: items.length * 50 + "px", position: "relative" } },
    visibleItems.map((item, i) => 
      div({ 
        style: { position: "absolute", top: (i * 50) + "px" } 
      }, item.name)
    )
  );
};
```

## Performance Checklist

- [ ] Use `useMemo` for expensive calculations
- [ ] Use `useCallback` for stable function references
- [ ] Use List class for large arrays (100+ items)
- [ ] Consider virtualization for very large lists (1000+)
- [ ] Implement pagination for large datasets
- [ ] Use lazy loading for routes
- [ ] Prefer Signal for global state over prop drilling
- [ ] Keep components small and focused

## Bundle Size

Cradova's framework is ~15KB minified. For comparison:

- React + ReactDOM: ~45KB
- Vue: ~35KB
- Cradova: ~15KB

This makes Cradova suitable for:
- Mobile applications
- Low-bandwidth environments
- Quick initial load requirements

</docmach>
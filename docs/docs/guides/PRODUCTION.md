<docmach type="wrapper" replacement="content" file="docs/assets/docs.html">


# Cradova Production Patterns

This guide covers real-world patterns used in production Cradova applications, based on actual production code.

## State Management Architecture

### Global Store Pattern

```ts
// store/index.ts
import { Signal } from "cradova";

type User = {
  id: string;
  name: string;
  email: string;
  token?: string;
};

type AppState = {
  user: User | null;
  cart: CartItem[];
  theme: "light" | "dark";
};

// Main app store with persistence
export const AppStore = new Signal<AppState>(
  { user: null, cart: [], theme: "light" },
  { persistName: "app-state" }
);

// User-specific store
export const UserStore = new Signal<{ user: User }>(
  { user: {} as User },
  { persistName: "user-session" }
);

// Cart store
export const CartStore = new Signal<{ items: CartItem[] }>(
  { items: [] },
  { persistName: "shopping-cart" }
);
```

### Using in Components

```ts
// components/Header.ts
import { div, button, img } from "cradova";
import { AppStore, UserStore } from "../store";

export const Header = function(ctx: Comp) {
  // Direct access to global state
  const user = UserStore.data.user;
  const cartCount = AppStore.data.cart.length;
  
  return div(
    { className: "header" },
    div(
      { className: "logo" },
      "MyApp"
    ),
    div(
      { className: "user-menu" },
      user 
        ? img({ src: user.avatar, alt: user.name })
        : button("Login", { onclick: () => Router.navigate("/login") })
    ),
    div(
      { className: "cart" },
      button("Cart (" + cartCount + ")")
    )
  );
};
```

## Component Architecture

### Page with Local State

```ts
// pages/dashboard/index.ts
import { 
  div, button, h1, p, img, nav, 
  Page, Router, $switch, $case 
} from "cradova";
import { observer } from "../home"; // IntersectionObserver setup
import { AppStore, UserStore } from "../../store";
import { Profile } from "./components/profile";
import { CartComp } from "./components/cart";

const DashboardPage = new Page({
  title: "Dashboard",
  
  template: function(ctx: Comp) {
    // Component-local state
    const [view, setView] = ctx.useState(1);
    const page = Number(Router.PageData.params?.page || "1");
    
    // Set from URL or default
    ctx.useEffect(() => {
      if (!UserStore.data.user?.token) {
        Router.navigate("/login");
      }
    }, []);
    
    // Side effect - setup observer
    ctx.useEffect(() => {
      const observables = document.querySelectorAll(".observables");
      observables.forEach(el => observer.observe(el));
      return () => observables.forEach(el => observer.unobserve(el));
    }, []);
    
    // Memoized value
    const userName = ctx.useMemo(() => 
      UserStore.data.user?.name || "Guest", 
    [UserStore.data.user?.name]);
    
    return div(
      { className: "dashboard" },
      // Navigation
      nav(
        { className: "nav" },
        button("Menu", { onclick: toggleMenu }),
        a({ href: "/" }, img({ src: "/logo.png" })),
        div(
          { className: "actions" },
          button("Notifications", { 
            onclick: () => { setView(7); Router.navigate("?page=7"); } 
          }),
          button("Support", { 
            onclick: () => { setView(9); Router.navigate("?page=9"); } 
          }),
          img({ src: "/cart.png", onclick: () => { setView(8); } })
        )
      ),
      
      // Main content with switch
      div(
        { className: "content" },
        $switch(
          view,
          $case(1, () => OverviewComp()),
          $case(2, () => storeComp()),
          $case(3, () => projectComp()),
          $case(4, () => SalesComp()),
          $case(5, () => ReviewsComp()),
          $case(6, () => Profile()),
          $case(7, () => notificationsComp()),
          $case(8, () => CartComp()),
          $case(9, () => Support())
        )
      )
    );
  },
  
  onActivate() {
    console.log("Dashboard activated");
  },
  
  onDeactivate() {
    console.log("Dashboard deactivated");
  }
});
```

### Form Components

```ts
// components/Input.ts
import { input, div, label } from "cradova";

export const Input = function(ctx: Comp) {
  const [state, setState] = ctx.useState({ value: "", error: "" });
  
  return div(
    { className: "input-wrapper" },
    label(labelText),
    input({
      type: type || "text",
      value: state.value,
      oninput(e: Event) {
        const value = (e.target as HTMLInputElement).value;
        setState({ value, error: "" });
      },
      onblur() {
        if (required && !state.value) {
          setState({ ...state, error: "Required" });
        }
      },
      style: { borderColor: state.error ? "red" : "" }
    }),
    state.error ? div({ className: "error" }, state.error) : null
  );
};
```

### Reusable Components

```ts
// components/Button.ts
import { button as ButtonEl } from "cradova";

export const Button = function(ctx: Comp) {
  const [loading, setLoading] = ctx.useState(false);
  
  const handleClick = async () => {
    if (disabled || loading) return;
    
    if (onClick) {
      setLoading(true);
      try {
        await onClick();
      } finally {
        setLoading(false);
      }
    }
  };
  
  return ButtonEl(
    { 
      className: ["btn", variant, loading ? "loading" : ""].join(" "),
      disabled: disabled || loading,
      onclick: handleClick
    },
    loading ? "Loading..." : children
  );
};
```

## Data Fetching Pattern

```ts
// utils/api.ts
export const fetchData = async (url: string, options?: RequestInit) => {
  const token = UserStore.data.user?.token;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers
    }
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  return response.json();
};

// Usage in component
const DataComponent = function(ctx: Comp) {
  const [data, setData] = ctx.useState(null);
  const [loading, setLoading] = ctx.useState(true);
  const [error, setError] = ctx.useState(null);
  
  ctx.useEffect(() => {
    fetchData("/api/data")
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);
  
  if (loading) return div("Loading...");
  if (error) return div("Error: " + error.message);
  
  return div(JSON.stringify(data));
};
```

## Error Handling

```ts
// Error boundary pattern
const SafeComponent = function(ctx: Comp) {
  const [error, setError] = ctx.useState(null);
  
  ctx.useEffect(() => {
    try {
      // Render content
    } catch (e) {
      setError(e.message);
    }
  }, []);
  
  if (error) {
    return div(
      { className: "error-boundary" },
      p("Something went wrong"),
      button("Retry", { onclick: () => setError(null) })
    );
  }
  
  return children;
};
```

## Code Organization

### Directory Structure

```
src/
├── index.ts              # App entry, routes
├── store/
│   ├── index.ts          # Global stores
│   └── mock.ts           # Mock data
├── components/
│   ├── index.css         # Shared styles
│   ├── button.ts
│   ├── input.ts
│   └── ...
├── pages/
│   ├── home/
│   │   ├── index.ts
│   │   ├── hero.ts
│   │   └── home.css
│   ├── dashboard/
│   │   ├── index.ts
│   │   ├── components/
│   │   │   ├── profile.ts
│   │   │   ├── store.ts
│   │   │   └── ...
│   │   └── dashboard.css
│   └── ...
└── utils/
    ├── api.ts
    └── toaster.ts
```

### Lazy Loading

```ts
// index.ts
import { Page, Router } from "cradova";

// Lazy load pages
const HomePage = () => import("./pages/home");
const MarketPage = () => import("./pages/market");
const DashboardPage = () => import("./pages/dashboard");

Router.BrowserRoutes({
  "/": HomePage,
  "/market": MarketPage,
  "/dashboard": DashboardPage
});
```

## CSS Integration

```ts
// Import CSS in index
import "./styles/index.css";
import "./styles/theme.css";
import "./pages/home/home.css";

// Or inline styles for dynamic values
const DynamicStyle = function(ctx: Comp) {
  const [color, setColor] = ctx.useState("blue");
  
  return div(
    { style: { 
      backgroundColor: color,
      padding: "20px"
    }},
    "Content"
  );
};
```

## Testing Pattern

```ts
// Test utilities
const render = (component) => {
  const container = div(component);
  document.body.appendChild(container);
  return container;
};

const cleanup = () => {
  document.body.innerHTML = "";
};

// Test example
test("counter increments", () => {
  const container = render(Counter());
  const button = container.querySelector("button");
  
  button.click();
  
  expect(container.textContent).toContain("1");
  
  cleanup();
});
```

## Deployment Considerations

1. **Build**: Use esbuild, rollup, or similar for bundling
2. **Code Split**: Lazy load routes
3. **CSS**: Extract or inline based on preference
4. **HTML**: Ensure `<div data-wrapper="app"></div>` exists
5. **SPA**: Configure server for fallback to index.html

## Summary

Production Cradova apps typically use:
- Global Signal stores with localStorage persistence
- Regular function components (ctx required)
- Page-based routing with lazy loading
- CSS imports for styling
- Error boundaries for resilience
- Proper cleanup in useEffect return functions

</docmach>
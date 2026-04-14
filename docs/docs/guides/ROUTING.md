# Cradova Routing

This guide covers routing in Cradova using Page and Router.

## Basic Setup

```ts
import { Page, Router, div, h1 } from "cradova";

// Define pages
const HomePage = new Page({
  title: "Home Page",
  template: function(ctx) {
    return div(h1("Welcome Home"));
  }
});

const AboutPage = new Page({
  title: "About Us",
  template: function(ctx) {
    return div(h1("About Us"));
  }
});

// Configure routes
Router.BrowserRoutes({
  "/": HomePage,
  "/about": AboutPage
});
```

## Page Options

```ts
const MyPage = new Page({
  // Page title (appears in browser tab)
  title: "My Page",
  
  // Template - MUST use regular function
  template: function(ctx: Comp) {
    const [content, setContent] = ctx.useState("Hello");
    return div(h1(content));
  },
  
  // Called when page becomes active
  onActivate() {
    console.log("Page activated!");
  },
  
  // Called when leaving page
  onDeactivate() {
    console.log("Left page");
  }
});
```

## Router.navigate()

Programmatic navigation:

```ts
const NavigationExample = function(ctx: Comp) {
  return div(
    button("Go Home", {
      onclick() {
        Router.navigate("/");
      }
    }),
    button("Go About", {
      onclick() {
        Router.navigate("/about");
      }
    }),
    button("Go Products", {
      onclick() {
        Router.navigate("/products?id=123");
      }
    })
  );
};
```

## Lazy Loading

Load pages on demand to reduce initial bundle:

```ts
// Lazy load pages
const MarketPage = () => import("./pages/market");
const ProductPage = () => import("./pages/market/product");
const DashboardPage = () => import("./pages/dashboard");

Router.BrowserRoutes({
  "/": HomePage,
  "/market": MarketPage,
  "/product/:id": ProductPage,
  "/dashboard": DashboardPage,
  "*": NotFoundPage
});
```

## Route Parameters

Access route parameters:

```ts
const ProductPage = new Page({
  title: "Product",
  template: function(ctx: Comp) {
    // Access route params
    const productId = Router.PageData.params?.id;
    
    return div(
      h1("Product: " + productId)
    );
  }
});

// Navigate with params
Router.navigate("/product/123");
```

## Access Query Params

```ts
const SearchPage = new Page({
  title: "Search",
  template: function(ctx: Comp) {
    // Access query string
    const query = Router.PageData.query?.q;
    const page = Router.PageData.query?.page || "1";
    
    return div(
      h1("Search: " + query),
      p("Page: " + page)
    );
  }
});

// Navigate with query string
Router.navigate("/search?q=cradova&page=2");
```

## Page Lifecycle

```ts
const LifecyclePage = new Page({
  title: "Lifecycle Demo",
  template: function(ctx: Comp) {
    const [count, setCount] = ctx.useState(0);
    
    return div(
      h1("Count: " + count),
      button("+", { onclick: () => setCount(c => c + 1) })
    );
  },
  
  onActivate() {
    // Page entered - good for:
    // - Analytics tracking
    // - Fetching page-specific data
    // - Starting animations
    console.log("Activated");
  },
  
  onDeactivate() {
    // Page leaving - good for:
    // - Cleanup
    // - Saving state
    // - Stopping animations
    console.log("Deactivated");
  }
});
```

## Multiple Pages Example

```ts
// pages/home.ts
export const HomePage = new Page({
  title: "Codeartic - Home",
  template: function(ctx: Comp) {
    return div(
      h1("Welcome to Codeartic"),
      p("Your marketplace for digital assets")
    );
  }
});

// pages/market.ts
export const MarketPage = new Page({
  title: "Marketplace",
  template: function(ctx: Comp) {
    return div(h1("Browse Products"));
  }
});

// index.ts
import { HomePage } from "./pages/home";
import { MarketPage } from "./pages/market";

Router.BrowserRoutes({
  "/": HomePage,
  "/market": MarketPage
});
```

## Navigation with State

Pass state during navigation:

```ts
// Navigate with state
Router.navigate("/checkout", { 
  total: 100, 
  items: cartItems 
});

// Access state in destination page
const CheckoutPage = new Page({
  template: function(ctx: Comp) {
    const state = Router.PageData.state;
    return div(
      h1("Total: $" + state.total)
    );
  }
});
```

## Handling 404s

```ts
const NotFoundPage = new Page({
  title: "404 - Not Found",
  template: function(ctx: Comp) {
    return div(
      h1("Page Not Found"),
      button("Go Home", {
        onclick: () => Router.navigate("/")
      })
    );
  }
});

Router.BrowserRoutes({
  "/": HomePage,
  "/about": AboutPage,
  "*": NotFoundPage  // Catch-all for 404s
});
```

## Best Practices

1. **Use regular functions** for page templates
2. **Lazy load** pages that aren't needed immediately
3. **Use onActivate** for data fetching
4. **Clean up in onDeactivate** to prevent memory leaks
5. **Handle 404s** with wildcard route
6. **Keep URL structure clean** - use meaningful paths
7. **Use query params** for filtering/sorting, route params for identifiers
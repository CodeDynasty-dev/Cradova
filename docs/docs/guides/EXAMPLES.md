<docmach type="wrapper" replacement="content" file="docs/assets/docs.html">


# Cradova Examples

Complete, working code examples for common use cases.

## Simple Counter

```ts
import { div, h1, button, Page, Router } from "cradova";

const Counter = function(ctx: Comp) {
  const [count, setCount] = ctx.useState(0);
  
  return div(
    h1("Counter: " + count),
    button("+1", { onclick: () => setCount(c => c + 1) }),
    button("-1", { onclick: () => setCount(c => c - 1) }),
    button("Reset", { onclick: () => setCount(0) })
  );
};

const HomePage = new Page({
  title: "Counter",
  template: () => Counter()
});

Router.BrowserRoutes({ "/": HomePage });
```

## Todo List

```ts
import { div, h1, input, button, ul, li, p, Page, Router, List } from "cradova";

// Create list store
const todoList = new List(
  ["Learn Cradova", "Build an app", "Ship it"],
  (task, index) => li(
    { onclick: () => todoList.splice(index, 1) },
    task
  )
);

const TodoApp = function(ctx: Comp) {
  const inputRef = ctx.useRef<HTMLInputElement>();
  
  const addTodo = () => {
    const input = inputRef.current("todo-input");
    if (input?.value) {
      todoList.push(input.value);
      input.value = "";
    }
  };
  
  return div(
    h1("Todo List"),
    input({ 
      ref: inputRef.bind("todo-input"),
      placeholder: "Add task...",
      onkeydown: (e) => e.key === "Enter" && addTodo()
    }),
    button("Add", { onclick: addTodo }),
    ul(todoList.Element)
  );
};

const HomePage = new Page({
  title: "Todo App",
  template: () => TodoApp()
});

Router.BrowserRoutes({ "/": HomePage });
```

## Toggle Tabs

```ts
import { div, button, h1, p, Page, Router, $switch, $case } from "cradova";

const TabbedContent = function(ctx: Comp) {
  const [activeTab, setActiveTab] = ctx.useState("home");
  
  return div(
    div(
      { className: "tabs" },
      button("Home", { 
        className: activeTab === "home" ? "active" : "",
        onclick: () => setActiveTab("home") 
      }),
      button("About", { 
        className: activeTab === "about" ? "active" : "",
        onclick: () => setActiveTab("about") 
      }),
      button("Contact", { 
        className: activeTab === "contact" ? "active" : "",
        onclick: () => setActiveTab("contact") 
      })
    ),
    $switch(
      activeTab,
      $case("home", () => div(h1("Home Page"), p("Welcome home"))),
      $case("about", () => div(h1("About"), p("About us"))),
      $case("contact", () => div(h1("Contact"), p("Email us")))
    )
  );
};

const HomePage = new Page({
  title: "Tabs",
  template: () => TabbedContent()
});

Router.BrowserRoutes({ "/": HomePage });
```

## Global State (Signal)

```ts
import { div, h1, button, p, Page, Router, Signal } from "cradova";

// Global store
const themeStore = new Signal({ mode: "light" });

const ThemeToggle = function(ctx: Comp) {
  // Read global state
  const mode = themeStore.data.mode;
  
  const toggle = () => {
    const newMode = mode === "light" ? "dark" : "light";
    themeStore.set({ mode: newMode });
  };
  
  return div(
    { style: { background: mode === "dark" ? "#333" : "#fff" } },
    h1("Theme: " + mode),
    button("Toggle Theme", { onclick: toggle })
  );
};

const HomePage = new Page({
  title: "Theme Demo",
  template: () => ThemeToggle()
});

Router.BrowserRoutes({ "/": HomePage });
```

## Form with Validation

```ts
import { div, h1, input, button, p, Page, Router } from "cradova";

const LoginForm = function(ctx: Comp) {
  const [email, setEmail] = ctx.useState("");
  const [password, setPassword] = ctx.useState("");
  const [errors, setErrors] = ctx.useState({});
  
  const validate = () => {
    const errs = {};
    if (!email.includes("@")) errs.email = "Invalid email";
    if (password.length < 6) errs.password = "Password too short";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };
  
  const handleSubmit = () => {
    if (validate()) {
      console.log("Login:", { email, password });
    }
  };
  
  return div(
    h1("Login"),
    input({ 
      type: "email", 
      placeholder: "Email",
      value: email,
      oninput(e) { setEmail(e.target.value) }
    }),
    errors.email ? p({ style: { color: "red" } }, errors.email) : null,
    input({ 
      type: "password", 
      placeholder: "Password",
      value: password,
      oninput(e) { setPassword(e.target.value) }
    }),
    errors.password ? p({ style: { color: "red" } }, errors.password) : null,
    button("Login", { onclick: handleSubmit })
  );
};

const HomePage = new Page({
  title: "Login",
  template: () => LoginForm()
});

Router.BrowserRoutes({ "/": HomePage });
```

## Fetch Data

```ts
import { div, h1, p, button, Page, Router } from "cradova";

const UserList = function(ctx: Comp) {
  const [users, setUsers] = ctx.useState([]);
  const [loading, setLoading] = ctx.useState(false);
  const [error, setError] = ctx.useState(null);
  
  ctx.useEffect(() => {
    loadUsers();
  }, []);
  
  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://jsonplaceholder.typicode.com/users");
      const data = await response.json();
      setUsers(data.slice(0, 5));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return div("Loading...");
  if (error) return div("Error: " + error);
  
  return div(
    h1("Users"),
    button("Refresh", { onclick: loadUsers }),
    users.map(user => 
      div({ key: user.id }, p(user.name), p(user.email))
    )
  );
};

const HomePage = new Page({
  title: "Users",
  template: () => UserList()
});

Router.BrowserRoutes({ "/": HomePage });
```

## Multiple Routes

```ts
import { div, h1, button, Page, Router } from "cradova";

const HomePage = new Page({
  title: "Home",
  template: function(ctx) {
    return div(
      h1("Home Page"),
      button("Go to About", { onclick: () => Router.navigate("/about") })
    );
  }
});

const AboutPage = new Page({
  title: "About",
  template: function(ctx) {
    return div(
      h1("About Us"),
      button("Go to Home", { onclick: () => Router.navigate("/") }),
      button("Go to Contact", { onclick: () => Router.navigate("/contact") })
    );
  }
});

const ContactPage = new Page({
  title: "Contact",
  template: function(ctx) {
    return div(
      h1("Contact"),
      button("Back", { onclick: () => Router.navigate("/about") })
    );
  }
});

Router.BrowserRoutes({
  "/": HomePage,
  "/about": AboutPage,
  "/contact": ContactPage
});
```

## Using with CSS

```ts
// styles.css
/*
.btn {
  padding: 10px 20px;
  background: blue;
  color: white;
  border: none;
  cursor: pointer;
}
.btn:hover {
  background: darkblue;
}
*/

// index.ts
import "./styles.css";

const StyledButton = function(ctx: Comp) {
  return button(
    { className: "btn" },
    "Click Me"
  );
};

// Or inline styles
const InlineStyled = function(ctx: Comp) {
  return div(
    { style: { 
      padding: "20px", 
      backgroundColor: "blue", 
      color: "white" 
    }},
    "Styled Content"
  );
};
```

## Ref and DOM Access

```ts
import { div, input, button, p, Page, Router } from "cradova";

const FormWithRef = function(ctx: Comp) {
  const inputRef = ctx.useRef<HTMLInputElement>();
  
  const handleClick = () => {
    const input = inputRef.current("my-input");
    p("Value: " + input?.value);
    input?.focus();
  };
  
  return div(
    input({ 
      ref: inputRef.bind("my-input"),
      type: "text",
      placeholder: "Type here..."
    }),
    button("Get Value", { onclick: handleClick })
  );
};

const HomePage = new Page({
  title: "Ref Demo",
  template: () => FormWithRef()
});

Router.BrowserRoutes({ "/": HomePage });
```

## useEffect with Cleanup

```ts
import { div, h1, button, Page, Router } from "cradova";

const TimerComponent = function(ctx: Comp) {
  const [seconds, setSeconds] = ctx.useState(0);
  
  ctx.useEffect(() => {
    // Start timer
    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
    
    // Cleanup on unmount
    return () => clearInterval(interval);
  }, []); // Empty deps = run once
  
  return div(
    h1("Timer: " + seconds + "s"),
    button("Reset", { onclick: () => setSeconds(0) })
  );
};

const HomePage = new Page({
  title: "Timer",
  template: () => TimerComponent()
});

Router.BrowserRoutes({ "/": HomePage });
```

## useMemo Example

```ts
import { div, h1, button, p, Page, Router } from "cradova";

const ExpensiveComponent = function(ctx: Comp) {
  const [numbers, setNumbers] = ctx.useState([5, 2, 8, 1, 9]);
  const [filter, setFilter] = ctx.useState("all");
  
  // Memoize expensive sort
  const sorted = ctx.useMemo(() => {
    console.log("Sorting..."); // Only runs when numbers change
    return [...numbers].sort((a, b) => a - b);
  }, [numbers]);
  
  // Memoize filtered
  const filtered = ctx.useMemo(() => {
    if (filter === "even") return sorted.filter(n => n % 2 === 0);
    if (filter === "odd") return sorted.filter(n => n % 2 !== 0);
    return sorted;
  }, [sorted, filter]);
  
  return div(
    h1("Numbers: " + filtered.join(", ")),
    div(
      button("Sort", { onclick: () => setNumbers([...numbers].reverse()) }),
      button("Filter: All", { onclick: () => setFilter("all") }),
      button("Filter: Even", { onclick: () => setFilter("even") }),
      button("Filter: Odd", { onclick: () => setFilter("odd") })
    )
  );
};

const HomePage = new Page({
  title: "Memo Demo",
  template: () => ExpensiveComponent()
});

Router.BrowserRoutes({ "/": HomePage });
```

## Running Examples

To run these examples:

1. Install Cradova: `npm i cradova`
2. Create an HTML file with `<div data-wrapper="app"></div>`
3. Import and use the components
4. Build with a bundler (esbuild, rollup, etc.)

Example `index.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <title>Cradova App</title>
</head>
<body>
  <div data-wrapper="app"></div>
  <script type="module" src="./index.js"></script>
</body>
</html>
```

</docmach>
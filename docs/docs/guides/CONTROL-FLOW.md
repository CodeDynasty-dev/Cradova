<docmach type="wrapper" replacement="content" file="docs/assets/docs.html">


# Cradova Control Flow

This guide covers conditional rendering in Cradova using $if, $ifelse, $switch, and $case.

## $if - Conditional Rendering

```ts
import { $if, div, p, button } from "cradova";

const ConditionalComponent = function(ctx: Comp) {
  const [show, setShow] = ctx.useState(false);
  
  return div(
    button("Toggle", { onclick: () => setShow(!show) }),
    
    // Render conditionally
    $if(show, p("This is shown when true"))
  );
};
```

### $if with Multiple Children

```ts
$if(isLoggedIn, 
  div(
    h1("Welcome!"),
    button("Logout", { onclick: logout })
  )
)
```

### $if with Else (using $ifelse)

```ts
import { $ifelse, div, p } from "cradova";

$ifelse(
  user.loggedIn,
  div(p("Welcome back!")),
  div(p("Please log in"))
)
```

## $ifelse - If/Else Pattern

```ts
import { $ifelse, div, h1, p } from "cradova";

const AuthMessage = function(ctx: Comp) {
  const [isLoggedIn, setIsLoggedIn] = ctx.useState(false);
  
  return div(
    $ifelse(
      isLoggedIn,
      div(
        h1("Welcome back!"),
        button("Logout", { onclick: () => setIsLoggedIn(false) })
      ),
      div(
        h1("Hello guest"),
        button("Login", { onclick: () => setIsLoggedIn(true) })
      )
    )
  );
};
```

## $switch/$case - Switch Statement

```ts
import { $switch, $case, div, h1, p } from "cradova";

const StatusDisplay = function(ctx: Comp) {
  const [status, setStatus] = ctx.useState("loading");
  
  return div(
    $switch(
      status,
      $case("loading", () => div(p("Loading..."))),
      $case("success", () => div(h1("Success!"))),
      $case("error", () => div(p("Something went wrong"))),
      $case("pending", () => div(p("Please wait")))
    )
  );
};
```

### $case with Default

```ts
$switch(
  role,
  $case("admin", () => div("Admin panel")),
  $case("user", () => div("User dashboard")),
  $case("guest", () => div("Limited access")),
  // No default - renders nothing if no match
)
```

## Complex Example

```ts
const Dashboard = function(ctx: Comp) {
  const [view, setView] = ctx.useState("overview");
  const [user, setUser] = ctx.useState({ role: "admin", active: true });
  
  return div(
    // Navigation
    div(
      button("Overview", { onclick: () => setView("overview") }),
      button("Settings", { onclick: () => setView("settings") }),
      button("Admin", { onclick: () => setView("admin") })
    ),
    
    // Content based on view
    $switch(
      view,
      $case("overview", () => div(
        h1("Overview"),
        p("Welcome to your dashboard")
      )),
      $case("settings", () => div(
        h1("Settings"),
        p("Configure your preferences")
      )),
      $case("admin", () => 
        // Nested conditionals
        $if(
          user.role === "admin",
          div(
            h1("Admin Panel"),
            p("Manage users and settings")
          ),
          div(p("Access denied"))
        )
      )
    ),
    
    // Show based on user state
    $if(
      user.active,
      div(p("User is active"))
    ),
    
    $ifelse(
      user.role === "admin",
      div(p("You have admin privileges")),
      div(p("Standard user"))
    )
  );
};
```

## Dynamic Conditions

```ts
const DynamicList = function(ctx: Comp) {
  const [items, setItems] = ctx.useState(["a", "b", "c"]);
  const [filter, setFilter] = ctx.useState("all");
  
  const filteredItems = ctx.useMemo(() => {
    if (filter === "all") return items;
    return items.filter(i => i.startsWith(filter));
  }, [items, filter]);
  
  return div(
    // Show loading state
    $if(
      items.length === 0,
      div(p("No items"))
    ),
    
    // Show content
    $if(
      items.length > 0,
      div(
        filteredItems.map(item => p(item))
      )
    )
  );
};
```

## Combining with State

```ts
const FormValidation = function(ctx: Comp) {
  const [email, setEmail] = ctx.useState("");
  const [error, setError] = ctx.useState(null);
  
  const handleSubmit = () => {
    if (!email.includes("@")) {
      setError("Invalid email");
      return;
    }
    setError(null);
    // Submit...
  };
  
  return div(
    input({ 
      type: "email",
      value: email,
      oninput(e) { setEmail(e.target.value) }
    }),
    
    // Show error conditionally
    $if(error, div(p(error))),
    
    // Show success message
    $if(!error && email, 
      div(p("Looks good!"))
    ),
    
    button("Submit", { onclick: handleSubmit })
  );
};
```

## Control Flow in Loops

```ts
const TaskList = function(ctx: Comp) {
  const [tasks, setTasks] = ctx.useState([
    { id: 1, done: false, title: "Task 1" },
    { id: 2, done: true, title: "Task 2" }
  ]);
  
  return div(
    tasks.map(task =>
      div(
        $switch(
          task.done,
          $case(true, () => div(p(task.title + " ✓"))),
          $case(false, () => div(p(task.title)))
        )
      )
    )
  );
};
```

## Best Practices

1. **Use $switch/$case** for multiple conditions - cleaner than nested $if
2. **Use $ifelse** for simple if/else - more readable
3. **Use $if** for simple boolean conditions
4. **Keep conditions simple** - extract complex logic to memoized values
5. **Remember $case returns a function** - `() => div(content)` not just `div(content)`

## Quick Reference

| Function | Use Case |
|----------|----------|
| `$if(condition, content)` | Show content when true |
| `$ifelse(condition, trueContent, falseContent)` | If/else conditional |
| `$switch(value, ...$case(value, fn))` | Match multiple values |
| `$case(value, fn)` | Single case in switch |

</docmach>
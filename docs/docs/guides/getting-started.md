<docmach type="wrapper" replacement="content" file="docs/assets/docs.html">

# Getting Started

Cradova is a lightweight, reactive UI framework designed for building modern web applications with simplicity and performance. Inspired by SolidJS, Cradova provides a declarative API, fine-grained reactivity, and efficient DOM updates.

## Installation

```bash
npm install cradova
```

## Basic Concepts

### Creating Components

```ts
const HelloWorld = () =>
  div(
    h1("Hello World!"),
    p("Welcome to Cradova"),
    button("Click me", {
      onclick() {
        alert("Button clicked!");
      },
    })
  );
```

### State Management

```ts
const Counter = function (ctx: Comp) {
  const [count, setCount] = ctx.useState(0);

  return div(
    p("Count:" + count),
    button("Increment", {
      onclick() {
        setCount(count + 1);
      },
    })
  );
};
```

## API Reference

### Primitive Elements

#### `div`, `p`, `button`, `h1`-`h6`, etc.

Create DOM elements with children and properties.

```ts
div(
  h1("Title"),
  p("Description", { className: "text" }),
  button("Submit", { disabled: true })
);
```

#### `fragment(...children)`

Creates a document fragment for grouping elements.

```ts
frag([div("Child 1"), div("Child 2")]);
```

#### `raw(html)`

Inject raw HTML content.

```ts
raw("<div>Dangerous content</div>");
```

### Control Flow

#### `$switch(value, ...cases)`

Conditional rendering based on value matching.

```ts
$switch(
  count,
  $case(1, () => h1("One")),
  $case(2, () => h1("Two")),
  $case(3, () => h1("Three"))
);
```

#### `loop(data, component)`

Render lists of data.

```ts
loop(["Apple", "Banana", "Cherry"], (fruit, index) =>
  p("" + index + 1 + ". " + fruit)
);
```

### State Management

#### `Signal(initial, options)`

Reactive state container with automatic dependency tracking.

```ts
const counter = new Signal({ value: 0 });

// Subscribe to changes
counter.computed("value", () => {
  console.log("Count:" + counter.data.value);
});

// Update value
counter.data.value = 1;
```

#### `List(data, itemComponent, options)`

Reactive array with efficient rendering.

```ts
const todoList = new List(
  ["Task 1", "Task 2"],
  (task, index) =>
    p(task, {
      onclick: () => todoList.splice(index, 1),
    }),
  { itemHeight: 40 }
);

// Add new item
todoList.push("New Task");
```

### Hooks

#### `useState(initialValue)`

Component-local state management.

```ts
const [count, setCount] = ctx.useState(0);
```

#### `useEffect(effect, dependencies)`

Side effects management.

```ts
ctx.useEffect(() => {
  const timer = setInterval(() => {
    setCount((c) => c + 1);
  }, 1000);

  return () => clearInterval(timer);
}, []);
```

#### `useRef()`

Reference to DOM elements.

```ts
const ref = ctx.useRef<HTMLInputElement>();

return input({
  ref: ref.bind("input"),
  oninput: () => {
    console.log(ref.current("input")?.value);
  },
});
```

### Routing

#### `Page(options)`

Define application pages.

```ts
const HomePage = new Page({
  title: "Home",
  template: () =>
    div(
      h1("Home Page"),
      button("Go to About", {
        onclick: () => Router.navigate("/about"),
      })
    ),
});
```

#### `Router`

Application navigation manager.

```ts
Router.BrowserRoutes({
  "/": HomePage,
  "/about": new Page({
    template: () => h1("About Page"),
  }),
});
```

### Utilities

#### `invoke(component, ...args)`

Render a component with arguments.

```ts
const UserCard = (ctx, user) => div(user.name);
invoke(UserCard, { name: "Alice" });
```

## Examples

### Todo List Application

```ts
const todoStore = new List([], (task, index) =>
  p(task, {
    onclick: () => todoStore.splice(index, 1),
  })
);

const TodoApp = (ctx: Comp) => {
  const ref = ctx.useRef<HTMLInputElement>();

  return div(
    h1("Todo List"),
    input({
      ref: ref.bind("input"),
      onkeydown: (e) => {
        if (e.key === "Enter") addTodo();
      },
    }),
    button("Add", {
      onclick: addTodo,
    }),
    todoStore.Element
  );

  function addTodo() {
    const input = ref.current("input");
    if (input?.value) {
      todoStore.push(input.value);
      input.value = "";
    }
  }
};
```

## Conclusion

Cradova provides a simple yet powerful API for building reactive web applications. With its fine-grained reactivity model, efficient DOM updates, and familiar component-based architecture, Cradova enables developers to create performant applications with minimal overhead.

For more examples and advanced usage patterns, explore the sample application included in the documentation.

</docmach>

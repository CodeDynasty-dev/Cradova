<docmach type="wrapper" replacement="content" file="docs/assets/docs.html">

# Getting Started

Cradova is a lightweight, reactive UI framework designed for building modern web applications with simplicity and performance. Inspired from principles of SolidJS and designs of React and Mithril.js, Cradova provides a declarative API, fine-grained reactivity, and efficient DOM updates.

## Installation

```bash
npm install cradova
```

 ## Examples

### Todo List Application

```ts
const todoStore = new List([], (task, index) =>
  p(task, {
    onclick: () => todoStore.splice(index, 1),
  }),
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
    todoStore.Element,
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

## Docs

Complete documentation for building with the Cradova framework.

- [SKILL.md - Framework Overview](./SKILL.html) - Core concepts and when to use Cradova
- [BASICS.md - Getting Started](./BASICS.html) - Quick start guide
- [CONVENTIONS.md](./CONVENTIONS.html) - Function vs arrow function rules
- [STATE.md](./STATE.html) - Signal and hooks deep dive
- [COMPONENTS.md](./COMPONENTS.html) - Creating and using components
- [ROUTING.md](./ROUTING.html) - Page and Router configuration
- [CONTROL-FLOW.md](./CONTROL-FLOW.html) - Conditional rendering ($if, $ifelse, $switch, $case, loop)
- [PERFORMANCE.md](./PERFORMANCE.html) - List virtualization, optimization
- [EXAMPLES.md](./EXAMPLES.html) - Complete code examples
- [PRODUCTION.md](./PRODUCTION.html) - Real-world patterns and deployment

### invoke and fragment Utilities

#### `invoke(component, ...args)`

Render a component with arguments.

```ts
import { invoke } from "cradova";
const UserCard = function (ctx, user) {
  return div(user.name);
};
invoke(UserCard, { name: "Alice" });
```

#### `fragment(...children)`

Creates a document fragment for grouping elements without adding extra DOM nodes.

```ts
frag(div("Child 1"), div("Child 2"));
```

## Conclusion

Cradova provides a simple yet powerful API for building reactive web applications. With its fine-grained reactivity model, efficient DOM updates, and familiar component-based architecture, Cradova enables developers to create performant applications with minimal overhead.

For more examples and advanced usage patterns, explore the sample application included in the documentation.

</docmach>

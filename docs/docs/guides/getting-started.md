<docmach type="wrapper" replacement="content" file="docs/assets/docs.html">

# Getting Started

Cradova is a lightweight, reactive UI framework designed for building modern web applications with simplicity and performance. 
<br>

Inspired from principles of SolidJS and designs of React and Mithril.js, Cradova provides a declarative API, fine-grained reactivity, and efficient DOM updates.

## Installation

```bash
npm install cradova
```
# Docs

Complete documentation for building with the Cradova framework.
<br>
<br>
- [Framework Overview](./SKILL.html) - Core concepts and when to use Cradova
- [Getting Started](./BASICS.html) - Quick start guide
- [conventions](./CONVENTIONS.html) - Function vs arrow function rules
- [state](./STATE.html) - Signal and hooks deep dive
- [component](./COMPONENTS.html) - Creating and using components
- [routing](./ROUTING.html) - Page and Router configuration
- [control flow](./CONTROL-FLOW.html) - Conditional rendering ($if, $ifelse, $switch, $case, loop)
- [performance](./PERFORMANCE.html) - List virtualization, optimization
- [example](./EXAMPLES.html) - Complete code examples
- [production](./PRODUCTION.html) - Real-world patterns and deployment
<br>
<br>

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

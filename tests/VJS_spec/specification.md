Draft / February 18, 2023 by friday candour

Updated / January 10, 2024 by friday candour

updated / June 18, 2024 by friday candour

# Introduction

## VJS

Vanilla JavaScript spec (VJS) is particularly JavaScript functions and nothing
more, VJS as a stack of function calls defining a Document Object Model (DOM)
structure.

It is naturally ECMAScript compliant and require no preprocessor (transpilers),
which means it works on all engines and browsers.

VJS syntax consist of the tag name as a function in lowercase, while its
parameters will then consists it's children if any and an attributes list in an
object syntax.

VJS tags should be completely typed to support HTML attributes for each element
type where possible.

It is required that first parameter to be the Attributes object of the element
type if needed, but it can appear at any position of the parameter list.

Valid VJS children are string, valid HTML elements, VJS functions, functions
that return valid HTML or string and undefined.

# Rationale

The VJS specification is to define a concise and familiar syntax for defining
tree structures with attributes using vanilla JavaScript, and not generic which
means not requiring a build step for transpilation.

### VJS Elements tree structure

Syntax

```
TAG( => props, => ...children)
```

### The VJS template

Syntax

```js
// examples
div();
div({ className: "button-red m10" });
div({ className: "btn" }, p("hello world"));
```

### VJS attributes

Syntax

```js
// VJS tags
span()
div( { { id: "bar" }} ) // valid
table( { style: { color: "red" }} ) // should throw and error
 // and all html elements
```

### VJS Children

Syntax

```js
// A child can be string, HTML element and document fragment.

// looping
const names = ["john", "paul"];
div(names.map((name) => p("hello " + name)));

// conditional rendering

let age = 12;
div(age > 16 ? p("let me get bear") : p("let me get you yoghurt"));
```

### VJS Components

Syntax

```js
function Hello(name) {
  return h1("Hello " + name);
}
```

## Why not JSX or JXON?

## JSX

[JSX](https://facebook.github.io/jsx/#sec-prior-art) is a standard in abundant
use, and another alternative would be to use object initializers like the JXON
spec.

In JSX adding attributes and values to elements using curly braces lacks ability
to send a single value to the resulting component or HTML markup function.

this is an opinionated syntax that tied to transpilation benefits which jsx is
heavily based on.

JSX relies heavily on preprocessor (transpilers) like Babel which has a time and
build cost in development cycles.

It is not possible to assign JSX directly to variables without retaining them
from a function which in static cases is not needed.

in the case of

JSX

```js
const name = <p>john</p>;
```

VJS

```js
const name = p("john");
```

This is significant regarding VJS can be more useful in many light cases whereas
JSX requires full blown transpiler and bundler setup, which in those is very
unneeded and bloat.

## JXON

In the
[JXON](https://htmlpreview.github.io/?https://github.com/mdn/archived-content/blob/main/files/en-us/archive/jxon/raw.HTML)
spec, the balanced braces do not give great syntactic hints for where an element
starts and ends in large trees and also the Balanced named tags is a critical
syntactic feature of the XML-style notation.

## VJS

- Firstly VJS has less abstraction layers and expose control flow.

- VJS is well formatted with default Javascript linters than others.

- VJS has no compilation step making it faster in development cycle and lighter
  on system resources during development.

- It is possible to assign variables to VJS in static cases easily as seen
  above.

- Adding attributes to elements is possible with a - regular JavaScript object.

VJS can be a standard for more concise web development uses cases where
interoperability with vanilla JavaScript is important, to achieve better
developer experience and creativity and faster web apps due to its design.

VJS is currently implemented in the
[Cradova](https://github.com/fridaycandour/cradova) web development framework.

It's fairly easy to see how VJS is similar to the flutter mobile development
syntax. it is only quite more intuitive.

<hr>

### This work is licensed under the MIT license.

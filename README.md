<br/>
<p align="center">
  <a href="https://github.com/codedynasty-dev/cradova">
    <img src="https://raw.githubusercontent.com/CodeDynasty-dev/cradova/main/icon.png" alt="Logo" width="80" height="80">
  </a>

<h1 align="center">Cradova</h1>

<p align="center">
Build web apps that are fast, small, and simple.
    <br/>
    <br/>
    <a href="https://github.com/codedynasty-dev/cradova#examples"><strong>Explore the 🎙️ docs »</strong></a>
    <br/>
    <br/>
    <a href="https://t.me/codedynasty-devHQ">Join Community</a>
    .
    <a href="https://github.com/codedynasty-dev/cradova/issues">Report Bug</a>
    .
    <a href="https://github.com/codedynasty-dev/cradova/issues">Request Feature</a>
  </p>
</p>

![Contributors](https://img.shields.io/github/contributors/codedynasty-dev/cradova?color=dark-green)
![Issues](https://img.shields.io/github/issues/codedynasty-dev/cradova)
![License](https://img.shields.io/github/license/codedynasty-dev/cradova)
[![npm Version](https://img.shields.io/npm/v/cradova.svg)](https://www.npmjs.com/package/cradova)
[![License](https://img.shields.io/npm/l/cradova.svg)](https://github.com/cradova/cradova.js/blob/next/LICENSE)
[![npm Downloads](https://img.shields.io/npm/dm/cradova.svg)](https://www.npmjs.com/package/cradova)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/cradova/cradova.js/blob/next/contributing.md)
![Forks](https://img.shields.io/github/forks/codedynasty-dev/cradova?style=social)
![Stargazers](https://img.shields.io/github/stars/codedynasty-dev/cradova?style=social)

 
  ## Component in Cradova

```js
import { div, h1 } from "cradova";

function Hello(ctx) {

const [name, setName] = ctx.useState("");

  return div(

    h1("Hello " + name, {
    className: "title",
    style: {
      color: "grey",
    },
  }),

  input({
    oninput(e){
      setName(e.target.value);
    }
  }),

  )
}


document.body.append(div(hello)); // 
```

# Contents

- [What is Cradova](#what-is-cradova)
- [Why Cradova?](#whats-the-benefit)
- [Installation](#installation)
- [Examples](#examples)
- [Documentation](#documentation)
- [Getting Help](#getting-help)
- [Contributing](#contributing)

## Why Cradova?

Cradova is not react, it's simpler, faster for most components and basically bare javascript syntax, no bundler needed.

And.
Cradova follows the
[VJS specification](https://github.com/codedynasty-dev/cradova/blob/main/VJS_spec/specification.md)

## What's the benefit?

Fast and simple with and fewer abstractions and yet easily composable.

Cradova is not built on virtual DOM or diff algorithms. Instead, State
management is even based and only affect dom parts is updated, least repaint, done in a way that is simple, easy and fast.

## Is this a big benefit?

Undoubtedly, this provides a significant advantage.

[current version changes](https://github.com/codedynasty-dev/cradova/blob/main/CHANGELOG.md#v400)

## Installation

### From npm

```bash
npm i cradova
```

### CDN sources

```html
<!-- unpkg -->
<script src="https://unpkg.com/cradova/dist/index.js"></script>
<!--    js deliver -->
<script src="https://cdn.jsdelivr.net/npm/cradova/dist/index.js"></script>
```

## Basic Samples

This a collection of basic examples that can give you some ideas

```js
import {
  br,
  button,
  Function,
  createSignal,
  div,
  h1,
  reference,
  useRef,
} from "cradova";

// hello message

function HelloMessage() {
  return div("Click to get a greeting", {
    onclick() {
      const name = prompt("what are your names");
      this.innerText = name ? "hello " + name : "Click to get a greeting";
    },
  });
}

// reference (not state)

function typingExample() {
  const ref = useRef();
  return div(
    input({
      oninput() {
        ref.current("text").innerText = this.value;
      },
      placeholder: "typing simulation",
    }),
    p(" no thing typed yet!", { reference: ref.bindAs("text") })
  );
}

function App() {
  return div(typingExample, HelloMessage);
}

document.body.append(App());
```

## Simple Todo list

Let's see a simple TodoList example

```js
import {
  button,
  Function,
  createSignal,
  div,
  h1,
  input,
  main,
  p,
  useRef,
  useState,
} from "../dist/index.js";

// creating a store
const todoStore = new Signal({
  todo: ["take bath", "code coded", "take a break"],
});

// create actions
const addTodo = function (todo: string) {
  todoStore.publish("todo", [...todoStore.store.todo, todo]);
};

const removeTodo = function (todo: string) {
  const ind = todoStore.store.todo.indexOf(todo);
  todoStore.store.todo.splice(ind, 1);
  todoStore.publish("todo", todoStore.store.todo);
};


function TodoList() {
  // can be used to hold multiple references
  const referenceSet = useRef();
  // bind Function to Signal
  todoStore.subscribe("todo", todoList);
  // vjs
  return main(
    h1(`Todo List`),
    div(
      input({
        placeholder: "type in todo",
        reference: referenceSet.bindAs("todoInput"),
      }),
      button("Add todo", {
        onclick() {
          addTodo(
            referenceSet.elem<HTMLInputElement>("todoInput")!.value || ""
          );
          referenceSet.elem<HTMLInputElement>("todoInput")!.value = "";
        },
      })
    ),
    todoList
  );
}

const todoList =  function () {
  const data = this.pipes.get("todo");
  return div(
    data.map((item: any) =>
      p(item, {
        title: "click to remove",
        onclick() {
          removeTodo(item);
        },
      })
    )
  );
};
document.body.appendChild(TodoList());
```

## Getting Help

To get further insights and help on Cradova, visit the
[Discord](https://discord.gg/b7fvMg38) and [Telegram](https://t.me/codedynasty-devHQ)
Community Chats.

## Contributing

We are currently working to
[set](https://github.com/codedynasty-dev/cradova/blob/main/contributing.md) up the
following:

- Cradova Docs
- Sample projects
- maintenance and promotion

```
 ██████╗   ██████╗    █████═╗   ███████╗    ███████╗    ██╗   ██╗  █████╗
██╔════╝   ██╔══██╗  ██╔═╗██║   █      ██  ██╔═════╝█   ██║   ██║  ██╔═╗██
██║        ██████╔╝  ███████║   █      ██  ██║     ██   ██║   ██║  ██████╗
██║        ██╔══██╗  ██║  ██║   █      ██  ██║     ██   ╚██╗ ██╔╝  ██║  ██╗
╚██████╗   ██║  ██║  ██║  ██║   ███████╔╝   ████████      ╚███╔╝   ██║  ██║
 ╚═════╝   ╚═╝  ╚═╝  ╚═╝  ╚═╝   ╚══════╝     ╚════╝        ╚══╝    ╚═╝  ╚═╝
```

## MIT Licensed

Open sourced And Free.

### Contribution and License Agreement

If you contribute code to this project, you are implicitly allowing your code to
be distributed under same license. You are also implicitly verifying that all
code is your original work.

## Supporting Cradova development

Your Support is a good force for change anytime you do it, you can ensure Our
projects, growth, Cradova, Cradova, JetPath etc, growth and improvement by
making a re-occurring or fixed sponsorship to
[github sponsors](https://github.com/sponsors/FridayCandour):

Support via cryptos -

- BTC: `bc1q228fnx44ha9y5lvtku70pjgaeh2jj3f867nwye`
- ETH: `0xd067560fDed3B1f3244d460d5E3011BC42C4E5d7`
- LTC: `ltc1quvc04rpmsurvss6ll54fvdgyh95p5kf74wppa6`
- TRX: `THag6WuG4EoiB911ce9ELgN3p7DibtS6vP`

---

Build Powerful Web Apps. Ship Faster. Ship Smaller.
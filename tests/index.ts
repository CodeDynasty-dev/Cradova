// Simple todo list

import {
  a,
  button,
  div,
  Comp,
  h1,
  input,
  main,
  p,
  Page,
  Router,
  Signal,
} from "../dist/index.js";

// creating a store
const todoStore = new Signal({
  todo: ["take bath", "code coded", "take a break"],
});

// create actions
const addTodo = function (todo: string) {
  todoStore.publish("todo", [...todoStore.pipe.todo, todo]);
};

const removeTodo = function (todo: string) {
  const ind = todoStore.pipe.todo.indexOf(todo);
  todoStore.pipe.todo.splice(ind, 1);
  todoStore.publish("todo", todoStore.pipe.todo);
};
function TodoList(this: Comp) {
  // can be used to hold multiple references
  const referenceSet = this.useRef<HTMLInputElement>();
  // bind Function to Signal
  todoStore.subscribe("todo", todoList);
  // markup
  return main(
    h1(`Todo List`),
    div(
      input({
        placeholder: "type in todo",
        ref: referenceSet.bind("todoInput"),
      }),
      button("Add todo", {
        onclick() {
          addTodo(referenceSet.current["todoInput"]?.value || "");
          referenceSet.current["todoInput"]!.value = "";
        },
      })
    ),
    todoList
  );
}

const todoList = function (this: Comp) {
  const data = todoStore.pipe.todo;
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

const count = function (this: Comp) {
  const [count, setCounter] = this.useState(0);
  this.useEffect(() => {
    setInterval(() => {
      setCounter((p) => p + 1);
    }, 1000);
  });
  return h1(" count: " + count);
};

function HelloMessage() {
  return div("Click to get a greeting", {
    onclick() {
      const name = prompt("what are your names");
      this.innerText = name ? "hello " + name : "Click to get a greeting";
    },
  });
}

// using CradovaRef

const nameRef = function (this: Comp) {
  const [name, setName] = this.useState<string | null>(null);
  return div(name ? "hello " + name : "Click to get a second greeting", {
    onclick() {
      const name = prompt();
      if (name) {
        setName(name);
      } else {
        alert("Please provide a valid name");
      }
    },
  });
};

// reference (not state)

function typingExample(this: Comp) {
  const ref = this.useRef<HTMLElement>();
  return div(
    input({
      oninput() {
        ref.current["text"]!.innerText = this.value;
      },
      placeholder: "typing simulation",
    }),
    p(" no thing typed yet!", { ref: ref.bind("text") }),
    a({ href: "/p" }, "log lol in the console")
  );
}

function App() {
  return div(count, HelloMessage, nameRef, typingExample);
}

Router.BrowserRoutes({
  "/p": new Page({
    template() {
      return div(a("let's test link navigate", { href: "/a?name=friday" }), {});
    },
  }),
  "/": new Page({
    name: "boohoo 1",
    snapshotIsolation: true,
    template() {
      return div(
        button("go to Function as page", {
          onclick() {
            Router.navigate("/p");
          },
          name: "friday",
          type: "button",
        }),
        TodoList,
        App
      );
    },
  }),
  "/test": new Page({
    snapshotIsolation: true,
    name: "boohoo 2",
    template() {
      return div(
        button("go to Function as page", {
          onclick() {
            Router.navigate("/p");
          },
        }),
        TodoList,
        App
      );
    },
  }),
});

const something = input({
  oninput(e) {
    e.target;
    console.log(this.value); // ✅ Works! `this` is correctly inferred as `HTMLInputElement`
  },
  placeholder: "Typing simulation",
});

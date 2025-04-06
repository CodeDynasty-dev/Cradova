// Simple todo list

import {
  a,
  button,
  div,
  Func,
  h1,
  input,
  main,
  p,
  Page,
  Router,
  Signal,
  useEffect,
  useRef,
  useState,
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
function TodoList() {
  // can be used to hold multiple references
  const referenceSet = useRef();
  // bind Function to Signal
  todoStore.subscribe("todo", todoList);
  // markup
  return main(
    h1(`Todo List`),
    div(
      input({
        placeholder: "type in todo",
        ref: referenceSet.bindAs("todoInput"),
      }),
      button("Add todo", {
        onclick() {
          addTodo(
            referenceSet.elem<HTMLInputElement>("todoInput")?.value || "",
          );
          referenceSet.elem<HTMLInputElement>("todoInput")!.value = "";
        },
      }),
    ),
    todoList,
  );
}

const todoList: Func = function () {
  const data = this.pipes.get("todo");
  return div(
    data.map((item: any) =>
      p(item, {
        title: "click to remove",
        onclick() {
          removeTodo(item);
        },
      })
    ),
  );
};

const count = function () {
  const [count, setCounter] = useState(0, this);
  useEffect(() => {
    setInterval(() => {
      setCounter((p) => p + 1);
    }, 1000);
  }, this);
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

const nameRef = function () {
  const [name, setName] = useState<string | null>(null, this);
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

function typingExample() {
  const ref = useRef();
  return div(
    input({
      oninput() {
        ref.elem<HTMLParagraphElement>("text")!.innerText = this.value;
      },
      placeholder: "typing simulation",
    }),
    p(" no thing typed yet!", { ref: ref.bindAs("text") }),
    a({ href: "/p" }, "log lol in the console"),
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
        App,
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
        App,
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

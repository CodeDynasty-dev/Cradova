// Simple todo list
import { a, button, div, h1, input, ListCreator, main, p, Page, Router, Signal, } from "../dist/index.js";
// creating a store
const todoStore = new Signal({
    store: {
        todo: ["take bath", "code coded", "take a break"],
    },
    list: ["take bath", "code coded", "take a break"],
});
// create actions
const addTodo = function (todo) {
    console.log(todoStore.list);
    // todoStore.store.todo = [...todoStore.store.todo, todo];
    todoStore.list.push(todo);
};
const removeTodo = function (todo) {
    // const ind = todoStore.store.todo.indexOf(todo);
    // todoStore.store.todo.splice(ind, 1);
    const ind = todoStore.list.items.indexOf(todo);
    todoStore.list.remove(ind);
};
function TodoList() {
    // can be used to hold multiple references
    const referenceSet = this.useRef();
    // bind Function to Signal
    // todoStore.subscribe("todo", todoList);
    // markup
    return main(h1(`Todo List`), div(input({
        placeholder: "type in todo",
        ref: referenceSet.bind("todoInput"),
    }), button("Add todo", {
        onclick() {
            addTodo(referenceSet.current["todoInput"]?.value || "");
            // referenceSet.current["todoInput"]!.value = "";
        },
    })), 
    // todoList,
    ListCreator(todoStore, (item) => p(item, {
        title: "click to remove",
        onclick() {
            removeTodo(item);
        },
        style: {
            border: "1px solid yellow",
        },
    }), {
        listContainerClass: "list",
        listContainerStyle: { marginTop: "10px", backgroundColor: "red" },
    }));
}
const todoList = function () {
    const data = todoStore.store.todo;
    return div(data.map((item) => p(item, {
        title: "click to remove",
        onclick() {
            removeTodo(item);
        },
    })));
};
const count = function () {
    const [count, setCounter] = this.useState(0);
    this.useEffect(() => {
        console.log("count updated");
        setInterval(() => {
            setCounter((p) => p + 1);
        }, 1000);
    }, []);
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
    const [name, setName] = this.useState(null);
    return div(name ? "hello " + name : "Click to get a second greeting", {
        onclick() {
            const name = prompt();
            if (name) {
                setName(name);
            }
            else {
                alert("Please provide a valid name");
            }
        },
    });
};
// reference (not state)
function typingExample() {
    const ref = this.useRef();
    return div(input({
        oninput() {
            ref.current["text"].innerText = this.value;
        },
        placeholder: "typing simulation",
    }), p(" no thing typed yet!", { ref: ref.bind("text") }), a({ href: "/p" }, "log lol in the console"));
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
        /**
         * @returns A page with a button that navigates to another page that renders a Function as its template.
         * The page also renders a list of todo items and the App component.
         */
        template() {
            return div(button("go to Function as page", {
                onclick() {
                    Router.navigate("/p");
                },
                name: "friday",
                type: "button",
            }), TodoList, App);
        },
    }),
    "/test": new Page({
        snapshotIsolation: true,
        name: "boohoo 2",
        template() {
            return div(button("go to Function as page", {
                onclick() {
                    Router.navigate("/p");
                },
            }), TodoList, App);
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

// Simple todo list
import { a, button, div, h1, input, List, main, p, Page, Router, Signal, } from "../dist/index.js";
// creating a store
const todoStore = new Signal({
    list: ["take bath", "code coded", "take a break"],
});
function TodoList() {
    // can be used to hold multiple references
    const ref = this.useRef();
    // markup
    return main(h1(`Todo List`), div(input({
        placeholder: "type in todo",
        ref: ref.bind("todoInput"),
    }), button("Add todo", {
        onclick() {
            const todo = ref.current["todoInput"]?.value;
            if (todo) {
                todoStore.list.push(todo);
                ref.current["todoInput"].value = "";
            }
        },
    })), List(todoStore, (item) => p(item, {
        title: "click to remove",
        onclick() {
            todoStore.list.remove(todoStore.list.indexOf(item));
        },
        style: {
            border: "1px solid green",
        },
    }), {
        className: "list",
    }));
}
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

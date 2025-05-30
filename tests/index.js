// Simple todo list
import { $if, a, button, div, h1, input, List, main, p, Page, Router, Signal, } from "../dist/index.js";
// creating a store
const todoStore = new Signal(["take bath", "code coded", "take a break"]);
todoStore.notify(TodoList); // notify the store to update the UI
function TodoList() {
    // can be used to hold multiple references
    const ref = this.useRef();
    // markup
    console.log(todoStore.store);
    return main(h1(`Todo List`), div(todoStore.computed(function () {
        const placeholderText = todoStore.store.length
            ? "type in todo"
            : "no todos yet, type in todo";
        return input({
            placeholder: placeholderText,
            ref: ref.bind("todoInput"),
        });
    }), button("Add todo", {
        onclick() {
            const todo = ref.current["todoInput"]?.value;
            if (todo) {
                todoStore.store.push(todo);
                ref.current["todoInput"].value = "";
            }
        },
    })), List(todoStore, (item) => p(item, {
        title: "click to remove",
        onclick() {
            todoStore.store.remove(todoStore.store.indexOf(item));
        },
        style: {
            border: "1px solid green",
        },
    }), {
        className: "list",
    }), todoStore.computed(function () {
        return div(p("Total todos: " + todoStore.store.length, {
            style: {
                fontWeight: "bold",
                color: "blue",
            },
        }));
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
    return div($if(count > 5, h1("count is greater than 5")), h1(" count: " + count));
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
    oninput() {
        console.log(this.value); // (property) GlobalEventHandlers.oninput: ((this: GlobalEventHandlers, ev: Event) => any) | null
    },
    placeholder: "Typing simulation",
    onmount() {
        console.log("mounted");
    },
});

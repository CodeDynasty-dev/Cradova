// Simple todo list
import { $case, $switch, a, button, div, h1, input, List, main, p, Page, Router, } from "../dist/index.js";
// creating a store
const todoStore = new List(["take bath", "code coded", "take a break"], (item) => p(item, {
    title: "click to remove",
    onclick() {
        todoStore.splice(todoStore.indexOf(item));
    },
    style: {
        border: "1px solid green",
    },
}), {
    itemHeight: 50,
    className: "todo-list",
    id: "todo-list",
});
// todoStore.notify(TodoList);
console.log(todoStore);
function TodoList(ctx) {
    // can be used to hold multiple references
    const ref = ctx.useRef();
    // markup
    return main(h1(`Todo List`), div(input({
        onkeydown(event) {
            if (event.key === "Enter") {
                const todo = ref.current("todoInput")?.value;
                if (todo) {
                    todoStore.push(todo);
                    ref.current("todoInput").value = "";
                }
            }
        },
        placeholder: "type in todo",
        ref: ref.bind("todoInput"),
    }), button("Add todo", {
        onclick() {
            const todo = ref.current("todoInput")?.value;
            if (todo) {
                todoStore.push(todo);
                ref.current("todoInput").value = "";
            }
        },
    })), todoStore.Element, todoStore.computed(function () {
        return div(p("Total todos: " + todoStore.length, {
            style: {
                fontWeight: "bold",
                color: "blue",
            },
        }));
    }));
}
const count = function (ctx) {
    const [count, setCounter] = ctx.useState(0);
    ctx.useEffect(() => {
        // ? setInterval is unnnecessary here,
        // ? it's just to demostrate the cleanup function
        const interval = setInterval(() => {
            setCounter((p) => p + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [count]);
    return div(count > 5 ? () => h1("count is greater than 5") : undefined, count > 10
        ? () => h1("count is greater than 10")
        : () => h1("count is not greater than 10"), $switch(count, $case(1, () => h1("count is 1")), $case(2, () => h1("count is 2")), $case(3, () => h1("count is 3")), $case(4, () => h1("count is 4")), $case(5, () => h1("count is 5")), $case(6, () => h1("count is 6")), $case(7, () => h1("count is 7")), $case(8, () => h1("count is 8")), $case(9, () => h1("count is 9")), $case(10, () => h1("count is 10"))), h1(" count: " + count));
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
const nameRef = function (ctx) {
    const [name, setName] = ctx.useState(null);
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
function typingExample(ctx) {
    const ref = ctx.useRef();
    return div(input({
        ref: ref.bind("input"),
        oninput() {
            ref.current("text").innerText = ref.current("input").value;
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
        title: "boohoo 1",
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
        title: "boohoo 2",
        template() {
            return div(button("go to Function as page", {
                onclick() {
                    Router.navigate("/p");
                },
            }), TodoList, App);
        },
    }),
});

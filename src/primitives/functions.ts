import type { Func, VJS_params_TYPE } from "./types.js";
import { __raw_ref, CradovaEvent } from "./classes.js";

export const makeElement = <E extends HTMLElement>(
  element: E & HTMLElement,
  ElementChildrenAndPropertyList: VJS_params_TYPE<E>
) => {
  const props: Record<string, any> = {};
  let text: string | undefined = undefined;
  //? getting children ready
  if (ElementChildrenAndPropertyList.length !== 0) {
    for (let i = 0; i < ElementChildrenAndPropertyList.length; i++) {
      let child = ElementChildrenAndPropertyList[i];
      // single child lane
      if (typeof child === "function") {
        child = isArrowFunc(child) ? child() : toFunc(child);
      }
      // appending child
      if (child instanceof HTMLElement || child instanceof DocumentFragment) {
        element.appendChild(child as Node);
        continue;
      }

      // children array
      if (Array.isArray(child)) {
        element.appendChild(unroll_child_list(child as HTMLElement[]));
        continue;
      }

      // getting innerText
      if (typeof child === "string") {
        text = child;
        continue;
      }

      // getting props
      if (typeof child === "object") {
        Object.assign(props, child);
        continue;
      }
    }
  } else {
    return element;
  }

  //? adding props
  if (typeof props === "object" && element) {
    // adding attributes
    for (const [prop, value] of Object.entries(props)) {
      // adding styles
      if (prop === "style" && typeof value === "object") {
        Object.assign(element.style, value);
        continue;
      }

      //? setting onmount event;
      if (prop === "onmount") {
        CradovaEvent.after_comp_is_mounted.push(() => {
          typeof props["onmount"] === "function" &&
            props["onmount"].apply(element);
        });
        continue;
      }

      // data-(s) &  aria-(s)
      if (prop.includes("data-") || prop.includes("aria-")) {
        9;
        element.setAttribute(prop, value as string);
        continue;
      }

      if (Array.isArray(value)) {
        // reference
        if (
          prop == "reference" &&
          (value! as unknown[])![0] instanceof __raw_ref
        ) {
          ((value! as unknown[])![0] as __raw_ref)._append(
            (value! as unknown[])![1] as string,
            element
          );
          continue;
        }
      }
      // trying to set other values
      (element as unknown as Record<string, unknown>)[prop] = value;
    }
  }
  if (text !== undefined) {
    element.appendChild(document.createTextNode(text as string));
  }
  return element as E;
};

export const cra = <E extends HTMLElement>(tag: string) => {
  return (...Children_and_Properties: VJS_params_TYPE<E>): E =>
    makeElement<E>(document.createElement(tag) as E, Children_and_Properties);
};

function unroll_child_list(l: VJS_params_TYPE<HTMLElement>) {
  const fg = new DocumentFragment();
  for (let ch of l) {
    if (Array.isArray(ch)) {
      fg.appendChild(unroll_child_list(ch));
    } else {
      if (typeof ch === "function") {
        ch = isArrowFunc(ch) ? ch() : toFunc(ch);
        if (typeof ch === "function") {
          ch = isArrowFunc(ch) ? (ch as any)() : toFunc(ch);
        }
      }
      if (ch instanceof HTMLElement || ch instanceof DocumentFragment) {
        fg.appendChild(ch as unknown as HTMLElement);
        continue;
      }
      if (typeof ch === "string") {
        fg.appendChild(document.createTextNode(ch as string));
      }
    }
  }
  return fg;
}

/**
 * @param {expression} condition
 * @param {function} elements[]
 */

export function $if<E extends HTMLElement>(
  condition: any,
  ...elements: VJS_params_TYPE<E>
): any {
  if (condition) {
    return elements;
  }
}

export function $ifelse(condition: any, ifTrue: any, ifFalse?: any) {
  if (condition) {
    return ifTrue;
  }
  return ifFalse;
}

export function $case<E extends HTMLElement = HTMLElement>(
  value: any,
  ...elements: VJS_params_TYPE<E>
) {
  return (key: any) => {
    if (key === value) {
      return elements;
    }
    return undefined;
  };
}
export function $switch(key: unknown, ...cases: ((key: any) => any)[]) {
  let elements;
  if (cases.length) {
    for (let i = 0; i < cases.length; i++) {
      elements = cases[i](key);
      if (elements) {
        break;
      }
    }
  }
  return elements;
}

type LoopData<Type> = Type[];

export function loop<Type>(
  datalist: LoopData<Type>,
  component: (
    value: Type,
    index?: number,
    array?: LoopData<Type>
  ) => HTMLElement | DocumentFragment | undefined
) {
  return Array.isArray(datalist)
    ? (datalist.map(component) as unknown as HTMLElement[])
    : undefined;
}

/**
 * Document fragment
 * @param children
 * @returns
 */

export const frag = function (children: VJS_params_TYPE<HTMLElement>) {
  const par = document.createDocumentFragment();
  // building it's children tree.
  for (let i = 0; i < children.length; i++) {
    let html: any = children[i];
    if (typeof html === "function") {
      html = html() as HTMLElement;
    }
    if (html instanceof HTMLElement || html instanceof DocumentFragment) {
      par.appendChild(html);
      continue;
    }
    if (html instanceof String) {
      par.appendChild(document.createTextNode(html as unknown as string));
      continue;
    }
    console.error(" ✘  Cradova err:   wrong element type" + html);
  }
  return par;
};

// hooks

/**
 * Cradova
 * ---
 *  Allows functional components to manage state by providing a state value and a function to update it.
 * @param initialValue
 * @param Func
 * @returns [state, setState]
 */
export function useState<S = unknown>(
  newState: S,
  self: any
): [S, (newState: S | ((preS: S) => S)) => void] {
  if (typeof self !== "function") return null as any;
  const Func = self as Func;
  Func._state_index! += 1;
  const idx = Func._state_index!;
  if (idx >= Func._state!.length) {
    Func._state![idx] = newState;
  }

  /**
   * cradova
   * ---
   * set new state and re-renders Func
   * @param newState
   */
  function setState(newState: S | ((preS: S) => S)) {
    if (typeof newState === "function") {
      newState = (newState as (preS: S) => S)(Func._state![idx] as any);
    }
    Func._state![idx] = newState;
    funcManager.recall(Func);
  }
  return [Func._state![idx] as S, setState];
}
/**
 * Cradova
 * ---
Allows side effects to be performed in functional components, such as fetching data or subscribing to events.
 * @param effect
 * @returns
 */
export function useEffect(effect: () => void, self: any) {
  funcManager._effect(self as any, effect);
  if (typeof self !== "function") return null as any;
}

/**
 * Cradova
 * ---
Returns a mutable reference object of dom elements.
 * @returns reference
 */
export function useRef() {
  return new __raw_ref();
}

export const getSignal = (name: string, func: Func) => {
  return func.pipes!.get(name);
};

export const sendSignal = (name: string, data: any, func: Func) => {
  const signal = func.signals!.get(name);
  if (signal) {
    signal.publish(name, data as any);
  } else {
    console.error(" ✘  Cradova err :  Invalid signal name " + name);
  }
};

const isArrowFunc = (fn: Function) => !fn.hasOwnProperty("prototype");
const DEFAULT_STATE = {
  rendered: false,
  published: false,
  preRendered: null,
  reference: null,
  effectuate: null,
  _state_index: 0,
  effects: [],
  _state: [],
};
const toFunc = (func: any) => {
  if (typeof func._state_index === "number") return funcManager.render(func);
  Object.assign(func, DEFAULT_STATE);
  func.signals = new Map();
  func.pipes = new Map();
  return funcManager.render(func);
};

export const funcManager = {
  render(func: Func) {
    Object.assign(func, DEFAULT_STATE);
    const html = func.apply(func);
    // parking
    if (html instanceof HTMLElement) {
      func.reference = html;
      this.effector(func);
      func.rendered = true;
      func.published = true;
    } else {
      console.error(" ✘  Cradova err :  Invalid html content, got  - " + html);
    }
    return html;
  },
  _effect(func: Func, fn: () => Promise<void> | void) {
    if (!func.rendered) {
      func.effects!.push(fn);
    }
  },
  async effector(func: Func) {
    for (let i = 0; i < func.effects!.length; i++) {
      const fn: any = await func.effects![i].apply(func);
      if (typeof fn === "function") {
        CradovaEvent.after_page_is_killed.push(fn);
      }
    }
    func.effects = [];
    if (func.effectuate) {
      func.effectuate();
      func.effectuate = null;
    }
  },
  recall(func: Func) {
    if (!func.rendered) {
      func.effectuate = () => {
        if (func.published) {
          this.activate(func);
        }
      };
    } else {
      if (func.published) {
        setTimeout(() => {
          this.activate(func);
        });
      }
    }
  },
  async activate(func: Func) {
    func.published = false;
    if (!func.rendered) {
      return;
    }
    func._state_index = 0;
    const node = func.reference!;
    // ? check if this Function element is still in the dom
    if (document.contains(node)) {
      // ? compile the Function again
      const html = func.apply(func);
      if (html instanceof HTMLElement) {
        // ? replace the Function element with the Function element
        node!.insertAdjacentElement("beforebegin", html as Element);
        node!.remove();
        func.published = true;
        func.reference = html;
        CradovaEvent.dispatchEvent("after_comp_is_mounted");
      } else {
        console.error(" ✘  Cradova err :  Invalid html, got  - " + html);
      }
    } else {
      func.reference = null;
      func.rendered = false;
    }
  },
};

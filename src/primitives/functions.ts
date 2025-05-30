import * as CSS from "csstype";
import type { Comp, VJS_params_TYPE } from "./types.js";
import { __raw_ref, Signal, VirtualList } from "./classes.js";
import { div } from "./dom-objects.js";
/**
 * @internal
 */
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
        child = isArrowFunc(child) ? child() : toComp(child as unknown as Comp);
      }
      // appending child
      if (child instanceof HTMLElement || child instanceof DocumentFragment) {
        element.appendChild(child as Node);

        continue;
      }

      // children array
      if (Array.isArray(child)) {
        if (child[1] instanceof Signal) {
          // ? push effect to the notifying queue of the signal
          child[1].notify([child[0] as string], () => {
            element.innerHTML = "";
            element.appendChild(
              unroll_child_list([
                (child[1] as Signal).store[child[0] as string] as HTMLElement,
              ])
            );
          });
          element.appendChild(
            // @ts-ignore
            unroll_child_list([child[1].store[child[0]] as HTMLElement])
          );
          continue;
        }
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
      if (prop === "onmount" && typeof props["onmount"] === "function") {
        // @ts-ignore
        window.CradovaEvent.after_comp_is_mounted.push(
          props["onmount"].bind(element)
        );
        continue;
      }

      // data-(s) &  aria-(s)
      if (prop.includes("data-") || prop.includes("aria-")) {
        element.setAttribute(prop, value as string);
        continue;
      }

      if (Array.isArray(value)) {
        // reference
        if (
          prop === "ref" &&
          value.length === 2 &&
          value[0] instanceof __raw_ref &&
          typeof value[1] === "string"
        ) {
          const [refInstance, name] = value as [__raw_ref<unknown>, string];
          refInstance.current[name] = element;
          continue;
        }
        // event = [subscription, signal]
        // Check if it's a tuple of [string, Signal instance]
        if (
          value.length === 2 &&
          value[1] instanceof Signal &&
          typeof value[0] === "string"
        ) {
          const eventName = value[0] as string;
          const signalInstance = value[1] as Signal<Record<string, any>>;
          // Ensure listen can handle a single event name if it expects an array
          signalInstance.notify([eventName] as any, () => {
            element.setAttribute(
              prop,
              signalInstance.store[eventName] as string
            );
          });
          element.setAttribute(
            prop,
            (signalInstance.store as Record<string, any>)[eventName]
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
      fg.appendChild(unroll_child_list(ch as VJS_params_TYPE<HTMLElement>));
    } else {
      if (typeof ch === "function") {
        ch = isArrowFunc(ch) ? ch() : toComp(ch as unknown as Comp);
        if (typeof ch === "function") {
          ch = isArrowFunc(ch)
            ? (ch as () => HTMLElement | DocumentFragment)()
            : toComp(ch);
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
): VJS_params_TYPE<E> | undefined {
  if (condition) {
    return elements;
  }
  return undefined;
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
  ) =>
    | HTMLElement
    | HTMLElement[]
    | DocumentFragment
    | DocumentFragment[]
    | undefined
    | undefined[]
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

export const fragment = function (children: VJS_params_TYPE<HTMLElement>) {
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

//? comparing dependency arrays
function depsAreEqual(prevDeps?: unknown[], nextDeps?: unknown[]): boolean {
  if (!prevDeps || !nextDeps || prevDeps.length !== nextDeps.length) {
    return false;
  }
  for (let i = 0; i < prevDeps.length; i++) {
    if (!Object.is(prevDeps[i], nextDeps[i])) {
      return false;
    }
  }
  return true;
}

// --- Hooks ---

/**
 * Cradova
 * ---
 * Allows functional components to manage state.
 * @param initialValue
 * @returns [state, setState]
 */
function useState<S>(
  this: Comp,
  initialValue: S
): [S, (newState: S | ((prevState: S) => S)) => void] {
  const self = this;
  if (typeof self !== "function" || !self._state) {
    throw new Error(
      "Cradova Hook Error: useState called outside of a Cradova component context."
    );
  }

  const idx = ++self._state_index!;

  if (self._state.length <= idx) {
    self._state[idx] = initialValue;
  }

  const setState = (newState: S | ((prevState: S) => S)) => {
    const currentState = self._state![idx] as S;
    let nextState: S;
    if (typeof newState === "function") {
      nextState = (newState as (prevState: S) => S)(currentState);
    } else {
      nextState = newState;
    }

    if (!Object.is(currentState, nextState)) {
      self._state![idx] = nextState;
      funcManager.recall(self, undefined); // Trigger re-render
    }
  };

  return [self._state[idx] as S, setState];
}

/**
 * Cradova
 * ---
 * Allows side effects with optional cleanup. Runs after component mount/update.
 * @param effect - Function to run. Can optionally return a cleanup function.
 * @param deps - Dependencies array. Effect runs if deps change. Runs on every render if omitted. Runs only on mount/unmount if empty array [].
 */
function useEffect(
  this: Comp,
  effect: () => (() => void) | void,
  deps?: unknown[]
): void {
  const self = this;
  if (typeof self !== "function" || !self._effect_tracker) {
    throw new Error(
      "Cradova Hook Error: useEffect called outside of a Cradova component context."
    );
  }

  const idx = ++self._effect_index!;
  const tracker = self._effect_tracker;

  // Get previous dependencies for comparison
  const prevDeps = tracker[idx]?.deps;
  let needsRun = false;

  // Determine if effect needs to run
  if (deps === undefined) {
    // No dependency array: run always
    needsRun = true;
  } else if (!tracker[idx] || !depsAreEqual(prevDeps, deps)) {
    // First run or dependencies changed
    needsRun = true;
  }

  if (!tracker[idx]) {
    tracker[idx] = { deps };
  } else {
    tracker[idx].deps = deps;
  }

  if (needsRun) {
    funcManager.scheduleEffect(self, idx, effect);
  }
}

/**
 * Cradova
 * ---
 * Memoizes a calculation based on dependencies.
 * @param factory - Function that returns the value to memoize.
 * @param deps - Dependencies array. Re-runs factory if deps change.
 * @returns Memoized value.
 */
function useMemo<T>(this: Comp, factory: () => T, deps?: unknown[]): T {
  const self = this;
  if (typeof self !== "function" || !self._memo_tracker) {
    throw new Error(
      "Cradova Hook Error: useMemo called outside of a Cradova component context."
    );
  }

  const idx = ++self._memo_index!;
  const tracker = self._memo_tracker;

  const prevTracker = tracker[idx];
  const prevDeps = prevTracker?.deps;

  let needsRecalculate = false;
  if (deps === undefined || !prevTracker || !depsAreEqual(prevDeps, deps)) {
    needsRecalculate = true;
  }

  if (needsRecalculate) {
    const newValue = factory();
    tracker[idx] = { deps, value: newValue };
    return newValue;
  } else {
    return prevTracker.value as T;
  }
}

/**
 * Cradova
 * ---
 * Memoizes a callback function based on dependencies.
 * Useful for passing stable callbacks to child components.
 * @param callback - The callback function to memoize.
 * @param deps - Dependencies array. Returns the same callback instance if deps are unchanged.
 * @returns Memoized callback function.
 */
function useCallback<T extends (...args: any[]) => any>(
  this: Comp,
  callback: T,
  deps?: unknown[]
): T {
  return useMemo.call(this, () => callback, deps) as T;
}

/**
 * Cradova
 * ---
 * Returns a mutable ref object whose .current property is initialized to the passed argument (initialValue).
 * The returned object will persist for the full lifetime of the component.
 * Does NOT cause re-renders when the .current property changes.
 * @param initialValue - Optional initial value for the ref's current property.
 * @returns A ref object like { current: T | null }.
 */
function useRef<T = unknown>(
  this: Comp
): {
  current: Record<string, T>;
  bind: (name: string) => any;
} {
  // useRef is essentially a memoized object that never changes its dependencies.
  // We use useMemo with an empty dependency array to achieve this persistence.
  const self = this;
  if (typeof self !== "function") {
    throw new Error(
      "Cradova Hook Error: useRef called outside of a Cradova component context."
    );
  }
  return new __raw_ref();
}
// 3. Add useReducer Hook Implementation
/**
 * Cradova
 * ---
 * An alternative to useState for more complex state logic.
 * @param reducer - Function that determines state changes: (state, action) => newState
 * @param initialArg - Initial state value or argument for initializer.
 * @param initializer - Optional function to compute initial state lazily.
 * @returns [state, dispatch]
 */
function useReducer<S, A>(
  this: Comp,
  reducer: (state: S, action: A) => S,
  initialArg: S,
  initializer?: (arg: S) => S
): [S, (action: A) => void] {
  const self = this;
  if (typeof self !== "function" || !self._reducer_tracker) {
    throw new Error(
      "Cradova Hook Error: useReducer called outside of a Cradova component context."
    );
  }

  const idx = ++self._reducer_index!;
  const tracker = self._reducer_tracker;

  if (tracker.length <= idx) {
    const initialState =
      typeof initializer === "function" ? initializer(initialArg) : initialArg;
    tracker[idx] = { state: initialState };
  }

  const dispatch = (action: A): void => {
    const currentTracker = tracker[idx]; // Get tracker for current state
    const currentState = currentTracker.state as S;
    let nextState: S;
    try {
      nextState = reducer(currentState, action);
    } catch (error) {
      console.error("Cradova err: Error occurred in reducer:", error);
      throw error; // Re-throw error after logging
    }

    // Only trigger recall if state actually changed
    if (!Object.is(currentState, nextState)) {
      currentTracker.state = nextState; // Update the stored state
      funcManager.recall(self, undefined); // Schedule a re-render
    }
  };

  return [tracker[idx].state as S, dispatch];
}

export const isArrowFunc = (fn: Function) => !fn.hasOwnProperty("prototype");

// --- Default State and Initialization ---

const DEFAULT_COMPONENT_PROPS: Partial<Comp> = {
  rendered: false,
  published: false,
  reference: null,

  // State
  _state: [],
  _state_index: -1,

  // Effects
  _effect_tracker: [], // Use tracker array
  _effect_index: -1,

  // Memos
  _memo_tracker: [], // Use tracker array
  _memo_index: -1,
  // Reducers
  _reducer_tracker: [], // Added
  _reducer_index: -1, // Added

  // Bound hooks
  useState: useState,
  useEffect: useEffect,
  useMemo: useMemo,
  useCallback: useCallback,
  useRef: useRef,
  useReducer: useReducer,
};

function initializeComponent(comp: Comp): Comp {
  if (typeof comp._state_index === "number") {
    comp._state_index = -1;
    comp._effect_index = -1;
    comp._memo_index = -1;
    comp._reducer_index = -1; // Added Reset
    funcManager.cleanupEffects(comp);
    return comp as Comp;
  }

  const component = comp as Comp;
  Object.assign(component, {
    ...DEFAULT_COMPONENT_PROPS, // Apply defaults
  });

  return component;
}

export const toComp = (comp: Comp, args?: any[]): HTMLElement | undefined => {
  const component = initializeComponent(comp);
  return funcManager.render(component, args);
};

export const toCompNoRender = (comp: Comp): Comp => {
  return initializeComponent(comp);
};

// --- Function Manager ---

export const funcManager = {
  render(component: Comp, args: any[] | undefined): HTMLElement | undefined {
    const html = component.apply(component, args);

    if (html instanceof HTMLElement) {
      component.reference = html;
      component.rendered = true;
      component.published = true;
      // Trigger initial effects *after* rendering and mounting
      this.runScheduledEffects(component);
      return html;
    } else {
      console.error(
        " Cradova err : Component function must return an HTMLElement. Got:",
        html
      );
      component.rendered = false;
      return undefined;
    }
  },

  recall(component: Comp, args: any[] | undefined): void {
    if (component.rendered && component.published) {
      // Schedule the re-render asynchronously
      setTimeout(() => {
        this.activate(component, args);
      }, 0); // Use setTimeout 0 for async break
    }
    // @ts-expect-error
    window.CradovaEvent.dispatchEvent("after_page_is_killed");
    // @ts-expect-error
    window.CradovaEvent.dispatchEvent("after_comp_is_mounted");
  },

  activate(component: Comp, args: any[] | undefined): void {
    component.published = false; // Mark as updating
    if (!component.rendered || !component.reference) {
      return; // Cannot activate if not rendered or no reference
    }

    const node = component.reference;

    // Check if the component's element is still in the DOM
    if (document.body.contains(node)) {
      initializeComponent(component);
      const newHtml = component.apply(component, args);

      if (newHtml instanceof HTMLElement) {
        node.replaceWith(newHtml);
        // ? replace the Function element with the Function element
        node!.insertAdjacentElement("beforebegin", newHtml as Element);
        node!.remove();

        // Update component state
        component.reference = newHtml;
        component.published = true;

        this.runScheduledEffects(component);
      } else {
        console.error(
          " Cradova err : Component function must return an HTMLElement during update. Got:",
          newHtml
        );
        component.reference = node;
        component.published = false;
      }
    } else {
      this.unmount(component);
    }
  },
  /**
   * @internal
   */
  _effectsToRun: new Map<Comp, Map<number, () => (() => void) | void>>(),
  scheduleEffect(
    component: Comp,
    index: number,
    effect: () => (() => void) | void
  ): void {
    if (!this._effectsToRun.has(component)) {
      this._effectsToRun.set(component, new Map());
    }
    this._effectsToRun.get(component)!.set(index, effect);
  },

  runScheduledEffects(component: Comp): void {
    const effectsMap = this._effectsToRun.get(component);
    if (!effectsMap || effectsMap.size === 0) {
      return;
    }

    effectsMap.forEach((effectFn, index) => {
      const tracker = component._effect_tracker![index];
      if (tracker && typeof tracker.cleanup === "function") {
        try {
          tracker.cleanup();
        } catch (err) {
          console.error("Cradova err: Error during effect cleanup:", err);
        }
        tracker.cleanup = undefined;
      }

      try {
        const cleanup = effectFn();
        if (tracker) {
          tracker.cleanup = cleanup;
        }
      } catch (err) {
        console.error("Cradova err: Error during effect execution:", err);
      }
    });

    this._effectsToRun.delete(component);
  },

  cleanupEffects(component: Comp): void {
    if (component._effect_tracker) {
      component._effect_tracker.forEach((tracker) => {
        if (typeof tracker?.cleanup === "function") {
          try {
            tracker.cleanup();
          } catch (err) {
            console.error(
              "Cradova err: Error during component cleanup/unmount:",
              err
            );
          }
        }
      });
    }
  },

  unmount(component: Comp): void {
    this.cleanupEffects(component);
    component.reference = null;
    component.rendered = false;
    component.published = false;
    this._effectsToRun.delete(component);
  },
};

export const List = <T>(
  signal: Signal<T[]>,
  item: (item: T) => HTMLElement,
  options?: {
    className?: string;
    id?: string;
    style?: Partial<CSS.Properties>;
  }
) => {
  const list = div(
    {
      className: options?.className,
      id: options?.id,
      style: options?.style,
    },
    {
      onmount() {
        const vl = new VirtualList(this, signal, item);
        return () => {
          // console.log("Destroying virtual list");
          vl.destroy();
        };
      },
    }
  );
  return list;
};

/**
 * Invokes a function with the provided arguments.
 * @param fn - The function to invoke.
 * @param args - The arguments to pass to the function.
 * @returns The result of the function invocation, which is expected to be an HTMLElement.
 */
export function invoke(fn: (...args: any[]) => HTMLElement, args: any[]) {
  return toComp(fn as unknown as Comp, args);
}

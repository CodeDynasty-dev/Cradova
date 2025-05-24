import * as CSS from "csstype";
import { __raw_ref, Page, Signal } from "./classes.js";

type Attributes<E extends HTMLElement> = {
  ref?: [__raw_ref<any>, string]; // Updated to reflect tuple from bind()
  value?: any;
  style?: CSS.Properties;
  [key: `data-${string}`]: string | undefined;
  [key: `aria-${string}`]: string | undefined;
  [key: `on${string}`]: (this: E, event: Event) => void;
} & {
  /**
   * Cradova calls this function when this element is rendered on the DOM.
   */
  onmount?: (this: E) => void;
};

export type VJS_params_TYPE<E extends HTMLElement> = // children types
  (
    | undefined
    | undefined[]
    | string
    | string[]
    | HTMLElement
    | HTMLElement[]
    | DocumentFragment
    | DocumentFragment[]
    | (() => HTMLElement)
    | (() => HTMLElement)[]
    | [string, Signal<any>]
    // property types
    | Attributes<E>
    // css types
    | { style: CSS.Properties }
    | VJS_params_TYPE<E>
    | VJS_params_TYPE<E>[]
    | Partial<
      Omit<
        E,
        "style" | `data-${string}` | `aria-${string}` | `on${string}` | "ref"
      >
    >
  )[];
/**
 * @internal
 */
export interface RouterRouteObject {
  _html:
    | ((this: Page, data?: unknown) => HTMLElement | DocumentFragment)
    | HTMLElement
    | DocumentFragment;
  _delegatedRoutes: number | boolean;
  _Activate: (force: boolean) => Promise<void>;
  _deActivate: (params: object) => void;
  _package: (params: unknown) => void;
  _errorHandler: ((err: unknown) => void) | null;
  _derive(): {
    _name: string;
    _callBack:
      | ((cradovaPageSet: HTMLElement) => void | Promise<void>)
      | undefined;
    _deCallBack:
      | ((cradovaPageSet: HTMLElement) => void | Promise<void>)
      | undefined;
  };
  _apply_derivation(data: {
    _name: string;
    _callBack:
      | ((cradovaPageSet: HTMLElement) => void | Promise<void>)
      | undefined;
    _deCallBack:
      | ((cradovaPageSet: HTMLElement) => void | Promise<void>)
      | undefined;
  }): unknown;
}

export type CradovaPageType = {
  /**
   * Cradova page
   * ---
   * title of the page
   * .
   */
  name?: string;
  /**
   * Cradova page
   * ---
   * The component for the page
   * @param data
   * @returns void
   * .
   */
  template: (this: any) => HTMLElement;
  /**
   * Cradova page
   * ---
   * a snapshot is the initial render of a page.
   * snapshot isolation allows for good SEO guarantee with the flexibility of client based rendering
   * the origin server should accept post requesting to save a snapshot of this page for future use.
   * the origin server should respond with the snapshot for future request to the page url
   * the origin server should implement suitable mechanisms to invalidate it's caches
   */
  snapshotIsolation?: boolean;
};

export type browserPageType<importType = Page> =
  | importType
  | Promise<importType>
  | (() => Promise<importType>);

export interface Comp extends Function {
  /**
   * @internal
   */
  _state?: unknown[];
  /**
   * @internal
   */
  _state_index?: number;
  /**
   * @internal
   */
  _effect_tracker?: EffectTracker[];
  /**
   * @internal
   */
  _effect_index?: number;
  /**
   * @internal
   */
  _memo_tracker?: MemoTracker[];
  /**
   * @internal
   */
  _memo_index?: number;
  /**
   * @internal
   */
  reference?: HTMLElement | null;
  /**
   * @internal
   */
  rendered?: boolean;
  /**
   * @internal
   */
  published?: boolean;
  /**
   * @internal
   */
  _reducer_tracker?: ReducerTracker[];
  /**
   * @internal
   */
  _reducer_index?: number;

  // ? hooks
  useReducer: <S, A>(
    reducer: (state: S, action: A) => S,
    initialArg: S,
    initializer?: (arg: S) => S,
  ) => [S, (action: A) => void];
  useState: <S>(
    initialValue: S,
  ) => [S, (newState: S | ((prevState: S) => S)) => void];
  useEffect: (effect: () => (() => void) | void, deps?: unknown[]) => void;
  useMemo: <T>(factory: () => T, deps?: unknown[]) => T;
  useCallback: <T extends (...args: any[]) => any>(
    callback: T,
    deps?: unknown[],
  ) => T;
  useRef: <T = unknown>() => {
    current: Record<string, T>;
    bind: (name: string) => any;
  };
}

type EffectTracker = {
  deps?: unknown[];
  cleanup?: (() => void) | void;
};

type MemoTracker = {
  deps?: unknown[];
  value: unknown;
};

type ReducerTracker = {
  state: unknown;
};

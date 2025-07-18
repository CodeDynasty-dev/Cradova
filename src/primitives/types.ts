import * as CSS from "csstype";
import { Page, RefInstance, Signal } from "./classes.js";

interface Attributes<E extends HTMLElement> {
  ref?: [RefInstance<any>, string];
  style?: Partial<CSS.Properties>;
  [key: `data-${string}`]: string;
  [key: `aria-${string}`]: string;
  [key: `on${string}`]: (this: E, event: StandardEvents) => void;
}

type StandardEvents =
  | KeyboardEvent
  | MouseEvent
  | TouchEvent
  | WheelEvent
  | DragEvent
  | ClipboardEvent
  | CompositionEvent
  | FocusEvent
  | InputEvent
  | AnimationEvent
  | TransitionEvent
  | Event;

type OmitFunctions<E> = {
  [K in keyof E as E[K] extends Function ? never : K]: E[K];
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
    | ((ctx: Comp) => HTMLElement)
    | ((ctx: Comp) => HTMLElement)[]
    | [string, Signal<any>]
    | Attributes<E>
    | OmitFunctions<E>
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
    _title: string;
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
  title?: string;
  /**
   * Cradova page
   * ---
   * The component for the page
   * @param data
   * @returns void
   * .
   */
  template: ((ctx: Comp) => HTMLElement) | (() => HTMLElement);
  /**
   * Cradova page
   * ---
   * a snapshot is the initial render of a page.
   * snapshot isolation allows for good SEO guarantee with the flexibility of client based rendering
   * the origin server should accept post requesting to save a snapshot of this page for future use.
   * the origin server should respond with the snapshot for future request to the page url
   * the origin server should implement suitable mechanisms to invalidate it's caches
   */
  // snapshotIsolation?: boolean;
};

export type browserPageType<importType = Page> =
  | importType
  | Promise<importType>
  | (() => Promise<importType>);

export interface Comp extends Function {
  (ctx: Comp, ...args: any[]): HTMLElement;
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
  /**
   * @internal
   */
  _args?: any[];

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
  useRef: <T extends HTMLElement | Node | DocumentFragment>() => RefInstance<T>;
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

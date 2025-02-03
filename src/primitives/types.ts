import * as CSS from "csstype";
import { __raw_ref, Page, Signal } from "./classes.js";

type Attributes<E extends HTMLElement> = {
  ref?: __raw_ref;
  style?: CSS.Properties;
  recall?: (P: any) => void;
  [key: `data-${string}`]: string | undefined;
  [key: `aria-${string}`]: string | undefined;
  [key: `on${string}`]: (this: E, event: Event) => void;
} & {
  /**
   * Cradova calls this function when this element is rendered on the DOM.
   */
  onmount?: (this: E) => void;
} & Partial<
    Omit<
      E,
      | "style"
      | `data-${string}`
      | `aria-${string}`
      | `on${string}`
      | "ref"
      | "recall"
    >
  >;

export type VJS_params_TYPE<E extends HTMLElement> = (
  | undefined
  // children types
  | string
  | HTMLElement
  | HTMLElement[]
  | DocumentFragment
  | DocumentFragment[]
  | (() => HTMLElement)
  // property types
  | Partial<Attributes<E>>
  // css types
  | { style: CSS.Properties }
)[];

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

export type Func = {
  (): HTMLElement;
  rendered?: boolean;
  published?: boolean;
  reference?: HTMLElement | null;
  signals?: Map<string, Signal<any>>;
  pipes?: Map<string, any>;
  effects?: (() => Promise<void> | void)[];
  effectuate?: ((this: any) => void) | null;
  _state?: unknown[];
  _state_index?: number;
};

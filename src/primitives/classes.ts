import { div } from "./dom-objects.js";
import { compManager, isArrowFunc, toComp } from "./functions.js";
import type { browserPageType, Comp, CradovaPageType } from "./types.js";

/**
 * Cradova event
 */
/**
 * @internal
 */
class cradovaEvent {
  /**
   * the events runs only once and removed to avoid duplication when added on the next rendering
   * these event are call and removed once when when a Function is rendered to the dom
   * @param callback
   */
  after_comp_is_mounted: Function[] = [];
  /**
   * the events runs once after comps unmounts.
   * these event are called before a Function is rendered to the dom
   * @param callback
   */
  after_page_is_killed: Function[] = [];

  /**
   * Dispatch any event
   * @param eventName
   */

  async dispatchEvent(
    eventName: "after_comp_is_mounted" | "after_page_is_killed"
  ) {
    const eventListeners = this[eventName];
    while (eventListeners.length !== 0) {
      const en_cb = await eventListeners.shift()!();
      if (typeof en_cb === "function") {
        this.after_page_is_killed.push(en_cb);
      }
    }
  }
}

//  @ts-ignore
window.CradovaEvent = new cradovaEvent();

/**
 *  Cradova Signal
 * ----
 *  Create a pub&sub store.
 *  Features:
 * - create a store for object and list for array
 * - subscribe components to events
 * - persist changes to localStorage
 * @constructor initial: Record<string, any>, props: {persist}
 */

export class Signal<Type extends Record<string, any> = any> {
  /**
   * @internal
   */
  private pn?: string;
  /**
   * @internal
   */
  subscribers: Record<
    keyof Type,
    ((() => void) | Comp | ((ctx: Comp) => HTMLElement))[]
  > = {} as any;
  data: Type = {} as any;
  /**
   * @internal
   */
  private picker: Type = {} as any;
  soft: Type = {} as any;
  passers?: Record<keyof Type, [string, Signal<Type>]>;
  private queue: Set<keyof Type> = new Set();
  constructor(initial: Type, props?: { persistName?: string | undefined }) {
    if (!initial || typeof initial !== "object" || Array.isArray(initial)) {
      throw new Error("Initial signal value must be an object");
    }

    this.picker = initial;

    if (props && props.persistName) {
      this.pn = props.persistName;
      const key = localStorage.getItem(props.persistName);
      //
      if (key && key !== "undefined") {
        const restored = JSON.parse(key);
        this.picker = Object.assign(initial, restored);
      }
    }

    for (const key in this.picker) {
      Object.defineProperty(this.data, key, {
        set: (value) => {
          this.picker[key] = value;
          this.queue.add(key);
          // ? publish only when queue is not empty
          queueMicrotask(() => this.queue.size && this.publish());
        },
        get: () => this.picker[key],
        enumerable: true,
        configurable: true,
      });
      // ? soft set on this.picker so no event is called
      Object.defineProperty(this.soft, key, {
        set: (value) => {
          this.picker[key] = value;
        },
        enumerable: true,
        configurable: true,
      });
    }
  }
  /**
   *  Cradova Signal
   * ----
   *  publish events to subscribers
   * @param events - string key of the action
   * @internal
   */
  private publish() {
    const s = new Set<Comp | (() => void) | ((ctx: Comp) => HTMLElement)>();
    this.queue.add("__ALL__");
    for (const k of this.queue) {
      if (this.picker.hasOwnProperty(k)) {
        const subs2 = this.subscribers![k];
        if (subs2) {
          for (const fn of subs2) {
            s.add(fn);
          }
        }
      } else {
        // remove event if not found
        if (k !== "__ALL__") {
          delete this.subscribers[k];
        }
      }
    }
    this.queue.clear();
    for (const c of s.values()) {
      if ((c as Comp).published) {
        compManager.recall(c as Comp);
      } else {
        (c as () => void)();
      }
    }
    if (this.pn) {
      localStorage.setItem(this.pn, JSON.stringify(this.picker));
    }
  }

  /**
   *  Cradova Signal
   * ----
   *  publish events to subscribers
   */
  set(data: Type) {
    Object.assign(this.picker, data);
    this.queue = new Set(Object.keys(this.subscribers));
    queueMicrotask(() => this.publish());
  }
  /**
   *  Cradova Signal
   * ----
   *  subscribe a function, component to an event
   *
   * @param eventName of event.
   * @param element to render.
   */
  computed<T extends keyof Type>(
    eventName:
      | T
      | "__ALL__"
      | (() => void)
      | Comp
      | ((ctx: Comp) => HTMLElement),
    listener?: (() => void) | Comp | ((ctx: Comp) => HTMLElement)
  ): HTMLElement | undefined {
    if (!eventName) {
      console.error(
        ` ✘  Cradova err:  eventName ${String(eventName)} or listener ${String(
          listener
        )} is not a valid event name or function`
      );
      return;
    }
    if (typeof eventName === "function") {
      listener = eventName as () => HTMLElement;
      eventName = "__ALL__" as any;
    }
    if (!this.subscribers[eventName as keyof Type]) {
      this.subscribers[eventName as keyof Type] = [];
    }
    const isComp = !isArrowFunc(listener as Comp);
    if (isComp) {
      const el = toComp(listener as Comp)!;
      if (el === undefined || !(el instanceof HTMLElement)) {
        console.error(
          ` ✘  Cradova err:  ${String(
            listener
          )} is not a valid element or function`
        );
        return;
      }
      this.subscribers[eventName as keyof Type].push(listener!);
      return el;
    }
    this.subscribers[eventName as keyof Type].push(listener!);
    return undefined;
  }
  /**
   *  Cradova Signal
   * ----
   *  subscribe an element to an event
   */
  get pass(): Record<keyof Type, [string, Signal<any>]> {
    if (this.passers) {
      return this.passers;
    }
    //? only compute when needed.
    const keys = Object.keys(this.picker) as (keyof Type)[];
    this.passers = {} as any;
    for (const key of keys) {
      this.passers![key] = [key as string, this];
    }
    return this.passers!;
  }

  /**
   *  Cradova Signal
   * ----
   * clear the history on local storage
   */
  clearPersist() {
    if (this.pn) {
      localStorage.removeItem(this.pn);
    }
  }
}

/**
 * Cradova List
 * ---
 *  A virtual list store and component for efficient rendering of large lists.
 */

export class List<T> {
  /**
   * @internal
   */
  private state: T[];
  /**
   * @internal
   */
  private item: (item: T, i: number) => HTMLElement;

  public length: number;
  /**
   * @internal
   */
  private itemHeight = 35; // Adjustabl variable
  private windowCoverage = 500; // Adjustable  variable
  private overscan = 20; // Number of extra items to render before the visible range
  private scrollingDirection = "vertical"; // Adjustable  variable
  private opts?: {
    itemHeight?: number;
    className?: string;
    columns?: number;
    windowHeight?: number;
    windowWidth?: number;
    overscan?: number;
    scrollingDirection?: "vertical" | "horizontal";
    onScrollEnd?: () => void;
  };
  private columns = 1;
  /**
   * @internal
   */
  private container: HTMLElement;
  private rendered: boolean = false;
  subscribers: Function[] = [];
  scrollPos: number = 0;
  list: HTMLElement;
  startIndex: number = 0;
  listContainer: HTMLElement;
  constructor(
    state: T[],
    item?: (item: T, i: number) => HTMLElement,
    opts?: {
      itemHeight?: number;
      className?: string;
      columns?: number;
      windowHeight?: number;
      windowWidth?: number;
      overscan?: number;
      scrollingDirection?: "vertical" | "horizontal";
      onScrollEnd?: () => void;
    }
  ) {
    this.state = state;
    this.item = item || ((item: T, i: number) => div(String(item) + " " + i));
    this.length = state.length;
    this.opts = opts;
    this.itemHeight = opts?.itemHeight || 35;
    this.columns = opts?.columns || 1;
    this.windowCoverage = opts?.windowHeight || opts?.windowWidth || 500;
    this.overscan = opts?.overscan || 20;
    this.scrollingDirection = opts?.scrollingDirection || "vertical";

    this.container = div(
      {
        className: this.opts?.className,
        onscroll: (e: Event) => {
          this.scrollPos = Math.floor(
            this.scrollingDirection === "vertical"
              ? (e.target as HTMLElement).scrollTop
              : (e.target as HTMLElement).scrollLeft
          );
          requestAnimationFrame(() => this.render());
        },
        style: {
          overflowY:
            this.scrollingDirection === "vertical" ? "scroll" : "hidden",
          overflowX:
            this.scrollingDirection === "horizontal" ? "scroll" : "hidden",
          height: this.opts?.windowHeight
            ? `${this.opts?.windowHeight}px`
            : "500px",
          width: this.opts?.windowWidth
            ? `${this.opts?.windowWidth}px`
            : "100%",
        },
      },
      div(
        {
          id: "listContainer",
          style: {
            height: `${Math.round(
              (this.length * this.itemHeight) / this.columns
            )}px`,
          },
        },
        div({
          id: "list",
          className: this.opts?.className,
          style: {
            transform:
              this.scrollingDirection === "vertical"
                ? `translateY(${this.scrollPos}px)`
                : `translateX(${this.scrollPos}px)`,
          },
        })
      )
    );
    this.listContainer = this.container.querySelector("#listContainer")!;
    this.list = this.container.querySelector("#list")!;
  }

  get Element() {
    if (!this.rendered) {
      this.render();
      this.rendered = true;
      // ? TODO: make this WORK BY USING HOW MUCH THE DOCUMENT SCROLLED THEN WE USE THAT TO PROGRAMATICALLY SCROLL THE LIST
      const relativeScrolling = () => {
        // we need to check if all of this.container is in the viewport haha
        const rect = this.container.getBoundingClientRect();
        if (rect.top < 0 && rect.bottom > window.innerHeight) {
          this.scrollPos = Math.abs(rect.top);
          requestAnimationFrame(() => this.render());
        }
      };
      window.addEventListener("scroll", relativeScrolling);
      // @ts-ignore
      window.CradovaEvent.after_page_is_killed.push(() => {
        window.removeEventListener("scroll", relativeScrolling);
      });
    }
    return this.container;
  }

  private render() {
    const startIndex =
      Math.floor(this.scrollPos / this.itemHeight) * this.columns;

    this.list.style.transform =
      this.scrollingDirection === "vertical"
        ? `translateY(${
            Math.floor(this.scrollPos / this.itemHeight) * this.itemHeight
          }px)`
        : `translateX(${
            Math.floor(this.scrollPos / this.itemHeight) * this.itemHeight
          }px)`;

    let renderedNodesCount =
      (Math.ceil(this.windowCoverage / this.itemHeight) + this.overscan) *
      this.columns;
    renderedNodesCount = Math.min(this.length - startIndex, renderedNodesCount);

    for (; this.list.firstElementChild; ) this.list.firstElementChild.remove();
    let index = 0;
    for (let i = 0; i < renderedNodesCount; i++) {
      index = i + startIndex;
      if (this.state[index]) {
        this.list.appendChild(this.item(this.state[index], index));
      }
    }
    if (index + 1 === this.length) {
      this.opts?.onScrollEnd?.();
    }
    this.startIndex = startIndex;
  }
  public computed(
    listener?: (() => void) | Comp | ((ctx: Comp) => HTMLElement)
  ): HTMLElement | undefined {
    if (!listener) {
      console.error(
        ` ✘  Cradova err:  listener ${String(
          listener
        )} is not a valid event name or function`
      );
      return;
    }
    if (!this.subscribers) {
      this.subscribers = [];
    }
    const isComp = !isArrowFunc(listener as Comp);
    if (isComp) {
      const el = toComp(listener as Comp)!;
      if (el === undefined || !(el instanceof HTMLElement)) {
        console.error(
          ` ✘  Cradova err:  ${String(
            listener
          )} is not a valid element or function`
        );
        return;
      }
      this.subscribers.push(listener!);
      return el;
    }
    this.subscribers.push(listener!);
    return undefined;
  }

  private diffDOMBeforeUpdatingState(newState: T[]) {
    this.length = newState.length;
    let startIndex =
      Math.floor(this.scrollPos / this.itemHeight) * this.columns;
    startIndex = Math.floor(startIndex / this.columns) * this.columns;
    let renderedNodesCount = this.list.childElementCount;

    if (renderedNodesCount < this.overscan) {
      this.state = newState;
      this.render();
    } else {
      for (let i = 0; i < renderedNodesCount; i++) {
        const index = i + startIndex;
        //
        if (newState[index] === undefined) {
          this.list.children[index]?.remove();
          continue;
        }
        const item = this.item(newState[index], index);
        if (this.list.children[index]) {
          this.list.replaceChild(item, this.list.children[index]);
        } else {
          this.list.appendChild(item);
        }
      }
      this.list.style.transform =
        this.scrollingDirection === "vertical"
          ? `translateY(${
              Math.floor(this.scrollPos / this.itemHeight) * this.itemHeight
            }px)`
          : `translateX(${
              Math.floor(this.scrollPos / this.itemHeight) * this.itemHeight
            }px)`;
      this.state = newState;
    }
    if (this.length !== newState.length) {
      this.listContainer.style.height = `${Math.round(
        (this.length * this.itemHeight) / this.columns
      )}px`;
    }

    queueMicrotask(() => {
      this.subscribers.forEach((sub) => {
        const isComp = !isArrowFunc(sub as Comp);
        if (isComp) {
          compManager.recall(sub as Comp);
        } else {
          (sub as () => HTMLElement)?.();
        }
      });
    });
  }

  public get data(): IterableIterator<T> {
    //? the returned value should be an iterator
    return {
      [Symbol.iterator]: () => {
        return this.state[Symbol.iterator]();
      },
      next: () => {
        return this.state[Symbol.iterator]().next();
      },
    };
  }
  public get(index: number) {
    return this.state[index];
  }
  public indexOf(item: T) {
    return this.state.indexOf(item);
  }

  public update(index: number, newItemData: T) {
    // copy state
    const newState = [...this.state];
    if (
      index >= 0 &&
      index < this.state.length &&
      this.state[index] !== newItemData
    ) {
      newState[index] = newItemData;
    }
    this.diffDOMBeforeUpdatingState(newState);
  }

  public push(itemData: T) {
    // copy state
    const newState = [...this.state];
    newState.push(itemData);
    this.diffDOMBeforeUpdatingState(newState);
  }

  public map<K>(callback: (item: T, index: number) => K) {
    // copy state
    const newState = [...this.state];
    return newState.map(callback);
  }

  public splice(index: number, count: number = 1, ...items: T[]) {
    // copy state
    const newState = [...this.state];
    if (index >= 0 && index < this.state.length && count > 0) {
      newState.splice(index, count, ...items);
    }
    this.diffDOMBeforeUpdatingState(newState);
  }
  public set(newData: T[] | ((prevItem: T[]) => T[])) {
    // copy state
    const newState = [...this.state];
    this.state =
      newData instanceof Function ? newData(this.state) : newData || [];
    this.diffDOMBeforeUpdatingState(newState);
  }

  // public destroy() {
  //   this.container.remove();
  //   this.container = null as any;
  //   this.state.length = 0;
  //   this.state = null as any;
  //   this.item = null as any;
  //   this.length = 0;
  //   this.opts = null as any;
  //   this.renderingRange = 0;
  //   this.firstItemIndex = 0;
  //   this.lastItemIndex = 0;
  // }
}

/**
 *  Cradova Page
 * ---
 * create instances of manageable pages
 * @param name
 * @param template
 */
export class Page {
  /**
   * @internal
   */
  private _name: string;
  /**
   * @internal
   */
  public _html: (this: Page) => HTMLElement;
  /**
   * @internal
   */
  public _template?: HTMLElement;
  _unload_CB?: (this: Page) => Promise<void> | void;
  _activate_CB?: (this: Page) => Promise<void> | void;
  constructor(pageParams: CradovaPageType) {
    const { template, title } = pageParams;
    if (typeof template !== "function") {
      throw new Error(
        ` ✘  Cradova err:  template function for the page is not a function`
      );
    }
    this._html = template as () => HTMLElement;
    this._name = title || document.title;
  }

  set onDeactivate(cb: (this: Page) => Promise<void> | void) {
    this._unload_CB = cb;
  }
  set onActivate(cb: (this: Page) => Promise<void> | void) {
    this._activate_CB = cb;
  }
  /**
   * @internal
   */
  async _load() {
    // ? setting title
    if (this._name) document.title = this._name;
    //? packaging the page dom
    // ? call all return functions of useEffects
    // @ts-ignore
    window.CradovaEvent.dispatchEvent("after_page_is_killed");
    this._template = div({ id: "page" }, this._html);
    RouterBox.doc!.innerHTML = "";
    // ? create save the snapshot html
    // if (this._snapshot) this._snapshot_html = this._template.outerHTML;
    RouterBox.doc!.appendChild(this._template);
    if (this._activate_CB) await this._activate_CB.apply(this);
    // ? call any onmount event added in the cradova event loop
    // @ts-ignore
    window.CradovaEvent.dispatchEvent("after_comp_is_mounted");
    // if (this._snapshot) this._takeSnapShot();
  }
}

/**
 * Cradova Router
 * ---
 * Facilitates navigation within the application and initializes
 * page views based on the matched routes.
 */
/**
 * @internal
 */
class RouterBoxClass {
  doc: null | HTMLElement = null;
  lastNavigatedRouteController?: Page;
  nextRouteController?: Page;
  lastNavigatedRoute?: string;
  pageShow = null;
  pageHide = null;
  errorHandler?: Function;
  loadingPage: any = null;
  pageData: {
    params: Record<string, string>;
    data?: Record<string, any>;
  } = { params: {} };
  routes: Record<string, Page | (() => Promise<Page | undefined>)> = {};
  // tracking paused state of navigation
  paused = false;

  route(path: string, page: Page) {
    // undefined is an option  here for auth routes
    if (!page) {
      console.error(" ✘  Cradova err:  not a valid page  ", page);
    }
    return (this.routes[path] = page);
  }

  /**
   * Cradova Router
   * ----
   * * The whole magic happens here
   * -
   * Responds to click events an y where in the document and when
   * the click happens on a link that is supposed to be handled
   * by the router, it loads and displays the target page.
   * * Responds to popstate and load events and does it's job
   */

  async router() {
    const url = window.location.href;
    let route: Page, params;
    // ? abort navigation when router is paused
    if (this.paused) {
      window.location.hash = "paused";
      return;
    }
    //? abort unneeded navigation
    if (url === this.lastNavigatedRoute) {
      return;
    }
    if (this.nextRouteController) {
      route = this.nextRouteController;
      this.nextRouteController = undefined;
    } else {
      [route, params] = this.checker(url) as [Page, any];
    }
    if (typeof route !== "undefined") {
      // we need to caught any error and propagate to the app
      try {
        // lazy loaded pages
        if (typeof route === "function") {
          if (this.loadingPage instanceof Page) {
            await this.loadingPage._load();
          }
          route = await (route as () => Promise<any>)();
        }
        //  @ts-ignore
        if (route?.default) route = route.default;
        if (!route) {
          // ! bad operation let's drop it| ok, but and revert?????
          // if (this.lastNavigatedRoute) {
          //   history.pushState({}, url, this.lastNavigatedRoute);
          // }
          return;
        }
        if (params) {
          this.pageData.params = params;
        }
        await route!._load();
        this.lastNavigatedRouteController &&
          (this.lastNavigatedRouteController._template = undefined) &&
          this.lastNavigatedRouteController._unload_CB?.apply(
            this.lastNavigatedRouteController
          );

        this.lastNavigatedRoute = url;
        this.lastNavigatedRouteController = route;
      } catch (error) {
        if (typeof this.errorHandler === "function") {
          this.errorHandler(error, url);
        } else {
          console.error(error);
        }
      }
    } else {
      // or 404
      if (this.routes["*"]) {
        await (this.routes["*"] as Page)._load();
      }
    }
  }

  checker(
    url: string
  ): [Page | (() => Promise<Page | undefined>), Record<string, any>] {
    if (url[0] !== "/") {
      url = url.slice(url.indexOf("/", 8));
    }

    if (this.routes[url]) {
      return [this.routes[url], { path: url }];
    }
    //  ? {2} that's why we handle it differently.
    if (url.includes("?")) {
      let search;
      const params: Record<string, string> = {};
      [url, search] = url.split("?");
      new URLSearchParams(search).forEach((val, key) => {
        params[key] = val;
      });
      if (this.routes[url]) {
        return [this.routes[url], params];
      }
    }
    //? place holder & * route checks
    for (const path in this.routes) {
      // ? placeholder check
      if (path.includes(":")) {
        const urlFixtures = url.split("/");
        const pathFixtures = path.split("/");
        //? check for extra / in the route by normalize before checking
        if (url.endsWith("/")) {
          urlFixtures.pop();
        }
        let fixturesX = 0;
        let fixturesY = 0;
        //? length check of / (backslash)
        if (pathFixtures.length === urlFixtures.length) {
          for (let i = 0; i < pathFixtures.length; i++) {
            //? let's jump place holders in the path since we can't determine from them
            //? we increment that we skipped a position because we need the count later
            if (pathFixtures[i].includes(":")) {
              fixturesY++;
              continue;
            }
            //? if it is part of the path then let increment a value for it
            //? we will need it later
            if (urlFixtures[i] === pathFixtures[i]) {
              fixturesX++;
            }
          }
          //? if after the checks it all our count are equal then we got it correctly
          if (fixturesX + fixturesY === pathFixtures.length) {
            const routesParams: Record<string, string> = {};
            for (let i = 0; i < pathFixtures.length; i++) {
              if (pathFixtures[i].includes(":")) {
                routesParams[pathFixtures[i].split(":")[1]] = urlFixtures[i];
              }
            }
            return [this.routes[path], routesParams];
          }
        }
      }
      // ? * check
      if (path.includes("*")) {
        const p = path.slice(0, -1);
        if (url.startsWith(p)) {
          return [this.routes[path], { extraPath: url.slice(p.length) }];
        }
      }
    }
    return [] as unknown as [Page, any];
  }
}

const RouterBox = new RouterBoxClass();

/** cradova router
 * ---
 * Registers a route.
 *
 * @param {string}   path     Route path.
 * @param  page the cradova document tree for the route.
 */

export class Router {
  /**
   * cradova router
   * ---
   * Registers a route.
   *
   * accepts an object containing pat and page
   */
  static BrowserRoutes(obj: Record<string, browserPageType<Page | unknown>>) {
    for (const path in obj) {
      const page = obj[path] as browserPageType;
      if (
        (typeof page === "object" &&
          typeof (page as any).then === "function") ||
        typeof page === "function"
      ) {
        // ? creating the lazy
        RouterBox.routes[path] = async () => {
          const paged: Page =
            typeof page === "function" ? await page() : await page;
          return RouterBox.route(path, paged);
        };
      } else {
        RouterBox.route(path, page as Page);
      }
    }
    Router._mount();
  }
  /**
    Pause navigation
    */
  static pauseNavigation() {
    RouterBox["paused"] = true;
    window.location.hash = "paused";
  }
  /**
   resume navigation
  */
  static resumeNavigation() {
    RouterBox["paused"] = false;
    window.location.replace(window.location.pathname + window.location.search);
    history.go(-1);
  }
  /**
   * Cradova Router
   * ------
   *
   * Navigates to a designated page in your app
   *
   * @param href string
   * @param data object
   * @param force boolean
   */
  static navigate(href: string, data?: Record<string, any>) {
    if (RouterBox["paused"]) {
      return;
    }
    if (typeof href !== "string") {
      console.error(
        " ✘  Cradova err:  href must be a defined path but got " +
          href +
          " instead"
      );
    }
    let route = null,
      params;
    if (href.includes(".")) {
      window.location.href = href;
    } else {
      // if (href === window.location.href) {
      //   return;
      // }
      [route, params] = RouterBox.checker(href);
      if (route) {
        RouterBox.nextRouteController = route as Page;
        window.history.pushState({}, "", href);
      }
      RouterBox.pageData.params = params;
      RouterBox.pageData.data = data;
      RouterBox.router();
    }
  }

  /**
   * Cradova
   * ---
   * Loading page for your app
   *
   * lazy loaded loading use
   *
   * @param page
   */
  static setLoadingPage(page: Page) {
    if (page instanceof Page) {
      RouterBox.loadingPage = page;
    } else {
      throw new Error(
        " ✘  Cradova err:  Loading Page should be a cradova page class"
      );
    }
  }

  /**
   * Cradova Router
   * ------
   * return last set router params
   */

  static get PageData() {
    return RouterBox.pageData;
  }

  /**
   * Cradova
   * ---
   * Error Handler for your app
   *
   * @param callback
   * @param path? page path
   */

  static addErrorHandler(callback: (err?: unknown, pagePath?: string) => void) {
    if (typeof callback === "function") {
      RouterBox["errorHandler"] = callback;
    } else {
      throw new Error(
        " ✘  Cradova err:  callback for error event is not a function"
      );
    }
  }
  /**
   * @internal
   */
  static _mount() {
    // creating mount point
    let doc = document.querySelector("[data-wrapper=app]") as HTMLElement;
    if (doc) {
      RouterBox.doc = doc;
    } else {
      throw new Error(
        `✘  Cradova err: please add '<div data-wrapper="app"></div>' to the body of your index.html file `
      );
    }
    window.addEventListener("pageshow", () => RouterBox.router());
    window.addEventListener("hashchange", () => {
      if (RouterBox["paused"]) {
        history.forward();
        return;
      }
      RouterBox.router();
    });

    window.addEventListener("popstate", (_e) => {
      _e.preventDefault();
      if (RouterBox["paused"]) {
        history.forward();
        return;
      }
      RouterBox.router();
    });
  }
}

/**
 * Cradova
 * ---
 * make reference to dom elements
 */
export class RefInstance<T = unknown> {
  private $refs: Record<string, T | undefined> = {};
  current(key: string): T | undefined {
    if (!document.contains(this.$refs[key] as Node)) {
      this.$refs[key] = undefined;
    }
    return this.$refs[key];
  }

  get refs() {
    return this.$refs;
  }
  /**
   * Bind a DOM element to a reference name.
   * @param name - The name to reference the DOM element by.
   */
  bind(name: string) {
    return [this, name] as [RefInstance<T>, string];
  }
}

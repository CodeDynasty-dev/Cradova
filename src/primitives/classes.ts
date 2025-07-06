import { div } from "./dom-objects.js";
import {
  compManager,
  isArrowFunc,
  toComp,
  toCompNoRender,
} from "./functions.js";
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
    eventName: "after_comp_is_mounted" | "after_page_is_killed",
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
 * A store for data binding
 */
class Store<Type extends Record<string, any>> {
  /**
   * @internal
   */
  $_internal_data: Type;
  constructor(
    data: Type,
    notifier: (key: keyof Type, value: Type[keyof Type]) => void,
  ) {
    this.$_internal_data = data;
    for (const key in this.$_internal_data) {
      if (this.$_internal_data.hasOwnProperty(key)) {
        Object.defineProperty(this, key, {
          get() {
            return this.$_internal_data[key];
          },
          set(value) {
            this.$_internal_data[key] = value;
            notifier(key, value);
          },
          enumerable: true,
          configurable: true,
        });
      }
    }
  }
  /**
   * @internal
   */
  _set(data: Type) {
    this.$_internal_data = data;
    return Object.keys(this.$_internal_data);
  }
}
/**
 * A store for data binding
 */
class SilentStore<Type extends Record<string, any>> {
  /**
   * @internal
   */
  $store: Store<Type>;
  constructor(store: Store<Type>) {
    this.$store = store;
    for (const key in this.$store.$_internal_data) {
      if (this.$store.$_internal_data.hasOwnProperty(key)) {
        Object.defineProperty(this, key, {
          set(value) {
            this.$store.$_internal_data[key] = value;
          },
          enumerable: true,
          configurable: true,
        });
      }
    }
  }
}

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
    keyof Type | "dataChanged" | "itemUpdated" | "__ALL__",
    ((() => void) | Comp | ((ctx: Comp) => HTMLElement))[]
  > = {} as any;
  store: Type;
  silentStore: Type extends Array<any> ? never : Type = undefined!;
  passers?: Record<keyof Type, [string, Signal<Type>]>;
  constructor(initial: Type, props?: { persistName?: string | undefined }) {
    if (!initial || typeof initial !== "object" || Array.isArray(initial)) {
      throw new Error("Initial signal value must be an object");
    }

    this.store = new Store(initial, (key) => {
      this.publish(key as keyof Type);
    }) as any;
    this.silentStore = new SilentStore<any>(this.store as any) as any;

    if (props && props.persistName) {
      this.pn = props.persistName;
      const key = localStorage.getItem(props.persistName);
      //
      if (key && key !== "undefined") {
        const restored = JSON.parse(key);
        this.store = new Store(Object.assign(initial, restored), (key) => {
          this.publish(key as keyof Type);
        }) as any;
        this.silentStore = new SilentStore<any>(this.store as any) as any;
      }
    }
  }
  /**
   *  Cradova Signal
   * ----
   *  fires an action if available
   * @param key - string key of the action
   * @internal
   */
  private publish<T extends keyof Type | "dataChanged" | "itemUpdated">(
    eventName: T,
  ) {
    this.subscribers![eventName]?.forEach((c) => {
      if ((c as Comp).published) {
        compManager.recall(c as Comp);
      } else {
        (c as () => void)();
      }
    });
    this.subscribers!["__ALL__"]?.forEach((c) => {
      if ((c as Comp).published) {
        compManager.recall(c as Comp);
      } else {
        (c as () => void)();
      }
    });
    if (this.pn) {
      localStorage.setItem(this.pn, JSON.stringify(this.store));
    }
  }

  /**
   *  Cradova Signal
   * ----
   *  fires actions if any available
   */
  set(NEW: Type) {
    const s = new Set<Comp | (() => void) | ((ctx: Comp) => HTMLElement)>();
    // @ts-ignore
    const events = this.store._set(NEW);
    for (const event of events) {
      const subs2 = this.subscribers![event as keyof Type];
      if (subs2) {
        for (const fn of subs2) {
          s.add(fn);
        }
      }
    }
    if (this.subscribers["__ALL__"]) {
      for (const fn of this.subscribers["__ALL__"]) {
        s.add(fn);
      }
    }
    for (const c of s.values()) {
      if ((c as Comp).published) {
        compManager.recall(c as Comp);
      } else {
        (c as () => void)();
      }
    }

    if (this.pn) {
      localStorage.setItem(this.pn, JSON.stringify(this.store));
    }
  }
  /**
   *  Cradova Signal
   * ----
   *  subscribe to an event
   *
   * @param name of event.
   * @param callback function to call.
   */
  notify<T extends keyof Type>(
    eventName:
      | (T | "dataChanged" | "itemUpdated" | T[])
      | (() => HTMLElement | void)
      | Comp
      | ((ctx: Comp) => HTMLElement),
    listener?: (() => void) | Comp | ((ctx: Comp) => HTMLElement),
  ) {
    if (!eventName) {
      console.error(
        ` ✘  Cradova err:  eventName ${String(eventName)} or listener ${
          String(
            listener,
          )
        } is not a valid event name or function`,
      );
      return;
    }
    if (typeof eventName === "function") {
      listener = eventName as () => HTMLElement;
      eventName = Object.keys(this.store) as any[];
    }
    if (typeof listener !== "function" || !eventName) {
      console.error(
        ` ✘  Cradova err: listener or eventName ${
          String(
            listener,
          )
        } is not a valid listener function or string`,
      );
      return;
    }

    if (Array.isArray(eventName)) {
      eventName.forEach((en) => {
        this.notify(en, listener);
      });
      return;
    }
    if (!this.subscribers[eventName]) {
      this.subscribers[eventName] = [];
    }

    if (!isArrowFunc(listener)) {
      listener = toCompNoRender(listener as Comp);
    }
    this.subscribers[eventName].push(listener);
  }

  computed<T extends keyof Type>(
    eventName:
      | (T | "dataChanged" | "itemUpdated")
      | (() => HTMLElement)
      | Comp
      | ((ctx: Comp) => HTMLElement),
    element?: (() => HTMLElement) | Comp | ((ctx: Comp) => HTMLElement),
  ): HTMLElement | undefined {
    if (!eventName) {
      console.error(
        ` ✘  Cradova err:  eventName ${String(eventName)} or element ${
          String(
            element,
          )
        } is not a valid event name or function`,
      );
      return;
    }
    if (typeof eventName === "function") {
      element = eventName as () => HTMLElement;
      eventName = "__ALL__" as any;
    }
    const isComp = !isArrowFunc(element as Comp);
    let el;
    if (isComp) {
      el = toComp(element as Comp);
    } else {
      el = (element as () => HTMLElement)?.();
    }
    if (el === undefined || !(el instanceof HTMLElement)) {
      console.error(
        ` ✘  Cradova err:  ${
          String(
            element,
          )
        } is not a valid element or function`,
      );
      return;
    }
    const listener = () => {
      if (!document.body.contains(listener.element)) {
        listener.element?.remove();
        this.subscribers[eventName as keyof Type] = this.subscribers[
          eventName as keyof Type
        ].filter((f: any) => listener.idx !== f.idx);
        return;
      }
      let newEl;
      if (isComp) {
        newEl = toComp(element as unknown as Comp);
      } else {
        newEl = (element as () => HTMLElement)?.();
      }
      if (newEl === undefined || !(newEl instanceof HTMLElement)) {
        console.error(
          ` ✘  Cradova err:  ${
            String(
              element,
            )
          } is not a valid element or function`,
        );
        return;
      }
      listener.element.insertAdjacentElement("beforebegin", newEl);
      listener.element.remove();
      listener.element = newEl;
    };
    listener.element = el;
    if (!this.subscribers[eventName as keyof Type]) {
      this.subscribers[eventName as keyof Type] = [];
    }
    listener.idx = this.subscribers[eventName as keyof Type].length;
    this.subscribers[eventName as keyof Type].push(listener);
    return el;
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
    const keys = Object.keys(
      (this.store as unknown as Store<Type>).$_internal_data,
    ) as (keyof Type)[];
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
        ` ✘  Cradova err:  template function for the page is not a function`,
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
    // if (url === this.lastNavigatedRoute) {
    //   return;
    // }
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
            this.lastNavigatedRouteController,
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
    url: string,
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
          const paged: Page = typeof page === "function"
            ? await page()
            : await page;
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
          " instead",
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
        " ✘  Cradova err:  Loading Page should be a cradova page class",
      );
    }
  }

  /**
   * Cradova Router
   * ------
   *
   * return last set router params
   *
   * .
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
        " ✘  Cradova err:  callback for error event is not a function",
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
        `✘  Cradova err: please add '<div data-wrapper="app"></div>' to the body of your index.html file `,
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
  private item: (item: T) => HTMLElement;

  public length: number;
  /**
   * @internal
   */
  private options?: {
    itemHeight: number;
    className?: string;
    id?: string;
  };
  /**
   * @internal
   */
  private renderingRange: number;
  /**
   * @internal
   */
  private container: HTMLElement;
  /**
   * @internal
   */
  private firstItemIndex: number = 0;
  /**
   * @internal
   */
  private lastItemIndex: number = 0;
  private rendered: boolean = false;
  subscribers: Function[] = [];
  constructor(
    state: T[],
    item?: (item: T) => HTMLElement,
    options?: {
      itemHeight: number;
      className?: string;
      id?: string;
    },
  ) {
    this.state = state;
    this.item = item || ((item: T) => div(String(item)));
    this.length = state.length;
    this.options = options;
    this.renderingRange = Math.round(
      Math.min(
        this.length > 50 ? this.length * 0.5 : this.length,
        window.innerHeight / (this.options?.itemHeight || 1),
      ),
    );
    this.lastItemIndex = this.renderingRange - 1;
    this.container = document.createElement("div");
    if (this.options?.className) {
      this.container.className = this.options?.className;
    }
    if (this.options?.id) {
      this.container.id = this.options?.id;
    }
  }
  get Element() {
    if (this.rendered) {
      return this.container;
    }
    for (let i = 0; i < this.renderingRange; i++) {
      const item = this.item(this.state[i]);
      item.setAttribute("data-index", i.toString());
      this.container.appendChild(item);
    }
    this.rendered = true;
    // ? adding observer
    const domObser = () => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const isBottom = entry.target === this.container.lastElementChild;
            const isTop = !isBottom;
            observer.unobserve(entry.target);
            //? efficient way to get index
            const index = Number(entry.target.getAttribute("data-index"));
            // ? bottom intersection
            if (isBottom) {
              // ? add to the bottom
              for (let i = index + 1; i < this.length; i++) {
                const item = this.item(this.state[i]);
                item.setAttribute("data-index", i.toString());
                this.container.appendChild(item);
              }
              // ?  remove from the top
              for (let i = index - this.renderingRange; i > 0; i--) {
                this.container.removeChild(this.container.children[i]);
              }
              this.firstItemIndex = Number(
                this.container.firstElementChild?.getAttribute("data-index") ||
                  0,
              );
              this.lastItemIndex = Number(
                this.container.lastElementChild?.getAttribute("data-index") ||
                  0,
              );
              console.log(
                this.firstItemIndex,
                this.lastItemIndex,
                index,
                "bottom",
              );
            }
            // ? top intersection
            if (isTop) {
              // ? add to the top
              for (let i = index - 1; i > 0; i--) {
                const item = this.item(this.state[i]);
                item.setAttribute("data-index", i.toString());
                this.container.appendChild(item);
              }
              // ? remove from the bottom
              for (let i = index + this.renderingRange; i < this.length; i++) {
                this.container.removeChild(this.container.children[i]);
              }
              this.lastItemIndex = Number(
                this.container.lastElementChild?.getAttribute("data-index") ||
                  0,
              );
              this.firstItemIndex = Number(
                this.container.firstElementChild?.getAttribute("data-index") ||
                  0,
              );
              // console.log(
              //   this.firstItemIndex,
              //   this.lastItemIndex,
              //   index,
              //   "top"
              // );
            }
          }
          //? observe new items

          // observer.observe(this.container.lastElementChild as HTMLElement);
          // observer.observe(this.container.firstElementChild as HTMLElement);
        });
      });
      //? observe initial items
      observer.observe(this.container.lastElementChild as HTMLElement);
      observer.observe(this.container.firstElementChild as HTMLElement);
    };
    window.addEventListener("scroll", domObser);
    // @ts-ignore
    window.CradovaEvent.after_page_is_killed.push(() => {
      window.removeEventListener("scroll", domObser);
    });
    return this.container;
  }

  public computed<T extends keyof List<T>>(
    element?: (() => HTMLElement) | Comp | ((ctx: Comp) => HTMLElement),
  ): HTMLElement | undefined {
    if (!element) {
      console.error(
        ` ✘  Cradova err:  element ${
          String(
            element,
          )
        } is not a valid element or function`,
      );
      return;
    }
    const isComp = !isArrowFunc(element as Comp);
    let el;
    if (isComp) {
      el = toComp(element as Comp);
    } else {
      el = (element as () => HTMLElement)?.();
    }
    if (el === undefined || !(el instanceof HTMLElement)) {
      console.error(
        ` ✘  Cradova err:  ${
          String(
            element,
          )
        } is not a valid element or function`,
      );
      return;
    }
    const listener = () => {
      if (!document.body.contains(listener.element)) {
        listener.element?.remove();
        this.subscribers.filter((f: any) => listener.idx !== f.idx);
        return;
      }
      let newEl;
      if (isComp) {
        newEl = toComp(element as unknown as Comp);
      } else {
        newEl = (element as () => HTMLElement)?.();
      }
      if (newEl === undefined || !(newEl instanceof HTMLElement)) {
        console.error(
          ` ✘  Cradova err:  ${
            String(
              element,
            )
          } is not a valid element or function`,
        );
        return;
      }
      listener.element.insertAdjacentElement("beforebegin", newEl);
      listener.element.remove();
      listener.element = newEl;
    };
    listener.element = el;
    listener.idx = this.subscribers.length;
    this.subscribers.push(listener);
    return el;
  }

  private diffDOMBeforeUpdatingState(newState: T[]) {
    this.length = newState.length;
    this.renderingRange = Math.round(
      Math.min(
        this.length > 100 ? this.length * 0.5 : this.length,
        window.innerHeight / (this.options?.itemHeight || 1),
      ),
    );
    this.lastItemIndex = this.firstItemIndex + this.renderingRange;
    for (let i = this.lastItemIndex; i >= this.firstItemIndex; i--) {
      // console.log(
      //   // this.container.children[i],
      //   i,
      //   this.firstItemIndex,
      //   this.lastItemIndex,
      //   this.state,
      //   newState,
      //   this.container.children[i].getAttribute("data-index")
      // );
      if (
        (this.state[i] === undefined || newState[i] === undefined) &&
        this.container.children[i] !== undefined
      ) {
        this.container.removeChild(this.container.children[i]);
        continue;
      }
      if (JSON.stringify(this.state[i]) === JSON.stringify(newState[i])) {
        continue;
      }
      const item = this.item(newState[i]);
      item.setAttribute("data-index", i.toString());
      if (this.container.children[i]) {
        this.container.replaceChild(item, this.container.children[i]);
      } else {
        this.container.appendChild(item);
      }
    }
    this.lastItemIndex = Number(
      this.container.lastElementChild?.getAttribute("data-index") || 0,
    );
    this.firstItemIndex = Number(
      this.container.firstElementChild?.getAttribute("data-index") || 0,
    );
    this.state = newState;
    this.subscribers.forEach((sub) => {
      const isComp = !isArrowFunc(sub as Comp);
      if (isComp) {
        compManager.recall(sub as Comp);
      } else {
        (sub as () => HTMLElement)?.();
      }
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
    this.state = newData instanceof Function
      ? newData(this.state)
      : newData || [];
    this.diffDOMBeforeUpdatingState(newState);
  }

  public destroy() {
    this.container.remove();
    this.container = null as any;
    this.state.length = 0;
    this.state = null as any;
    this.item = null as any;
    this.length = 0;
    this.options = null as any;
    this.renderingRange = 0;
    this.firstItemIndex = 0;
    this.lastItemIndex = 0;
  }
  /**
   *  Cradova Signal
   * ----
   *  subscribe to an event
   *
   * @param name of event.
   * @param callback function to call.
   */
  public notify<T extends keyof List<T>>(
    listener?: (() => void) | Comp | ((ctx: Comp) => HTMLElement),
  ) {
    if (!listener) {
      console.error(
        ` ✘  Cradova err:  listener ${
          String(
            listener,
          )
        } is not a valid listener function or string`,
      );
      return;
    }
    if (typeof listener !== "function") {
      console.error(
        ` ✘  Cradova err: listener or eventName ${
          String(
            listener,
          )
        } is not a valid listener function or string`,
      );
      return;
    }

    if (!isArrowFunc(listener)) {
      listener = toCompNoRender(listener as Comp);
    }
    this.subscribers.push(listener);
  }
}

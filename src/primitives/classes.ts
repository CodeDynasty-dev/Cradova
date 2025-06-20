import { div } from "./dom-objects.js";
import {
  funcManager,
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
export class cradovaEvent {
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
    // if (eventName.includes("Active")) {
    //   for (let i = 0; i < eventListeners.length; i++) {
    //     eventListeners[i]();
    //   }
    //   return;
    // }
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
    notifier: (key: keyof Type, value: Type[keyof Type]) => void
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

class List<Type extends any[]> {
  /**
   * @internal
   */
  private _data: Type;
  /**
   * @internal
   */
  private _dirtyIndices: Set<any>;
  notifier: (
    eventType: "dataChanged" | "itemUpdated",
    newItemData: Type[number]
  ) => void;
  constructor(
    initialData: Type,
    notifier: (
      eventType: "dataChanged" | "itemUpdated",
      newItemData: Type[number]
    ) => void
  ) {
    this._data = initialData || [];
    this._dirtyIndices = new Set();
    this.notifier = notifier;
    this._dirtyIndices.add("all");
  }

  get items(): IterableIterator<Type[number]> {
    //? the returned value should be an iterator
    return {
      [Symbol.iterator]: () => {
        return this._data[Symbol.iterator]();
      },
      next: () => {
        return this._data[Symbol.iterator]().next();
      },
    };
  }
  get length() {
    return this._data.length;
  }
  get(index: number) {
    return this._data[index];
  }
  indexOf(item: Type[number]) {
    return this._data.indexOf(item);
  }

  update(index: number, newItemData: Type[number]) {
    if (
      index >= 0 &&
      index < this._data.length &&
      this._data[index] !== newItemData
    ) {
      this._data[index] = newItemData;
      this._dirtyIndices.add(index);
      this.notifier("itemUpdated", { index: index, newItemData: newItemData });
    }
  }

  push(itemData: Type[number], index?: number) {
    if (index === undefined || index > this._data.length || index < 0) {
      index = this._data.length;
    }
    this._data.splice(index, 0, itemData);
    this._dirtyIndices.add("all");
    this.notifier("dataChanged", { type: "add", index: index });
  }

  map<T>(callback: (item: Type[number], index: number) => T) {
    return this._data.map(callback);
  }

  remove(index: number, count: number = 1) {
    if (index >= 0 && index < this._data.length && count > 0) {
      this._data.splice(index, count);
      this._dirtyIndices.add("all");
      this.notifier("dataChanged", { type: "remove", index: index });
    }
  }
  /**
   * @internal
   */
  _set(newData: Type) {
    this._data = newData || [];
    this._dirtyIndices.clear();
    this._dirtyIndices.add("all");
    return ["dataChanged"];
  }
  /**
   * @internal
   */
  _isDirty(index: number | "all" = "all") {
    if (this._dirtyIndices.has(index)) {
      this._dirtyIndices.delete(index);
      return true;
    }
    return false;
  }
  /**
   * @internal
   */
  _clearAllDirty() {
    this._dirtyIndices.clear();
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

export class Signal<Type = any> {
  /**
   * @internal
   */
  private pn?: string;
  /**
   * @internal
   */
  private isList: boolean = false;
  /**
   * @internal
   */
  subscribers: Record<
    keyof Type | "dataChanged" | "itemUpdated" | "__ALL__",
    ((() => void) | Comp)[]
  > = {} as any;
  store: Type extends Array<any>
    ? List<Type>
    : Type extends Record<string, any>
    ? Type
    : never;
  silentStore: Type extends Array<any> ? never : Type = undefined!;
  passers?: Record<keyof Type, [string, Signal<Type>]>;
  constructor(initial: Type, props?: { persistName?: string | undefined }) {
    if (!initial || typeof initial !== "object") {
      throw new Error("Initial signal value must be an array or object");
    }
    if (!Array.isArray(initial)) {
      this.store = new Store(initial, (key) => {
        this.publish(key as keyof Type);
      }) as any;
      this.silentStore = new SilentStore<any>(this.store as any) as any;
    } else {
      this.isList = true;
      this.store = new List(initial, (eventType) => {
        this.publish(eventType);
      }) as any;
    }

    if (props && props.persistName) {
      this.pn = props.persistName;
      const key = localStorage.getItem(props.persistName);
      //
      if (key && key !== "undefined") {
        const restored = JSON.parse(key);
        if (typeof restored === "object" && !Array.isArray(restored)) {
          this.store = new Store(Object.assign(initial, restored), (key) => {
            this.publish(key as keyof Type);
          }) as any;
          this.silentStore = new SilentStore<any>(this.store as any) as any;
        } else if (Array.isArray(restored)) {
          this.isList = true;
          this.store = new List(restored, (eventType) => {
            this.publish(eventType);
          }) as any;
        }
      }
      //
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
    eventName: T
  ) {
    this.subscribers![eventName]?.forEach((c) => {
      if ((c as Comp).published) {
        funcManager.recall(c as Comp);
      } else {
        (c as () => void)();
      }
    });
    this.subscribers!["__ALL__"]?.forEach((c) => {
      if ((c as Comp).published) {
        funcManager.recall(c as Comp);
      } else {
        (c as () => void)();
      }
    });
    if (this.pn) {
      localStorage.setItem(
        this.pn,
        JSON.stringify(
          this.isList ? this.store.items : (this.store as any).$_internal_data
        )
      );
    }
  }

  /**
   *  Cradova Signal
   * ----
   *  fires actions if any available
   */
  set(NEW: Type) {
    const s = new Set<Comp | (() => void)>();
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
        funcManager.recall(c as Comp);
      } else {
        (c as () => void)();
      }
    }

    if (this.pn) {
      localStorage.setItem(
        this.pn,
        JSON.stringify(
          this.isList ? this.store.items : (this.store as any).$_internal_data
        )
      );
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
    listener?: (() => HTMLElement | void) | Comp | ((this: Comp) => HTMLElement)
  ) {
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
      if (this.isList) {
        eventName = ["dataChanged", "itemUpdated"] as any[];
      } else {
        eventName = Object.keys(this.store) as any[];
      }
    }
    if (typeof listener !== "function" || !eventName) {
      console.error(
        ` ✘  Cradova err: listener or eventName ${String(
          listener
        )} is not a valid listener function or string`
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
    element?: (() => HTMLElement) | Comp | ((ctx: Comp) => HTMLElement)
  ): HTMLElement | undefined {
    if (!eventName) {
      console.error(
        ` ✘  Cradova err:  eventName ${String(eventName)} or element ${String(
          element
        )} is not a valid event name or function`
      );
      return;
    }
    if (typeof eventName === "function") {
      element = eventName as () => HTMLElement;
      if (this.isList) {
        eventName = "__ALL__" as any;
      } else {
        eventName = "__ALL__" as any;
      }
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
        ` ✘  Cradova err:  ${String(
          element
        )} is not a valid element or function`
      );
      return;
    }
    const listener = () => {
      if (!document.body.contains(listener.element)) {
        // console.log(
        //   "----------------->",
        //   this.subscribers[eventName as keyof Type],
        // );
        this.subscribers[eventName as keyof Type].splice(listener.idx, 1);
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
          ` ✘  Cradova err:  ${String(
            element
          )} is not a valid element or function`
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
    const keys = Object.keys(this.store) as (keyof Type)[];
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
// TODO: make this class internal using lower abstractions for pages, let users provide regular Funcs type instead.
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
  /**
   * @internal
   */
  private _snapshot: boolean;
  /**
   * @internal
   */
  private _snapshot_html?: string;
  /**
   * @internal
   */
  _unload_CB?: () => Promise<void> | void;
  constructor(pageParams: CradovaPageType) {
    const { template, name } = pageParams;
    if (typeof template !== "function") {
      throw new Error(
        ` ✘  Cradova err:  template function for the page is not a function`
      );
    }
    this._html = template;
    this._name = name || document.title;
    this._snapshot = pageParams.snapshotIsolation || false;
  }
  private async _takeSnapShot() {
    //? Prevent snapshot if already exists
    if (RouterBox.doc!.dataset["snapshot"] === "true") return;
    try {
      const response = await fetch(location.href);
      if (!response.ok) throw new Error("Failed to fetch the page");
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      doc.title = this._name;
      const wrapper = doc.querySelector('[data-wrapper="app"]');
      if (wrapper) {
        wrapper.setAttribute("data-snapshot", "true");
        wrapper.innerHTML = this._snapshot_html!;
      } else {
        console.error("Wrapper or template is not found");
        return;
      }
      const snapshot = doc.documentElement.outerHTML;
      await fetch(location.origin, {
        body: snapshot,
        method: "POST",
        headers: {
          "Content-Type": "text/html",
          "cradova-snapshot": location.href.slice(location.origin.length),
        },
      });
    } catch (error) {
      console.error("Snapshot error:", error);
    }
    this._snapshot_html = undefined;
  }

  set onDeactivate(cb: () => Promise<void> | void) {
    this._unload_CB = cb;
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
    if (this._snapshot) this._snapshot_html = this._template.outerHTML;
    RouterBox.doc!.appendChild(this._template);
    // ? call any onmount event added in the cradova event loop
    // @ts-ignore

    window.CradovaEvent.dispatchEvent("after_comp_is_mounted");
    // window.scrollTo({
    //   top: 0,
    //   left: 0,
    //   // @ts-ignore
    //   behavior: "instant",
    // });
    if (this._snapshot) this._takeSnapShot();
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
          this.lastNavigatedRouteController._unload_CB?.();
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

// VirtualList component
export class VirtualList {
  /**
   * @internal
   */
  dataStore: Signal<any[]>;
  /**
   * @internal
   */
  renderItem: (item: any, index: number) => HTMLElement;
  /**
   * @internal
   */
  renderScheduled: boolean;
  /**
   * @internal
   */
  container: HTMLElement;
  idxs: number[] = [];
  constructor(
    container: HTMLElement,
    dataStore: Signal<any[]>,
    renderItemFunction: (item: any, index: number) => HTMLElement
  ) {
    this.dataStore = dataStore;
    this.renderItem = renderItemFunction;
    this.renderScheduled = false;
    this.container = container;

    this.scheduleRender();
    this.idxs.push(dataStore.subscribers["dataChanged"]?.length || 0);
    this.dataStore.notify("dataChanged", () => {
      this.scheduleRender();
    });
    this.idxs.push(dataStore.subscribers["itemUpdated"]?.length || 0);
    this.dataStore.notify("itemUpdated", () => {
      this.scheduleRender();
    });
  }

  /**
   * @internal
   */
  scheduleRender() {
    if (this.renderScheduled) return;
    this.renderScheduled = true;
    requestAnimationFrame(this.render.bind(this));
  }
  /**
   * @internal
   */
  render() {
    const loop = Math.max(
      this.dataStore.store.length,
      this.container.children.length
    );
    const needsFullRender = this.dataStore.store._isDirty();
    for (let i = 0; i < loop; i++) {
      if (needsFullRender || this.dataStore.store._isDirty(i)) {
        const dataItem = this.dataStore.store.get(i);
        const newDOM = this.renderItem(dataItem, i);
        const oldDOM = this.container.children[i];
        if (newDOM instanceof HTMLElement) {
          if (oldDOM) {
            if (dataItem === undefined) {
              oldDOM.remove();
              continue;
            }
            this.container.replaceChild(newDOM, oldDOM);
          } else {
            this.container.appendChild(newDOM);
          }
        } else {
          if (oldDOM) {
            oldDOM.remove();
          }
        }
      }
    }

    if (needsFullRender) {
      this.dataStore.store._clearAllDirty();
    }
    this.renderScheduled = false;
  }
  /**
   * @internal
   */
  destroy() {
    this.renderItem = null as any;
    this.container.innerHTML = "";
    this.container = null as any;
    this.renderScheduled = false;
    this.dataStore.subscribers["dataChanged"].splice(this.idxs[0], 1);
    this.dataStore.subscribers["itemUpdated"].splice(this.idxs[1], 1);
    this.idxs.length = 0;
    this.dataStore = null as any;
  }
}

import { div } from "./dom-objects.js";
import { funcManager } from "./functions.js";
import type { browserPageType, CradovaPageType, Func } from "./types.js";

/**
 * Cradova event
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
      if (en_cb) {
        this.after_page_is_killed.push(en_cb);
      }
    }
  }
}

export const CradovaEvent = new cradovaEvent();

/**
 *  Cradova Signal
 * ----
 *  Create a pub&sub store.
 *  Features:
 * - create a store
 * - subscribe components to events
 * - persist changes to localStorage
 * @constructor initial: Record<string, any>, props: {persist}
 */

export class Signal<Type extends Record<string, any>> {
  private pn?: string;
  private subs: Record<keyof Type, Func[]> = {} as any;
  private listening_subs: Record<
    keyof Type,
    Map<HTMLElement, (data: Partial<Type>) => void>
  > = {} as any;
  pipe: Type;
  constructor(initial: Type, props?: { persistName?: string | undefined }) {
    this.pipe = initial;
    this.subs = {} as any;
    if (props && props.persistName) {
      this.pn = props.persistName;
      const key = localStorage.getItem(props.persistName);
      if (key && key !== "undefined") {
        this.pipe = JSON.parse(key);
      }
      if (typeof initial === "object") {
        for (const key in initial) {
          if (!Object.prototype.hasOwnProperty.call(this.pipe, key)) {
            this.pipe[key] = initial[key];
          }
        }
      }
    }
  }
  /**
   *  Cradova Signal
   * ----
   *  fires an action if available
   * @param key - string key of the action
   * @param data - data for the action
   */
  publish<T extends keyof Type>(eventName: T, data: Type[T]) {
    this.pipe[eventName] = data;
    const subs = this.subs![eventName as string] || [];
    for (let i = 0; i < subs.length; i++) {
      const c = subs[i];
      c.pipes!.set(eventName as string, this.pipe[eventName]);
      funcManager.recall(c);
    }
    const subs2 = this.listening_subs![eventName as string];
    if (subs2) {
      for (const [el, fn] of subs2.entries()) {
        fn.apply(el, [{ [eventName]: data } as any]);
      }
    }
    if (this.pn) {
      localStorage.setItem(this.pn, JSON.stringify(this.pipe));
    }
  }
  /**
   *  Cradova Signal
   * ----
   *  fires actions if any available
   */
  batchPublish(events: Partial<Type>) {
    const s = new Set<Func>();
    const s2 = new Map<HTMLElement, (data: Partial<Type>) => void>();
    for (const [eventName, data] of Object.entries(events)) {
      // @ts-ignore
      this.pipe[eventName] = data;
      const subs = this.subs![eventName as string] || [];
      for (let i = 0; i < subs.length; i++) {
        const c = subs[i];
        c.pipes!.set(eventName as string, this.pipe[eventName]);
        s.add(c);
      }
      const subs2 = this.listening_subs![eventName as string];
      if (subs2) {
        for (const [el, fn] of subs2.entries()) {
          s2.set(el, fn);
        }
      }
    }
    for (const c of s.values()) {
      funcManager.recall(c);
    }
    for (const [el, fn] of s2.entries()) fn.apply(el, [events]);
    if (this.pn) {
      localStorage.setItem(this.pn, JSON.stringify(this.pipe));
    }
  }
  /**
   *  Cradova Signal
   * ----
   *  subscribe to an event
   *
   * @param name of event.
   * @param Func component to bind to.
   */
  subscribe<T extends keyof Type>(eventName: T | T[], comp: any) {
    if (typeof comp === "function") {
      if (Array.isArray(eventName)) {
        eventName.forEach((en) => {
          this.subscribe(en, comp);
        });
        return;
      }
      if (comp.signals.get(eventName as string)) return;
      if (eventName in this.pipe) {
        comp.pipes.set(eventName as string, this.pipe[eventName]);
        comp.signals.set(eventName as string, this);
      } else {
        console.error(
          ` ✘  Cradova err:  ${String(
            eventName
          )} is not a valid event for this Signal`
        );
      }
      // ? avoid adding a specific Function repeatedly to a Signal
      if (!this.subs![eventName]) {
        this.subs![eventName] = [comp];
      } else {
        this.subs![eventName].push(comp);
      }
    } else {
      console.error(` ✘  Cradova err:  ${comp} is not a valid component`);
    }
  }
  /**
   *  Cradova Signal
   * ----
   *  subscribe to an event
   *
   * @param name of event.
   * @param Func component to bind to.
   * @internal
   */
  listen<T extends keyof Type>(
    eventName: T | T[],
    el: HTMLElement,
    fn: (data: Partial<Type>) => void
  ) {
    if (Array.isArray(eventName)) {
      eventName.forEach((en) => {
        this.listen(en, el, fn);
      });
      return;
    }
    if (!this.listening_subs[eventName]) {
      this.listening_subs[eventName] = new Map();
    }
    this.listening_subs[eventName].set(el, fn);
  }
  /**
   *  Cradova Signal
   * ----
   *  subscribe an element to an event
   *
   * @param name(s) of event.
   * @param Func to bind to.
   */
  subscriber<T extends keyof Type>(
    eventName: T | T[],
    fn: (this: HTMLElement, data: Partial<Type>) => void
  ) {
    // event = [signal, subscriptions , function]
    return [this, eventName, fn] as unknown as Signal<any>;
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
    CradovaEvent.dispatchEvent("after_page_is_killed");
    this._template = div({ id: "page" }, this._html);
    RouterBox.doc!.innerHTML = "";
    // ? create save the snapshot html
    if (this._snapshot) this._snapshot_html = this._template.outerHTML;
    RouterBox.doc!.appendChild(this._template);
    // ? call any onmount event added in the cradova event loop
    CradovaEvent.dispatchEvent("after_comp_is_mounted");
    window.scrollTo({
      top: 0,
      left: 0,
      // @ts-ignore
      behavior: "instant",
    });
    if (this._snapshot) this._takeSnapShot();
  }
}

/**
 * Cradova Router
 * ---
 * Facilitates navigation within the application and initializes
 * page views based on the matched routes.
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
          // ! bad operation let's drop it and revert
          if (this.lastNavigatedRoute) {
            history.pushState({}, url, this.lastNavigatedRoute);
          }
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
    // ! {2} this is commented out because it's has been handled by the navigating method
    //? check for search in the route
    // if (url.includes("/?")) {
    //   const sraw = [...new URLSearchParams(url).entries()];
    //   const search: Record<string, string> = {};
    //   for (const idx in sraw) {
    //     search[
    //       sraw[idx][0].includes("?") ? sraw[idx][0].split("?")[1] : sraw[idx][0]
    //     ] = sraw[idx][1];
    //   }
    //   const path = url.slice(0, url.indexOf("/?") + 2)
    //   return [this.routes[path], { path, search }];
    // }
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
    window.addEventListener("popstate", (_e) => {
      _e.preventDefault();
      RouterBox.router();
    });
  }
}



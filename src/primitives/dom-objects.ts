import { cra, makeElement } from "./functions.js";
import { type VJS_params_TYPE } from "./types.js";

export const a = cra<HTMLAnchorElement>("a");
export const audio = cra<HTMLAudioElement>("audio");
export const button = cra<HTMLButtonElement>("button");
export const canvas = cra<HTMLCanvasElement>("canvas");
export const div = cra<HTMLDivElement>("div");
export const footer = cra<HTMLElement>("footer");
export const form = cra<HTMLFormElement>("form");
export const h1 = cra<HTMLHeadingElement>("h1");
export const h2 = cra<HTMLHeadingElement>("h2");
export const h3 = cra<HTMLHeadingElement>("h3");
export const h4 = cra<HTMLHeadingElement>("h4");
export const h5 = cra<HTMLHeadingElement>("h5");
export const h6 = cra<HTMLHeadingElement>("h6");
export const header = cra<HTMLHeadElement>("header");
export const i = cra<HTMLLIElement>("i");
export const iframe = cra<HTMLIFrameElement>("iframe");
export const img = cra<HTMLImageElement>("img");
export const input = cra<HTMLInputElement>("input");
export const label = cra<HTMLLabelElement>("label");
export const li = cra<HTMLLIElement>("li");
export const main = cra<HTMLElement>("main");
export const nav = cra<HTMLElement>("nav");
export const ol = cra<HTMLOListElement>("ol");
export const option = cra<HTMLOptionElement>("option");
export const p = cra<HTMLParagraphElement>("p");
export const section = cra<HTMLElement>("section");
export const select = cra<HTMLSelectElement>("select");
export const span = cra<HTMLSpanElement>("span");
export const textarea = cra<HTMLTextAreaElement>("textarea");
export const ul = cra<HTMLUListElement>("ul");
export const video = cra<HTMLVideoElement>("video");
export const tbody = cra<HTMLTableElement>("table");
export const table = cra<HTMLTableSectionElement>("tbody");
export const td = cra<HTMLTableCellElement>("td");
export const tr = cra<HTMLTableColElement>("tr");

export const svg = (
  svg: string,
  properties?: VJS_params_TYPE<HTMLSpanElement>,
): HTMLSpanElement => {
  const span = document.createElement("span");
  span.innerHTML = svg;
  return makeElement<HTMLSpanElement>(span, properties || ([] as any));
};

export const raw = (html: string | TemplateStringsArray): DocumentFragment => {
  const div = document.createElement("div");
  if (Array.isArray(html)) {
    div.innerHTML = html[0];
  } else {
    if (typeof html === "string") {
      div.innerHTML = html;
    }
  }
  const df = new DocumentFragment();
  df.append(...Array.from(div.children));
  return df;
};

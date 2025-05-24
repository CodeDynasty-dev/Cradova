/*
*****************************************************************************
Copyright 2022 Friday Candour. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
*******************************************************************************
*/

export * from "./primitives/classes.js";
export * from "./primitives/functions.js";
export * from "./primitives/dom-objects.js";
import type { Comp } from "./primitives/types.js";
export type { Comp };

// Example utility functions (to be placed in an appropriate file)
export function clone<T extends (...args: any[]) => any>(fn: T): T {
  return function (this: any, ...args: any[]) {
    return fn.apply(this, args);
  } as T;
}

export function invoke<R>(fn: (...args: any[]) => R, args: any[]): R {
  return fn.apply(null, args);
}

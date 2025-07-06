# cradova changelog

## v1.0.0

- basic functionality no proper way to handle state

## v1.0.1

- improved performance

## v1.0.2

- improved api and dev experience

## v1.0.3

- an improved state management

## v1.0.4

this version never existed "npm version patch" was mistakenly entered twice and
we went along with it.

## v1.0.5

- more performance
- improved state management
- battle testing and production readiness

## v1.0.6

- introducing scaffold - a simple way to render page components without url
  manipulation. this brings app experience
- bug fixes
- more performance
- battle testing green

## v1.0.7

- bug fixes
- more performance
- battle testing green

## v1.0.8

- bug fixes
- more performance
- battle testing green

## v1.0.1

- bug fixes
- battle testing green

## v1.1.0

- all bugs fixes
- great performance gain
- battle testing green
- dripping build system
- stable type system

## v1.2.0

- bugs fixes
- new performance gain unlocked
- battle testing green
- new apis for element level
- fixed all know abnormal behaviors

## v1.3.0

- new very feature to unlock more speed
- battle testing green
- new apis at element level

## v1.4.0

- unlocked more speed by reducing work done by router
- battle testing green
- added error boundary
- Comp working as wanted

## v1.4.1

- fix effect on cradova pages

## v1.5.0

- made cradova Comp to have Stash hold component state change
- stable Comp effect and recall compliant to the spec

## v2.0.0

- export all html tags prebuilt and fully typed for more performance
- removed effect and recall from cradova page class
- remove unnecessary useHistory option from createSignal
- removed ability to add styles that appears as normal props
- removed event object from router params
- added pre-rendering capability to Comp components
- fixed effect bug on Comp
- added assert to cradova elements
- fixed error boundary bug
- setup hybrid server side rendering test using vite ssr

## v2.1.0

- added loop
- allow custom mount point
- fixed data-prop attributes
- fixed type for pages
- writing tests for more speed improvement index
- fixed createAction callback type

## v2.1.1

- increased child dept to ~

## v2.1.2

- fixed child array recursion of the Rhoda function
- fixed types
- fixed errors on child type not caught by typescript

## v2.2.0

- big performance boost using new methods of handling function calls so they get
  cached
- added lazy loading to cradova routes
- fixed Comp state flow with tests in ./manual_tests
- added the lazy class to load components when needed
- added parallel rendering to cradova pages
- redefining what global dispatcher can do.
- fix routing bug
- fix page not persisting bug
- proof tests
- battle testing used and tested in production

# v2.2.1

- fix some little bugs

# v2.2.2

- make tag parser faster and fixed a tiny bug
- completed various tests

# v2.2.3

- make tag parser faster and fixed a tiny bug
- completed various tests

# v2.3.0

- created CradovaEvent switched from the CustomEvent class (for more speed and
  node compatibility journey)
- created references as a way to point to dom elements
- used reference internally to remove cradova-ids that appeared on the dom
  before.
- completed tests
- cradova now helps you with Comp.render() calls
- Comp can be used as pages directly

# v2.3.1

- fixes and more stability

# v3.0.0

- Redefined types
- removed afterMount and beforeMount events from cradova elements
- added the onmount event that get's called when the page tree or comp get's
  updated
- disabled the global dispatcher because it's no longer a need for reactivity
- production tests
- the cradova \_ function now has types
- fixes and more speed gain for your apps when you update cradova.
- added a solution for setting a loading page
- production tests for parallel rendering completed

# v3.1.1

- Added useState, useEffect and useRef hooks
- did some more optimization
- other changes

# v3.1.4

- fixed bug parallel rendering in comp by managing page id events making them
  more powerful by also now reactivity to page changes
- other optimizations in pre-rendering

# v3.2.0

- introduced a more standardized reference class for managing dom references
  update the previous implementations.
- fixed more bug parallel rendering in comp by managing page id events making
  them more powerful by also now reactivity to page changes
- other optimizations in pre-rendering

# v3.3.0

- introduced Comp.define construct to add custom methods to Comps
- introduced more refined conditional rendering of $switch & $case, $if and
  $ifelse.
- introduced active option in Comps to fine tune multi-rendered Comps mostly in
  parallel rendered situations, hence further making parallel rendering more
  stable and rock solid with this new feature.
- tested in production across several personal projects and did some custom
  testing
- introduced the raw tag, just put in raw html strings if you need to for static
  contents/makeup, better for seo and faster render of none-dynamic contents.

# v3.3.1

- fixed speed, types, improvements and the define method

# v3.4.0

- fixed type system, removed templating more performance, fixed performance in
  routing system, pages, and comp
- more standard and speed.

# v3.5.8

- fixed type system, fixed performance in
  routing system, pages, and comp
- more standard and more speed.

# v3.6.0

- removed Comp or Ref classes
- Implemented a system to use function as functional components

# v3.7.0

- Implemented signal.pass for binding signal event to specific elements in th a function, a way to self handle reactivity and avoid complex diffing algorithms,

# v3.8.0

- Implemented more hooks and a syntax upgrades.

# 3.8.0-rc-1

- Implemented Store class for binding signal event to Immutable objects.
- Implemented signals.pass for binding signal event to specific elements in the a function.
- Implemented signals.listen for binding signal event to listeners.

# 3.8.0-rc-2 & 3.8.0-rc-3

- Removed Comp.signals and .pipes; to enforces Signal instances to be used only on global scope as a global state manager.

# v3.8.0-rc-4

- Implemented virtual list

# v3.11.0

- Improved Signals, API changes.

# v3.11.7

- Implemented useExternalEffect for external effects to a Comp instance

# v3.11.9

- Implemented args to Comp component.\_args

# v3.12.0

- Discharged this feature to allow more flexibility in the way you use args

# v3.12.1

- added and fixed silentStore property for cradova signals.

# v3.12.2

- Bug fixes in cradova pages
- snapshot isolation is removed due to security issues.

# v3.14.0

- Implemented List for managing lists of items and virtualizing them.

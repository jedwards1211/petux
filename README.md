# Petux 🐓

The missing piece of [Redux](https://github.com/reactjs/redux). Deals with side-effects.

> *Why the rooster?* The package name is derived from [петух](https://en.wiktionary.org/wiki/%D0%BF%D0%B5%D1%82%D1%83%D1%85) [pʲɪˈtux] — a rooster.

[![build status](https://img.shields.io/travis/tempname11/petux/master.svg?style=flat-square)](https://travis-ci.org/tempname11/petux)
[![npm version](https://img.shields.io/npm/v/petux.svg?style=flat-square)](https://www.npmjs.com/package/petux)

---

**Quick Links** | [API](#api) | [Examples](#examples) | [Full Documentation](https://petux-docs.surge.sh)

## Motivation

At the present moment, the Redux ecosystem still [lacks](https://github.com/reactjs/redux/issues/1528) a solution for side effects that (A) is easy to use, (B) is easy to reason about, (C) scales well. Petux is a humble attempt to [solve](http://xkcd.com/927/) this problem. It is meant to be used in real-world production applications of any complexity.

## Basic usage

```javascript
import { createStore } from 'redux'
import { initEffects } from 'petux'

const createReducer = (emit) => (state, action) => {
  switch (action.type) {
    case (...):
      emit(someEffect)
      emit(someOtherEffect)
      return someState
    default:
      return state
  }
}

const handler = (dispatch) => (effect) => {
  /* Actually perform any side-effects, and dispatch actions as necessary. */
}

const { emit, enhancer } = initEffects(handler);
const store = createStore(createReducer(emit), enhancer);
```

## Rationale

Redux reducers [are meant to be pure](http://redux.js.org/docs/introduction/ThreePrinciples.html#changes-are-made-with-pure-functions). Calling a potentially impure function seems like a direct violation of that principle. However, if we consider the `emit` calls with their arguments to be the *output* of the reducer, instead of an *effect*, then all is well — these calls become simply a secondary mode of output, a side-channel of sorts.

Do we have the right to call it *output*, instead of *side-effect*, though? Let's take a look at the [the Redux docs](http://redux.js.org/docs/Glossary.html#reducer) again:

> They must be pure functions—functions that return the exact same output for given inputs. They should also be free of side-effects. This is what enables exciting features like hot reloading and time travel.

Predictability, hot reloading, time travel. Petux was designed to ensure these important Redux features remain intact. This led to some constraints on the `emit` function:

- It must not return any values.
- It must be stateless.
- It must not have any side-effects...
- ...with the sole exception of passing data to a caller up the stack.

These rules ensure predictability of a reducer with calls to `emit` inside it. Given the same state and action, it will always have the same return value — and also the same order of `emit` calls with the same arguments. The call to the reducer itself will also not perform any side-effects.

There's just one more thing to discuss. If the reducer still doesn't actually perform any side-effects even when it calls `emit`, then who does?

## The Enhancer

Petux is a store enhancer. It enhances (replaces) the `store.dispatch` call. The core of what it does on `dispatch` is actually pretty simple:

- Create an empty array.
- Call the reducer (via the old `dispatch` call), collecting effect descriptions from `emit` calls during its execution.
- Perform all of the collected effects asyncronously.

[Read the source for more details](https://github.com/tempname11/petux/tree/master/src/index.js). There is one caveat when using it with other enhancers, though. The enhancer order matters a lot. Petux discards all effects collected when an enhancer "below" Petux dispatches an action. This does not apply to enhancers "above" it in the order.

In practice, you probably will want Petux to be the top-most enhancer.

## API

### `initEffects(handler)`

Given a handler, creates the store enhancer and `emit`. Returns them as an `{ emit, enhancer }` object.

[Read the source for details](https://github.com/tempname11/petux/tree/master/src/index.js). It's tiny.

## Examples

- Adapted [async](https://github.com/tempname11/petux/tree/master/examples/async) example from Redux.
 - Shows possible [migration paths](https://petux-docs.surge.sh/docs/async.html) from thunks and custom middleware.
- [A solution](https://github.com/tempname11/flux-challenge/submissions/tempname11) to @staltz's [Flux Challenge](https://github.com/staltz/flux-challenge).
 - Simple flat architecture.
 - Effects are described as plain data (like Actions)
 - *flowtype* annotations.
- [A solution](https://github.com/tempname11/scalable-frontend-with-elm-or-redux/tree/master/redux+petux-tempname11) to @slorber's [Scalable frontend Challenge](https://github.com/slorber/scalable-frontend-with-elm-or-redux).
 - Full-blown Elm-style fractal architecture.
 - Nested actions.
 - Hardcore *flowtype* annotations.

## Prior Art

- [Elm Architecture](https://guide.elm-lang.org/architecture/), including 
 - The original architecture which inspired Redux...
 - ...and also has [Effects](https://guide.elm-lang.org/architecture/effects/)
- [redux-loop](https://github.com/redux-loop/redux-loop)
 - The best-known attempt to port Elm's effect system to Redux.
- [redux-thunk](https://github.com/gaearon/redux-thunk)
 - The widely-used, pragmatic solution to side-effects.

## Status

The project is currently in public beta. Feedback is needed to iron out all the kinks before the first stable release, so if you've got some, both positive or negative, feel free to file an issue or open a Pull Request.

Documentation and examples still need a lot of work.

The actual library code has undergone major refinements since it was first written, and it's not likely to change much before the stable release. So don't let the `beta` status discourage you from using Petux.

One last word — if you like Petux, spread the word!

## License

MIT

# Petux 🐓

Helps performing side-effects in your [Redux](https://github.com/reactjs/redux) application.

> *Hey, why the rooster?* The package name is derived from [петух](https://en.wiktionary.org/wiki/%D0%BF%D0%B5%D1%82%D1%83%D1%85) [pʲɪˈtux] — a rooster.

[![build status](https://img.shields.io/travis/tempname11/petux/master.svg?style=flat-square)](https://travis-ci.org/tempname11/petux)
[![npm version](https://img.shields.io/npm/v/petux.svg?style=flat-square)](https://www.npmjs.com/package/petux)

--

### Motivation

At the present moment, the Redux ecosystem still [lacks](https://github.com/reactjs/redux/issues/1528) a solution for side effects that (A) is easy to use, (B) is easy to reason about, (C) scales well. Petux is a humble attempt to [solve](http://xkcd.com/927/) this problem.

### Basic usage

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

### Rationale

Redux reducers [are meant to be pure](http://redux.js.org/docs/introduction/ThreePrinciples.html#changes-are-made-with-pure-functions). Calling a potentially impure function seems like a direct violation of that principle. However, if we consider the `emit` calls with their arguments to be *output* of the reducer, instead of an *effect*, then all is well — these calls become simply a secondary mode of output, a side-channel of sorts.

Do we have the right to call it *output*, instead of *side-effect*, though? Let's take a look at the [the Redux docs](http://redux.js.org/docs/Glossary.html#reducer) again:

> They must be pure functions—functions that return the exact same output for given inputs. They should also be free of side-effects. This is what enables exciting features like hot reloading and time travel.

Predictability, hot reloading, time travel. Petux was designed to ensure these important Redux features remain intact. This led to some constraints on the `emit` function:

- It must not return any values.
- It must be stateless.
- It must not have any side-effects...
- ...with the sole exception of passing data to a caller up the stack.

These rules ensure predictability of a reducer with calls to `emit` inside it. Given the same state and action, it will always have the same return value — and also the same order of `emit` calls with the same arguments. The call to the reducer itself will also not perform any side-effects.

There's just one more thing to discuss. If the reducer still doesn't actually perform any side-effects even when it calls `emit`, then who does?

### The enhancer

Petux is a store enhancer. It enhances (replaces) the `store.dispatch` call. The core of what it does on `dispatch` is actually pretty simple:

- Create an empty array.
- Call the reducer (via the old `dispatch` call), collecting effect descriptions from `emit` calls during its execution.
- Perform all of the collected effects asyncronously.

[Read the source for more details](https://github.com/tempname11/petux/blob/master/src/index.js). There is one caveat when using it with other enhancers, though. The enhancer order matters a lot. Petux discards all effects collected when an enhancer "below" Petux dispatches an action. This does not apply to enhancers "above" it in the order.

In practice, you probably will want Petux to be the top-most enhancer.

### Examples

- Adapted [async](https://github.com/tempname11/petux/tree/master/examples/async) and [real-world](https://github.com/tempname11/petux/tree/master/examples/real-world) examples from Redux.
 - Show possible migration paths from thunks and custom middleware.
- A solution to @staltz's [Flux Challenge](https://github.com/tempname11/flux-challenge/submissions/tempname11).
 - Simple flat architecture.
- A solution to @slorber's [Scalable frontend Challenge](https://github.com/tempname11/scalable-frontend-with-elm-or-redux/tree/master/petux-tempname11).
 - Full-blown Elm-style fractal architecture.
 - Hardcore *flowtype* annotations.

### The Cookbook

In this section we'll discuss various practical topics with a lot of code examples.

#### Example: Interop with [Redux Dev Tools Extension](https://github.com/zalmoxisus/redux-devtools-extension)

This example shows the usage together with the Dev Tools Extension. We'd like the application not to perform any effects when using the extension UI — so we put its enhancer "below" Petux.

All the usual features should just work: Time Travel, cancelling actions, dispatching actions manually. There should be no side-effects performed when using those. This also applies to [the original Dev Tools](https://github.com/gaearon/redux-devtools) as well as other similar enhancers.

```javascript
import { createStore, compose } from 'redux';
import { initEffects } from 'petux';

const handler = ...;
const createReducer = ...;

const { emit, enhancer: effectEnhancer } = initEffects(handler);

const enhancers = [effectEnhancer];
if (window.__REDUX_DEVTOOLS_EXTENSION__) {
   // put it "below" in the order.
   enhancers.push(window.__REDUX_DEVTOOLS_EXTENSION__());
}

const store = createStore(createReducer(emit), compose(enhancers));
```

#### Basic Composability

If you have several subreducers and they all emit the same type of effects, you can simply pass `emit` when creating these subreducers:

```javascript
const createReducer = (emit) => {
  const left = createLeftReducer(emit);
  const right = createRightReducer(emit);
  
  return (state, action) => ({
    left: left(state.left, action),
    right: left(state.right, action)
  });
}
```

Or simply use `composeReducers` from vanilla Redux:

```javascript
const createReducer = (emit) => {
  return composeReducers({
    left: createLeftReducer(emit),
    right: createRightReducer(emit)
  };
}
```

#### Compatibility with plain old reducers

Just use them wherever you normally would.

```javascript
const plainReducer = (state, action) => { ... };

const createReducer = (emit) => {
  const anotherReducer = createAnotherReducer(emit);

  return (state, action) => ({
    plain: plainReducer(state.plain, action),
    another: anotherReducer(state.another, action)
  });
}
```

#### Pattern: Single Handler

If you appreciate the fact that Redux Actions are (A) just plain data, (B) have a type that you can query, you can do the same for the effects.

```javascript
const handler = dispatch => effect => {
  switch (effect.kind) {
    case 'LAUNCH_MISSILES':
      launchMissiles(effect.destination).then(
        result => dispatch(launchSuccess(result)),
        error => dispatch(launchFailure(error))
      );
      return;
    case ...:
      ...
  }
};

```

The property is deliberately called `kind`, not `type` in the example, to allow easier discerning between Actions and Effects at a glance.

#### Pattern: Multiple Handlers

If you think that having a `kind` is just boilerplate, you can avoid it by directly referencing the handler in the argument to `emit`. Make sure not to actually call the handler, though. 

```javascript
// handlers.js
const missileHandler = dispatch => data => {
  launchMissiles(data.destination).then(
    result => dispatch(launchSuccess(result)),
    error => dispatch(launchFailure(error))
  );
};

/* more handlers here */
...


// index.js
const handler = dispatch => effect => effect.handler(dispatch)(effect.data);
/* create the enhancer and store using the handler */


// reducer.js
const createReducer = (emit) => (state, action) => {
  ...
  emit({ handler: missileHandler, data: someData });
  ...
}

```

As you can see, these Handlers are rather similar to [thunks](https://github.com/gaearon/redux-thunk), except that they are "turned inside out",  their curried arguments being swapped. Another major difference is that thunks are dispatched outside the store as Actions, whereas Effects get emitted from the inside (and have nothing in common with Actions).

#### Initial effects

Initial effects are closely coupled to the initial state. For instance, let's say that your state reflects whether or not you are loading data. And furthermore, you want the network request be sent immediately on initialization. Keeping the `loading: true` and `emit(networkRequest)` close together in the code seems like a very good idea.

Normally, you keep the initial state in the reducer as a default value for the `state` argument. But you can't emit that initial network request in the reducer, because [Redux forbids](https://github.com/reactjs/redux/issues/186) you handling the "INIT" action that is dispatched on initialization.

But there is another way. Petux is specifically designed to collect all effects from `emit` calls made *before* the store is created — and perform these "initial" effects once you *do* create it.

This enables a convenient place to put the initial effects: directly inside your `createReducer` function. It works, because in practice, you would always create your reducer *before* you create the store. 

```javascript
const createReducer = (emit) => {
  const initialState = { loading: true, ... };
  emit(networkRequest);
  
  return (state = initialState, action) => { ... };
}
```

#### Hot Reloading with Webpack

Should work similarly to plain Redux. Just make sure to pass in the same `emit` function when creating the new reducer.

```javascript
import { createStore } from 'redux';
import { initEffects } from 'petux';
import createReducer from './createReducer';

const { emit, enhancer } = initEffects(...);
const store = createStore(createReducer(emit), enhancer);

module.hot.accept('./createReducer'], () => {
  const createNewReducer = require('./createReducer').default;
  store.replaceReducer(createNewReducer(emit));
});
```

### Prior Art

- [Elm Architecture](https://guide.elm-lang.org/architecture/), including [Effects](https://guide.elm-lang.org/architecture/effects/)
 - The original architecture which inspired Redux.
 - [You can](https://github.com/tempname11/scalable-frontend-with-elm-or-redux/tree/master/petux-tempname11) replicate the Elm Commands completely using Petux.
- [redux-loop](https://github.com/redux-loop/redux-loop)
 - The best-known attempt to port Elm's effect system to Redux.
- [redux-thunk](https://github.com/gaearon/redux-thunk)
 - The widely used "Real World" solution to side-effects.
 - [see comparison with Petux in this section](#pattern-multiple-handlers)

### Contributions

The project is currently in public beta. Your contribution will be heartily appreciated. ❤️

Here's how you can help:

- Leave feedback about what you liked/disliked about Petux.
- Provide your own examples - there is a need for more!
- Writing some Jest tests for the library.
- Help improve the documentation, which is rather hastily-written and so might be confusing at times.
- If you like Petux, spread the word!

### License

MIT

# Handlers

## Pattern: Effects as `dispatch => {...}` functions

To avoid boilerplate, you can `emit` functions that take `dispatch` as an argument directly.

### `effects.js`
```javascript
const launchMissiles = destination => dispatch => {
  doStuff(destination).then(
    result => dispatch(launchSuccess(result)),
    error => dispatch(launchFailure(error))
  );
};
```

### `index.js`
```javascript
const handler = dispatch => effect => effect.handler(dispatch)(effect.data);
/* create the enhancer and store using the handler */
```

### `reducer.js`
```javascript
import { launchMissiles } from './effects'

export default (emit) => (state, action) => {
  ...
  emit(launchMissiles(someDestination));
  ...
}
```

As you can see, these Effects are eerily similar to [thunks](https://github.com/gaearon/redux-thunk). A major difference is that thunks are dispatched outside the store as Actions, whereas Effects get emitted from the inside (and have nothing in common with Actions).

This pattern is used in the [Async example](/docs/async.md)

## Pattern: Effects as Plain Data

If you appreciate the fact that normal Redux actions are (A) just plain data, (B) have a type that you can query, you can do the same for the effects.

```javascript
const handler = dispatch => effect => {
  switch (effect.kind) {
    case 'LAUNCH_MISSILES':
      doStuff(effect.destination).then(
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

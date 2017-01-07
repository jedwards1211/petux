# Hot Reloading with Webpack

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


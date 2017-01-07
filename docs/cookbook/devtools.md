# Interop with [Redux Dev Tools Extension](https://github.com/zalmoxisus/redux-devtools-extension)

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

const store = createStore(createReducer(emit), compose(...enhancers));
```


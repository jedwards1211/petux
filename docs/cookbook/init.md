# Initial Effects

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


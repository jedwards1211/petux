# Composability

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

## Working with plain old reducers

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


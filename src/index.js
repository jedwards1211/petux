import {
  createStore as reduxCreateStore,
  combineReducers as reduxCombineReducers,
  compose
} from 'redux';

export function effectEnhancer(handler) {
  return (createStore) => (reducer, preloadedState, enhancer) => {
    let emittedEffects = [];

    const lift = r => (state, action) => r(state, action, emit);
    const replaceReducer = r => store.replaceReducer(lift(r));
    const store = createStore(lift(reducer), preloadedState, enhancer);
    const perform = handler(dispatch);

    function emit(effect) {
      emittedEffects.push(effect);
    }

    function dispatch(action) {
      emittedEffects = [];
      store.dispatch(action);
      setTimeout(() => performAll(emittedEffects), 0);
    }

    function performAll(effects) {
      for (let i = 0; i < effects.length; i++) {
        try {
          perform(effects[i]);
        } catch(e) {
          console.error(e);
        }
      }
    }

    return {
      ...store,
      dispatch,
      replaceReducer,
    };
  }
}

export function createStore(reducer, preloadedState, enhancer, handler) {
  enhancer = handler ? compose(effectEnhancer(handler), enhancer) : enhancer;
  return (reduxCreateStore)(reducer, preloadedState, enhancer);
}

export function combineReducers(reducers) {
  let emit_;

  const lift = r => (state, action) => r(state, action, emit_);
  const liftedReducers = {};
  const keys = Object.keys(reducers);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = reducers[key];

    if (typeof value === 'function') {
      liftedReducers[key] = lift(value);
    } else {
      liftedReducers[key] = value;
    }
  }

  const combination = reduxCombineReducers(liftedReducers);

  return function(state, action, emit) {
    emit_ = emit;
    return combination(state, action);
  }
}

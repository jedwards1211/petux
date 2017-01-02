import {
  createStore as reduxCreateStore,
  combineReducers as reduxCombineReducers
} from 'redux';

function noOp() {}

function fastStrategy(performWith) {
  return (dispatch) => ({
    emit: performWith(dispatch),
    dispatch,
  });
}

function safeStrategy(performWith) {
  return (innerDispatch) => {
    const performForReal = performWith(dispatch);
    let perform = noOp;

    function dispatch(action) {
      perform = performForReal;
      
      try {
        innerDispatch(action);
      } catch(e) {
        perform = noOp;
        throw e;
      }

      perform = noOp;
    }

    function emit(effect) {
      try {
        perform(effect);
      } catch(e) {
        console.error(e);
      }
    }

    return {
      emit,
      dispatch,
    };
  }
}

fastStrategy._isStrategy = true;
safeStrategy._isStrategy = true;

function effectEnhancer(strategy) {
  return (createStore) => (reducer, preloadedState, enhancer) => {
    let emit_ = noOp;
    const lift = r => (state, action) => r(state, action, emit_);
    const store = createStore(lift(reducer), preloadedState, enhancer);
    const { emit, dispatch } = strategy(store.dispatch);
    const replaceReducer = r => store.replaceReducer(lift(r));
    emit_ = emit; // tie the knot.
    return {
      ...store,
      dispatch,
      replaceReducer
    };
  }
}

function createStore(reducer, preloadedState, enhancer, strategy) {
  if (!strategy._isStrategy) {
    if (process.env.NODE_ENV === 'production') {
      strategy = fastStrategy(strategy);
    } else {
      strategy = safeStrategy(strategy);
    }
  }
  return effectEnhancer(strategy)(reduxCreateStore)(reducer, preloadedState, enhancer);
}

function combineReducers(reducers) {
  let emit_ = noOp;
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

export {
  createStore,
  combineReducers,
  fastStrategy,
  safeStrategy,
  effectEnhancer,
}

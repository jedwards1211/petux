/* @flow */

type Dispatch<A> = (A) => void;
type Handler<A, E> = Dispatch<A> => E => void;

const blackhole = { push() {} };

export function initEffects<A, E>(handler: Handler<A, E>) {
  let newEffects = blackhole;

  function emit(effect: E) {
    newEffects.push(effect);
  }

  const enhancer = (createStore: *) => (...args: *[]) => {
    const store = createStore(...args);
    const perform = handler(store.dispatch);

    function performAll(effects: E[]) {
      for (let i = 0; i < effects.length; i++) {
        try {
          perform(effects[i]);
        } catch(e) {
          console.error(e);
        }
      }
    }

    function dispatch(action: A) {
      newEffects = [];
      store.dispatch(action);
      const queuedEffects = newEffects;
      setTimeout(() => performAll(queuedEffects), 0);
      newEffects = blackhole;
    }

    return {
      ...store,
      dispatch,
    };
  }

  return { enhancer, emit };
}

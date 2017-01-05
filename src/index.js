/* @flow */

export type Emit<E> = (E) => void;
export type Dispatch<A> = (A) => void;
export type Handler<A, E> = (Dispatch<A>) => (E) => void;
type Init<A, E> = { emit: Emit<E>, enhancer: * }; // FIXME enhancer

const blackhole = { push() {} };

export function initEffects<A, E>(handler: Handler<A, E>): Init<A, E> {
  const initialEffects = [];
  let sink = initialEffects;

  function emit(effect) {
    sink.push(effect);
  }

  const enhancer = (createStore: *) => (...args: *[]) => {
    const store = createStore(...args);
    const perform = handler(store.dispatch);

    function performAll(effects) {
      for (let i = 0; i < effects.length; i++) {
        try {
          perform(effects[i]);
        } catch(e) {
          console.error(e);
        }
      }
    }

    function dispatch(action) {
      sink = [];
      store.dispatch(action);
      const queuedEffects = sink;
      setTimeout(() => performAll(queuedEffects), 0);
      sink = blackhole;
    }

    setTimeout(() => performAll(initialEffects), 0);
    sink = blackhole;

    return {
      ...store,
      dispatch,
    };
  }

  return { enhancer, emit };
}

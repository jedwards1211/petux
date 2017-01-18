/* @flow */

/*
 * An Action dispatcher (see Redux).
 */
export type Dispatch<Action> = (Action) => void;

/*
 * An Effect emitter: a function that accepts an effect description. It can't
 * return any values or actually perform any effects. Normally is used inside
 * reducers.
 */
export type Emit<Effect> = (Effect) => void;

/*
 * Performs an Effect. Can `dispatch` Actions. May `fetch`, launch nuclear
 * missiles, or whatever else is required by the application.
 */
export type Handler<Action, Effect> = (Dispatch<Action>) => (Effect) => void;

/*
 * The result of `initEffects`.
 */
type Couple<A, E> = { emit: Emit<E>, middleware: * }; // FIXME the enhancer type

/*
 * Given an effect handler, returns the `emit` function and the store enhancer.
 *
 * To get your effects performed after dispatching, create the store with this
 * enhancer, and use `emit` inside your root reducer.
 */
export function initEffects<A, E>(handler: Handler<A, E>): Couple<A, E> {
  /*
  * An effect sink that completely ignores all effects.
  */
  const blackhole = { push() {} };

  /*
   * All effects that are emitted before the store is created will be pushed
   * into this array.
   */
  const initialEffects = [];

  /*
   * This variable is mutable on purpose. At any given time, it is one of:
   * - `initialEffects`
   * - `blackhole`
   * - a temporary array created inside the `dispatch` function.
   */
  let sink = initialEffects;

  /*
   * The most important function in this library. The thing to note is that the
   * `sink` may be different between calls.
   */
  function emit(effect) {
    sink.push(effect);
  }

  const middleware = store => next => action => {
    /*
     * Self-explanatory.
     */
    function performAll(effects) {
      for (let i = 0; i < effects.length; i++) {
        /*
         * We use a `try-catch` inside this loop, so that an exception thrown
         * while performing an effect will not prevent other effects getting
         * performed.
         */
        try {
          handler(store.dispatch)(effects[i]);
        } catch(e) {
          console.error('While performing an effect:', e);
        }
      }
    }

    /*
     * Create a new temporary array to emit effects into. All effects emitted
     * during the reducer execution will get pushed into this array.
     */
    sink = [];

    /*
     * The reducer will get executed here by Redux.
     */
    next(action);

    /*
     * Since we are going to reset the "sink", we need to save the
     * resulting array of emitted effects for the closure.
     */
    const queuedEffects = sink;

    /*
     * Perform all queued effects asyncronously. Async is important here,
     * because performing an effect may `dispatch`, which would be a recursive
     * call.
     */
    setTimeout(() => performAll(queuedEffects), 0);

    /*
     * We are done. To prevent any inner dispatches (e.g. Redux Dev Tools) or
     * extraneous `emit` calls from performing any effects, we reset the sink
     * to `blackhole`, i.e. ignore everything.
     */
    sink = blackhole;
  }

  /*
   * That's it, folks!
   */
  return { middleware, emit };
}

import { createStore, applyMiddleware, compose } from 'redux'
import { initEffects } from 'petux'
import createLogger from 'redux-logger'
import { handler } from '../effects'
import rootReducerWith from '../reducers'
import DevTools from '../containers/DevTools'

const { emit, enhancer: effectEnhancer } = initEffects(handler);
const configureStore = preloadedState => {
  const store = createStore(
    rootReducerWith(emit),
    preloadedState,
    compose(
      effectEnhancer,
      applyMiddleware(createLogger()),
      DevTools.instrument()
    )
  )

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('../reducers', () => {
      const nextRootReducer = require('../reducers').default
      store.replaceReducer(nextRootReducer)
    })
  }

  return store
}

export default configureStore

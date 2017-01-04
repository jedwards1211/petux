import { createStore } from 'redux'
import { initEffects } from 'petux'
import { handler } from '../effects'
import rootReducerWith from '../reducers'

const { emit, enhancer: effectEnhancer } = initEffects(handler);
const configureStore = preloadedState => createStore(
  rootReducerWith(emit),
  preloadedState,
  effectEnhancer
)

export default configureStore

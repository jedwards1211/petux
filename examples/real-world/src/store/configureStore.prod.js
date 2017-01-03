import { createStore, } from 'redux'
import { effectEnhancer } from 'petux'
import { handler } from '../effects'
import rootReducer from '../reducers'

const configureStore = preloadedState => createStore(
  rootReducer,
  preloadedState,
  effectEnhancer(handler)
)

export default configureStore

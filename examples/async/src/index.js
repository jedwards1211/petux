import React from 'react'
import { render } from 'react-dom'
import { createStore, applyMiddleware, compose } from 'redux'
import { Provider } from 'react-redux'
import { initEffects } from 'petux'
import createLogger from 'redux-logger'
import createReducer from './reducers'
import App from './containers/App'

const handler = dispatch => effect => effect(dispatch)
const { emit, enhancer } = initEffects(handler)
const middleware = []
if (process.env.NODE_ENV !== 'production') {
  middleware.push(createLogger())
}

const store = createStore(
  createReducer(emit),
  compose(enhancer, applyMiddleware(...middleware))
)

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)

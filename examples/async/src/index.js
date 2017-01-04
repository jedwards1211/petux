import React from 'react'
import { render } from 'react-dom'
import { initEffects } from 'petux'
import { createStore, compose, applyMiddleware } from 'redux'
import { Provider } from 'react-redux'
import createLogger from 'redux-logger'
import reducerWith from './reducers'
import App from './containers/App'

const middleware = []
if (process.env.NODE_ENV !== 'production') {
  middleware.push(createLogger())
}

const handler = dispatch => ({ fn, args }) => fn(dispatch)(...args);
const { emit, enhancer: effectEnhancer } = initEffects(handler);

const store = createStore(
  reducerWith(emit),
  compose(
    effectEnhancer,
    applyMiddleware(...middleware)
  )
)

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)

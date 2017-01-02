import React from 'react'
import { render } from 'react-dom'
import { createStore } from 'petux'
import { applyMiddleware } from 'redux'
import { Provider } from 'react-redux'
import createLogger from 'redux-logger'
import reducer from './reducers'
import App from './containers/App'

const middleware = []
if (process.env.NODE_ENV !== 'production') {
  middleware.push(createLogger())
}

const performWith = dispatch => ({ fn, args }) => fn(dispatch)(...args);

const store = createStore(
  reducer,
  undefined,
  applyMiddleware(...middleware),
  performWith
)

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)

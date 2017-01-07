# Example: Async

In this section, we will take a look at the `async` example from the Redux repository. We will see what it takes to migrate from `redux-thunk` to `petux` as the side-effect solution.

First, make sure you are familiar with the [original code](https://github.com/reactjs/redux/tree/master/examples/async). A good explanation is available [in the Redux tutorial](http://redux.js.org/docs/advanced/AsyncActions.html).

If you just want to skip to the chase and see the full diff, [it's available here](https://github.com/tempname11/petux/commit/4a27ce53d352c42911790b00f89c9c37114d183f).

Now, let's go through the changes step-by-step.

### `src/actions/index.js`

Since we are not going to be using thunks anymore, the `fetchPostsIfNeeded` action creator (and the helpers it uses) need to go. We'll leave all the non-thunk action creators intact.

```diff
-		
-const fetchPosts = reddit => dispatch => {		
-  dispatch(requestPosts(reddit))		
-  return fetch(`https://www.reddit.com/r/${reddit}.json`)		
-    .then(response => response.json())		
-    .then(json => dispatch(receivePosts(reddit, json)))		
-}		
-		
-const shouldFetchPosts = (state, reddit) => {		
-  const posts = state.postsByReddit[reddit]		
-  if (!posts) {		
-    return true		
-  }		
-  if (posts.isFetching) {		
-    return false		
-  }		
-  return posts.didInvalidate		
-}		
-		
-export const fetchPostsIfNeeded = reddit => (dispatch, getState) => {		
-  if (shouldFetchPosts(getState(), reddit)) {		
-    return dispatch(fetchPosts(reddit))		
-  }		
-}
```

Obviously, this code was meaningful and we'll need to replicate it's functionality:

- Initiating the "fetch posts if needed" process.
- Checking if the posts need to be fetched.
- Actually calling `fetch`, and dispatching an action when it's done.

### `src/containers/App.js`

Since we don't have `fetchRequestsIfNeeded` anymore, we're going to have to dispatch a regular plain action from our React component. We'll reuse the existing `requestPosts`, since it matches our semantics.

```diff
 import React, { Component, PropTypes } from 'react'
 import { connect } from 'react-redux'
-import { selectReddit, fetchPostsIfNeeded, invalidateReddit } from '../actions'
+import { selectReddit, requestPosts, invalidateReddit } from '../actions'
 import Picker from '../components/Picker'
 import Posts from '../components/Posts'
```

```diff 
   componentDidMount() {
     const { dispatch, selectedReddit } = this.props
-    dispatch(fetchPostsIfNeeded(selectedReddit))
+    dispatch(requestPosts(selectedReddit))
   }
 
   componentWillReceiveProps(nextProps) {
     if (nextProps.selectedReddit !== this.props.selectedReddit) {
       const { dispatch, selectedReddit } = nextProps
-      dispatch(fetchPostsIfNeeded(selectedReddit))
+      dispatch(requestPosts(selectedReddit))
     }
   }
 
@@ -34,7 +34,7 @@ class App extends Component {
 
     const { dispatch, selectedReddit } = this.props
     dispatch(invalidateReddit(selectedReddit))
-    dispatch(fetchPostsIfNeeded(selectedReddit))
+    dispatch(requestPosts(selectedReddit))
   }
```

### `src/reducers/index.js`

Now, since our reducers will have a new capability — deciding if and which effects should happen — it's only natural that some of the thunk logic gets moved into the reducer:

```diff
     case REQUEST_POSTS:
-      return {
-        ...state,
-        isFetching: true,
-        didInvalidate: false
+      if (shouldFetchPosts(state)) {
+        emit(fetchPosts(action.reddit))
+        return {
+          ...state,
+          isFetching: true,
+          didInvalidate: false
+        }
+      } else {
+        return state
       }
```

This is the reducer for a single reddit. If fetch is needed, it emits the effect and sets the new state. Otherwise, it does nothing.

We'll put our `shouldFetchPosts` helper close to the reducer. Note that it almost exactly replicates the original one, with the key difference being that now it receives only a single reddit's state, not the whole root state tree.

```diff
+const shouldFetchPosts = (state) => {
+  if (!state) {
+    return true
+  }
+  if (state.isFetching) {
+    return false
+  
+  return state.didInvalidate
+}
```

You may have noticed that we've used `emit` and `fetchPosts` in our reducer, but don't have them yet. Let's fix this:

```diff
 import {
   SELECT_REDDIT, INVALIDATE_REDDIT,
   REQUEST_POSTS, RECEIVE_POSTS
 } from '../actions'
+import { fetchPosts } from '../effects'
 
+export default function(emit) {

...
```

```diff
...

-const rootReducer = combineReducers({
+return combineReducers({
   postsByReddit,
   selectedReddit
 })
-
-export default rootReducer
+}
```

It's a good idea to have the effects in a separate file, so we simply import `fetchPosts` (see below for it's implementation). We also wrap the whole file into a function that receives `emit`. This way, `emit` is accessible to all reducers and helpers in this file and you don't have to jump through hoops if you need it.

The default export changes from the reducer to a function *returning* the reducer, a pattern referred in these docs as a "reducer creator" — by analogy with Redux action creators.

### `src/effects/index.js`

We haven't defined the new `fetchPosts` effect, so we'll do that now. We're going for the approach with the least boilerplate: making the effect itself a function that takes `dispatch`. It feels surprisingly "thunky":

```diff
+import { receivePosts } from '../actions'
+
+export const fetchPosts = reddit => dispatch => {
+  return fetch(`https://www.reddit.com/r/${reddit}.json`)
+    .then(response => response.json())
+    .then(json => dispatch(receivePosts(reddit, json)))
+}
```

In fact, the only difference from the original `fetchPosts` is that this function does not dispatch a `requestPosts` action.

Why? Well, it's because the order is now reversed compared to the original solution with thunks. First, a `requestPosts` action is dispatched. Only then, the reducer (conditionally) emits `fetchPosts`, and some time later, it's body is executed.

But what exactly happens between the `emit` call (which does *not* perform the effect), and the body execution? We need to define our effect handler. And it's dead simple:

```javascript
const handler = dispatch => effect => effect(dispatch)
```

### `src/index.js`

Let's actually use this handler, and let go of the thunks completely:

```diff
 import React from 'react'
 import { render } from 'react-dom'
-import { createStore, applyMiddleware } from 'redux'
+import { createStore, applyMiddleware, compose } from 'redux'
 import { Provider } from 'react-redux'
-import thunk from 'redux-thunk'
+import { initEffects } from 'petux'
 import createLogger from 'redux-logger'
-import reducer from './reducers'
+import createReducer from './reducers'
 import App from './containers/App'
 
-const middleware = [ thunk ]
+const handler = dispatch => effect => effect(dispatch)
+const { emit, enhancer } = initEffects(handler)
+const middleware = []
 if (process.env.NODE_ENV !== 'production') {
   middleware.push(createLogger())
 }
 
 const store = createStore(
-  reducer,
-  applyMiddleware(...middleware)
+  createReducer(emit),
+  compose(enhancer, applyMiddleware(...middleware))
 )
```

### `package.json`

And that's it. Hopefully, all this wasn't too hard.

```diff
   "dependencies": {
+    "petux": "^1.0.0-beta.0",
     "react": "^15.3.0",
     "react-dom": "^15.3.0",
     "react-redux": "^4.4.5",
-    "redux": "^3.5.2",
-    "redux-thunk": "^2.1.0"
+    "redux": "^3.5.2"
   },
```

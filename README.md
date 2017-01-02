# Petux

Perform side effects with [Redux](https://github.com/reactjs/redux).

Etymology: derived from **Rus.** [*петух*](https://en.wiktionary.org/wiki/%D0%BF%D0%B5%D1%82%D1%83%D1%85) [pʲɪˈtux] — a rooster.

[![build status](https://img.shields.io/travis/tempname11/petux/master.svg?style=flat-square)](https://travis-ci.org/tempname11/petux)

### In a nutshell

```javascript
// TODO better example!

import { createStore } from 'redux'
import { enhanceWith } from 'petux'

const pageApp = (state, action, perform) => {
	switch (action.type) {
	case 'USER_WANTS_MORE':
		perform({ type: 'FETCH_PAGE', number: state.pages.length })
		return {
			...state,
			loading: true
		}
		
	case 'FETCH_PAGE_SUCCEEDED':
		return {
			...state,
			loading: false,
			pages: [...state.pages, action.page]
		}
	}
	
	case 'FETCH_PAGE_FAILED':
		return {
			...state,
			loading: false,
			error: true
		}
	
	default: return state 
}

const topLevel = dispatch => effect => {
	switch (effect.type) {
		case 'FETCH_PAGE':
			fetch('...').then(data => {
				dispatch({ type: 'FETCH_PAGE_SUCCEEDED', data })
			}, error => {
				dispatch({ type: 'FETCH_PAGE_FAILED', error })
			})
	}
}

const store = createStore(pageApp, initialState, enhanceWith(topLevel));

store.dispatch({ type: 'USER_WANTS_MORE' })
```

### Motivation

At the moment of writing this, the Redux ecosystem still [lacks](https://github.com/reactjs/redux/issues/1528) a solution for side effects that is predictable, usable and composable. *Petux* is a humble attempt to [solve](http://xkcd.com/927/) this problem.

It is influenced by [Cmd](https://www.elm-tutorial.org/en/03-subs-cmds/02-commands.html) from the Elm Architecture. However, it's adapted for JavaScript realities, with ease of use being one of the heaviest priorities.

### The solution

We allow reducers to perform side effects.

**Whoa, wait!** Isn't that forbidden? Reducers are supposed to be pure.

Let me clarify that. We allow reducers to perform **controlled** side effects. They only can call the `perform` function. Because the `perform` function is passed to the reducer from the outside, that allows the owner to specify and control what can happen. For instance:

* If you pass a no-op function, there will be no side effects whatsoever.
* If you pass an `effect => someArray.push(effect)`, you just collect *descriptions* of what should happen, inside the `someArray` array.
* And of course, if you pass in a function that only does `fetch`, then `fetch` might happen. However, no other effects will happen.

Furthermore, `perform` is required (by convention and by [flow](flowtype.org/) type annotations) never to return any values. This ensures that any effects happening will not influence the reducer logic. Therefore, effects are predictable: given a state and a Redux action, a reducer will always return exactly the same new state, and also perform exactly the same effects.

### Composability

If you have several subreducers and they all perform the same kind of effects, you can simply pass `perform` to the subreducers:

```
function reducer(state, action, perform) {
    return {
        left: leftReducer(state.left, action, perform),
        right: rightReducer(state.right, action, perform)
    };
}
```

Of course, you have a lot more power than that. You can discard a subreducer's effects:

```
function reducer(state, action, perform) {
    return {
        left: leftReducer(state.left, action, () => {}),
        right: rightReducer(state.right, action, perform)
    };
}
```
In this case, `leftReducer` will not be able to perform any effects, whereas `rightReducer` will have as much "power" as its owner.

Since effects are plain data, you can also transform them in any way you want. You also can delay, reorder and batch effects, should you want that.

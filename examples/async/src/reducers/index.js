import { combineReducers } from 'redux'
import { fetchPosts } from '../effects'
import { SELECT_REDDIT, REQUEST_POSTS, RECEIVE_POSTS } from '../actions'

const selectedReddit = (state = 'reactjs', action) => {
  switch (action.type) {
    case SELECT_REDDIT:
      return action.reddit
    default:
      return state
  }
}

const postsWith = emit => (state = {
  isFetching: false,
  valid: false,
  items: []
}, action) => {
  switch (action.type) {
    case REQUEST_POSTS:
      const isFetching = action.forceFetch || (!state.valid && !state.isFetching);
      if (isFetching) {
        emit({ fn: fetchPosts, args: [action.reddit] })
      }
      return {
        ...state,
        isFetching,
        valid: true
      }
    case RECEIVE_POSTS:
      return {
        ...state,
        isFetching: false,
        valid: true,
        items: action.posts,
        lastUpdated: action.receivedAt
      }
    default:
      return state
  }
}

const postsByRedditWith = emit => (state = { }, action) => {
  switch (action.type) {
    case RECEIVE_POSTS:
    case REQUEST_POSTS:
      return {
        ...state,
        [action.reddit]: postsWith(emit)(state[action.reddit], action)
      }
    default:
      return state
  }
}

const rootReducerWith = emit => combineReducers({
  postsByReddit: postsByRedditWith(emit),
  selectedReddit
})

export default rootReducerWith

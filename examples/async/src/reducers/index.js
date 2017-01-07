import { combineReducers } from 'redux'
import {
  SELECT_REDDIT, INVALIDATE_REDDIT,
  REQUEST_POSTS, RECEIVE_POSTS
} from '../actions'
import { fetchPosts } from '../effects'

export default function(emit) {
  const selectedReddit = (state = 'reactjs', action) => {
    switch (action.type) {
      case SELECT_REDDIT:
        return action.reddit
      default:
        return state
    }
  }

  const shouldFetchPosts = (state) => {
    if (!state) {
      return true
    }
    if (state.isFetching) {
      return false
    }
    return state.didInvalidate
  }

  const posts = (state = {
    isFetching: false,
    didInvalidate: true,
    items: []
  }, action) => {
    switch (action.type) {
      case INVALIDATE_REDDIT:
        return {
          ...state,
          didInvalidate: true
        }
      case REQUEST_POSTS:
        if (shouldFetchPosts(state)) {
          emit(fetchPosts(action.reddit))
          return {
            ...state,
            isFetching: true,
            didInvalidate: false
          }
        } else {
          return state
        }
      case RECEIVE_POSTS:
        return {
          ...state,
          isFetching: false,
          didInvalidate: false,
          items: action.posts,
          lastUpdated: action.receivedAt
        }
      default:
        return state
    }
  }

  const postsByReddit = (state = { }, action) => {
    switch (action.type) {
      case INVALIDATE_REDDIT:
      case RECEIVE_POSTS:
      case REQUEST_POSTS:
        return {
          ...state,
          [action.reddit]: posts(state[action.reddit], action)
        }
      default:
        return state
    }
  }

  return combineReducers({
    postsByReddit,
    selectedReddit
  })
}

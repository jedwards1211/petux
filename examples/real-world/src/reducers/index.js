import * as ActionTypes from '../actions'
import paginateWith from './paginate'
import entitiesWith from './entities'
import { routerReducer as routing } from 'react-router-redux'
import { combineReducers } from 'redux'
import { Schemas } from '../api';

// Updates error message to notify about the failed fetches.
const errorMessage = (state = null, action) => {
  const { type, error } = action

  if (type === ActionTypes.RESET_ERROR_MESSAGE) {
    return null
  } else if (error) {
    return action.error
  }

  return state
}

// Updates the pagination data for different actions.
const paginationWith = emit => combineReducers({
  starredByUser: paginateWith(emit)({
    mapActionToKey: action => action.login,
    mapActionToDefaultUrl: action => `users/${action.login}/starred`,
    schema: Schemas.REPO_ARRAY,
    loadType: ActionTypes.LOAD_STARRED,
    successType: ActionTypes.STARRED_SUCCESS,
    failureType: ActionTypes.STARRED_FAILURE
  }),
  stargazersByRepo: paginateWith(emit)({
    mapActionToKey: action => action.fullName,
    mapActionToDefaultUrl: action => `repos/${action.fullName}/stargazers`,
    schema: Schemas.USER_ARRAY,
    loadType: ActionTypes.LOAD_STARGAZERS,
    successType: ActionTypes.STARGAZERS_SUCCESS,
    failureType: ActionTypes.STARGAZERS_FAILURE
  })
})

const rootReducerWith = emit => combineReducers({
  entities: entitiesWith(emit),
  pagination: paginationWith(emit),
  errorMessage,
  routing
})

export default rootReducerWith

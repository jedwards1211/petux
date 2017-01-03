import * as ActionTypes from '../actions'
import paginate from './paginate'
import entities from './entities'
import { routerReducer as routing } from 'react-router-redux'
import { combineReducers } from 'petux'
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
const pagination = combineReducers({
  starredByUser: paginate({
    mapActionToKey: action => action.login,
    mapActionToDefaultUrl: action => `users/${action.login}/starred`,
    schema: Schemas.REPO_ARRAY,
    loadType: ActionTypes.LOAD_STARRED,
    successType: ActionTypes.STARRED_SUCCESS,
    failureType: ActionTypes.STARRED_FAILURE
  }),
  stargazersByRepo: paginate({
    mapActionToKey: action => action.fullName,
    mapActionToDefaultUrl: action => `repos/${action.fullName}/stargazers`,
    schema: Schemas.USER_ARRAY,
    loadType: ActionTypes.LOAD_STARGAZERS,
    successType: ActionTypes.STARGAZERS_SUCCESS,
    failureType: ActionTypes.STARGAZERS_FAILURE
  })
})

const rootReducer = combineReducers({
  entities,
  pagination,
  errorMessage,
  routing
})

export default rootReducer

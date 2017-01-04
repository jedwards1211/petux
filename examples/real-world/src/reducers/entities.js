import merge from 'lodash/merge'
import * as ActionTypes from '../actions'
import { Schemas } from '../api';

// Updates an entity cache in response to any action with response.entities.
// Emits fetch effects if the state is missing necessary data.
const entitiesWith = emit => (state = { users: {}, repos: {} }, action) => {
  if (action.response && action.response.entities) {
    return merge({}, state, action.response.entities)
  }

  switch(action.type) {
    case ActionTypes.LOAD_USER:
      const user = state.users[action.login]
      if (user && action.requiredFields.every(key => user.hasOwnProperty(key))) {
        // Cached data is good.
      } else {
        // Fetch a single user from Github API.
        emit({
          kind: 'API',
          successType: ActionTypes.USER_SUCCESS,
          failureType: ActionTypes.USER_FAILURE,
          endpoint: `users/${action.login}`,
          schema: Schemas.USER,
          payload: action
        })
      }
      return state
    case ActionTypes.LOAD_REPO:
      const repo = state.repos[action.fullName]
      if (repo && action.requiredFields.every(key => repo.hasOwnProperty(key))) {
        // Cached data is good.
      } else {
        // Fetch a single repository from Github API.
        emit({
          kind: 'API',
          successType: ActionTypes.REPO_SUCCESS,
          failureType: ActionTypes.REPO_FAILURE,
          endpoint: `repos/${action.fullName}`,
          schema: Schemas.REPO,
          payload: action
        })
      }
      return state
    default:
  }

  return state
}

export default entitiesWith

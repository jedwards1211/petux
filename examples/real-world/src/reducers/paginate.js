import union from 'lodash/union'

// Creates a reducer managing pagination, given the action types to handle,
// and a function telling how to extract the key from an action.
const paginate = ({ loadType, schema, successType, failureType, mapActionToKey, mapActionToDefaultUrl }) => {
  if (typeof loadType !== 'string') {
    throw new Error('Expected `loadType` to be a string.')
  }
  if (!schema) {
    throw new Error('Specify one of the exported Schemas.')
  }
  if (typeof successType !== 'string') {
    throw new Error('Expected `successType` to be a string.')
  }
  if (typeof failureType !== 'string') {
    throw new Error('Expected `failureType` to be a string.')
  }
  if (typeof mapActionToKey !== 'function') {
    throw new Error('Expected mapActionToKey to be a function.')
  }
  if (typeof mapActionToDefaultUrl !== 'function') {
    throw new Error('Expected mapActionToDefaultUrl to be a function.')
  }

  const updatePagination = (state = {
    isFetching: false,
    nextPageUrl: undefined,
    pageCount: 0,
    ids: []
  }, action, emit) => {
    switch (action.type) {
      case loadType:
        if (state.pageCount > 0 && !action.nextPage) {
          return state
        } else {
          emit({
            kind: 'API',
            successType,
            failureType,
            schema,
            endpoint: state.nextPageUrl || mapActionToDefaultUrl(action),
            payload: action
          })
          return {
            ...state,
            isFetching: true
          }
        }
      case successType:
        return {
          ...state,
          isFetching: false,
          ids: union(state.ids, action.response.result),
          nextPageUrl: action.response.nextPageUrl,
          pageCount: state.pageCount + 1
        }
      case failureType:
        return {
          ...state,
          isFetching: false
        }
      default:
        return state
    }
  }

  return (state = {}, action, emit) => {
    // Update pagination by key
    switch (action.type) {
      case loadType:
      case successType:
      case failureType:
        const key = mapActionToKey(action)
        if (typeof key !== 'string') {
          throw new Error('Expected key to be a string.')
        }
        return { ...state,
          [key]: updatePagination(state[key], action, emit)
        }
      default:
        return state
    }
  }
}

export default paginate

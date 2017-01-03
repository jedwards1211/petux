import { callApi } from '../api'

const apiHandler = dispatch => effect => {
  const { endpoint, schema, successType, failureType, payload } = effect

  if (typeof endpoint !== 'string') {
    throw new Error('Specify a string endpoint URL.')
  }
  if (!schema) {
    throw new Error('Specify one of the exported Schemas.')
  }
  if (typeof endpoint !== 'string') {
    throw new Error('Specify a string endpoint URL.')
  }
  if (typeof successType !== 'string') {
    throw new Error('Expected `successType` to be a string.')
  }
  if (typeof failureType !== 'string') {
    throw new Error('Expected `failureType` to be a string.')
  }

  return callApi(endpoint, schema).then(
    response => dispatch({
      ...payload,
      type: successType,
      response
    }),
    error => dispatch({
      ...payload,
      type: failureType,
      error: error.message || 'Something bad has happened'
    })
  )
}

export const handler = dispatch => effect => {
  switch (effect.kind) {
    // In a real application, you would have more than one `kind`.
    case 'API':
      apiHandler(dispatch)(effect)
      break
    default:
  }
}

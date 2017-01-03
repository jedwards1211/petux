export const LOAD_USER = 'LOAD_USER'
export const USER_SUCCESS = 'USER_SUCCESS'
export const USER_FAILURE = 'USER_FAILURE'

export const loadUser = (login, requiredFields = []) => ({
  type: LOAD_USER,
  login,
  requiredFields
})

export const LOAD_REPO = 'LOAD_REPO'
export const REPO_SUCCESS = 'REPO_SUCCESS'
export const REPO_FAILURE = 'REPO_FAILURE'

export const loadRepo = (fullName, requiredFields = []) => ({
  type: LOAD_REPO,
  fullName,
  requiredFields
})

export const LOAD_STARRED = 'LOAD_STARRED'
export const STARRED_SUCCESS = 'STARRED_SUCCESS'
export const STARRED_FAILURE = 'STARRED_FAILURE'

export const loadStarred = (login, nextPage = false) => ({
  type: LOAD_STARRED,
  login,
  nextPage
})

export const LOAD_STARGAZERS = 'LOAD_STARGAZERS'
export const STARGAZERS_SUCCESS = 'STARGAZERS_SUCCESS'
export const STARGAZERS_FAILURE = 'STARGAZERS_FAILURE'

export const loadStargazers = (fullName, nextPage = false) => ({
  type: LOAD_STARGAZERS,
  fullName,
  nextPage
})

export const RESET_ERROR_MESSAGE = 'RESET_ERROR_MESSAGE'

// Resets the currently visible error message.
export const resetErrorMessage = () => ({
    type: RESET_ERROR_MESSAGE
})

export const REQUEST_POSTS = 'REQUEST_POSTS'
export const RECEIVE_POSTS = 'RECEIVE_POSTS'
export const SELECT_REDDIT = 'SELECT_REDDIT'

export const selectReddit = reddit => ({
  type: SELECT_REDDIT,
  reddit
})

export const requestPosts = (reddit, forceFetch = false) => ({
  type: REQUEST_POSTS,
  reddit,
  forceFetch
})

export const receivePosts = (reddit, json) => ({
  type: RECEIVE_POSTS,
  reddit,
  posts: json.data.children.map(child => child.data),
  receivedAt: Date.now()
})

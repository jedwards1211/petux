import { receivePosts } from '../actions'

export const fetchPosts = reddit => dispatch => {
  return fetch(`https://www.reddit.com/r/${reddit}.json`)
    .then(response => response.json())
    .then(json => dispatch(receivePosts(reddit, json)))
}

import { receivePosts } from '../actions'

export const fetchPosts = dispatch => reddit => {
  fetch(`https://www.reddit.com/r/${reddit}.json`)
    .then(response => response.json())
    .then(json => dispatch(receivePosts(reddit, json)))
}

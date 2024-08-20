const lodash = require('lodash')

const dummy = (blogs) => {
  if (blogs) {
    return 1
  }
  return 0
}

const totalLikes = (blogs) => {
  if (blogs.length > 0) {
    return blogs.reduce((total, likes) => total + likes.likes, 0)
  } else {
    return 0
  }
}

const favoriteBlog = (blogs) => {
  const likes = blogs.map(e => e.likes)
  const favorite = blogs[likes.indexOf(Math.max(...likes))]

  return {
    title: favorite.title,
    author: favorite.author,
    likes: favorite.likes
  }
}

const mostBlogsAuthor = (blogs) => {
  const authorBlogNum = lodash.countBy(blogs, 'author')
  const maxBlogs = Math.max(...Object.values(authorBlogNum))
  const maxAuthor = Object.keys(authorBlogNum).find(key => authorBlogNum[key] === maxBlogs)

  return {
    author: maxAuthor,
    blogs: maxBlogs
  }
}

const mostLikes = (blogs) => {
  let authorLikes = {}
  blogs.forEach( blog => {
    if ( blog.author in authorLikes ) {
      authorLikes[blog.author] += blog.likes
    } else {
      authorLikes[blog.author] = blog.likes
    }
  })

  const maxLikes = Math.max(...Object.values(authorLikes))

  return {
    author: Object.keys(authorLikes).find(key => authorLikes[key] === maxLikes),
    likes: maxLikes
  }
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogsAuthor,
  mostLikes
}
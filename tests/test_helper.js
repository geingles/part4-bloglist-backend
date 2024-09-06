const Blog = require('../models/blog')
const User = require('../models/user')

const initialBlogs = [
  {
    title: 'Blog test',
    author: 'Isaac Newton',
    url: 'www.fullstackopen.com',
    likes: 91
  },
  {
    title: 'Blog test 2',
    author: 'Charles Darwin',
    url: 'www.fullstackopen.com',
    likes: 12
  }
]

const initialUser = {
  username: 'root',
  name: 'Supertest',
  password: 'sekret'
}

const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map(blog => blog.toJSON())
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map(user => user.toJSON())
}

module.exports = {
  initialBlogs,
  initialUser,
  blogsInDb,
  usersInDb
}
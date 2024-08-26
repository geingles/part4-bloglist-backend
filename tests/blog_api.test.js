const { test, after, beforeEach } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const blog = require('../models/blog')
const api = supertest(app)

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

beforeEach(async () => {
  await Blog.deleteMany({})
  let blogObject = new Blog(initialBlogs[0])
  await blogObject.save()
  blogObject = new Blog(initialBlogs[1])
  await blogObject.save()
})

test.only('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test.only('Blog key named id', async () => {
  const blogs = await api.get('/api/blogs')
  const result = blogs.body.map(r => Object.keys(r))
  assert.strictEqual(result[0].find(e => e === 'id'), 'id')
})

test.only('A valid blog can be created created', async () => {
  const newBlog = {
    title: 'Blog test 3',
    author: 'Robert D. Junior',
    url: 'www.fullstackopen.com',
    likes: 201
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await api.get('/api/blogs')
  assert.strictEqual(blogsAtEnd.body.length, initialBlogs.length + 1)

  const titles = blogsAtEnd.body.map(r => r.title)
  assert(titles.includes('Blog test 3'))
})

test.only('A blog missing like value has the default value', async () => {
  const newBlog = {
    title: 'Blog without likes',
    author: 'Charles Darwin',
    url: 'www.fullstackopen.com'
  }

  const savedBlog = await api
    .post('/api/blogs')
    .send(newBlog)

  assert.strictEqual(savedBlog.body.likes, 0)
})

test.only('A invalid blog missing title or url return status 400', async () => {
  const newBlog = {
    author: 'Charles Darwin',
    likes: 111
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(400)
})

test.only('A single Blog can be deleted', async () => {
  const blogsAtStart = await api.get('/api/blogs')
  const blogToDelete = blogsAtStart.body[0]

  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .expect(204)

  const blogsAtEnd = await api.get('/api/blogs')

  assert.strictEqual(blogsAtEnd.body.length, blogsAtStart.body.length - 1)

  const titles = blogsAtEnd.body.map(r => r.title)
  assert(!titles.includes(blogToDelete.title))
})

test.only ('A single Blog can be updated', async () => {
  const blogsAtStart = await api.get('/api/blogs')
  const blogToUpdate = blogsAtStart.body[0]
  blogToUpdate.title = 'Updated Blog test'

  await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .send(blogToUpdate)
    .expect(200)

  const blogsAtEnd = await api.get('/api/blogs')

  assert.deepStrictEqual(blogsAtEnd.body[0], blogToUpdate)
})

after(async () => {
  await mongoose.connection.close()
})
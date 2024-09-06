const { test, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)

const helper = require('./test_helper')
const bcrypt = require('bcrypt')
const Blog = require('../models/blog')
const User = require('../models/user')

const userLogin = async () => {
  const userLogin = {
    username: helper.initialUser.username,
    password: helper.initialUser.password
  }

  const credentials = await api
    .post('/api/login')
    .send(userLogin)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  return credentials.body
}

describe.only('Testing Blogs', () => {

  beforeEach(async () => {
    await Blog.deleteMany({})
    await User.deleteMany({})

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(helper.initialUser.password, saltRounds)

    const newUser = new User ({
      username: helper.initialUser.username,
      name: helper.initialUser.name,
      passwordHash
    })

    const savedUser = await newUser.save()
    const blogs = helper.initialBlogs.map( blog => new Blog({ ...blog, 'user': savedUser._id }))
    await Blog.insertMany(blogs)
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
    const usersAtStart =  await helper.usersInDb()

    const newBlog = {
      title: 'Blog test 3',
      author: 'Robert D. Junior',
      url: 'www.fullstackopen.com',
      likes: 201,
      userId: usersAtStart[0].id
    }

    const credentials = await userLogin()

    await api
      .post('/api/blogs')
      .set('Authorization', 'Bearer ' + credentials.token)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await api.get('/api/blogs')
    assert.strictEqual(blogsAtEnd.body.length, helper.initialBlogs.length + 1)

    const titles = blogsAtEnd.body.map(r => r.title)
    assert(titles.includes('Blog test 3'))
  })

  test.only('A blog missing like value has the default value', async () => {
    const usersAtStart =  await helper.usersInDb()

    const newBlog = {
      title: 'Blog without likes',
      author: 'Charles Darwin',
      url: 'www.fullstackopen.com',
      userId: usersAtStart[0].id
    }

    const credentials = await userLogin()

    const savedBlog = await api
      .post('/api/blogs')
      .set('Authorization', 'Bearer ' + credentials.token)
      .send(newBlog)

    assert.strictEqual(savedBlog.body.likes, 0)
  })

  test.only('A invalid blog missing title or url return status 400', async () => {
    const usersAtStart =  await helper.usersInDb()

    const newBlog = {
      author: 'Charles Darwin',
      likes: 111,
      userId: usersAtStart[0].id
    }

    const credentials = await userLogin()

    await api
      .post('/api/blogs')
      .set('Authorization', 'Bearer ' + credentials.token)
      .send(newBlog)
      .expect(400)
  })

  test.only('A single Blog can be deleted', async () => {
    const blogsAtStart = await api.get('/api/blogs')
    const blogToDelete = blogsAtStart.body[0]

    const credentials = await userLogin()

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', 'Bearer ' + credentials.token)
      .expect(204)

    const blogsAtEnd = await api.get('/api/blogs')

    assert.strictEqual(blogsAtEnd.body.length, blogsAtStart.body.length - 1)

    const titles = blogsAtEnd.body.map(r => r.title)
    assert(!titles.includes(blogToDelete.title))
  })

  test.only ('A single Blog can be updated', async () => {
    const credentials = await userLogin()

    const blogsAtStart = await api.get('/api/blogs')
    const blogToUpdate = blogsAtStart.body[0]
    blogToUpdate.title = 'Updated Blog test'

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .set('Authorization', 'Bearer ' + credentials.token)
      .send(blogToUpdate)
      .expect(200)

    const blogsAtEnd = await api.get('/api/blogs')

    assert.deepStrictEqual(blogsAtEnd.body[0], blogToUpdate)
  })
})

describe.only('Testing Users', () => {
  test.only('Valid user creation succeeds', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'testuser1',
      name: 'Test user',
      password: 'sekret'
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()

    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    assert(usernames.includes(newUser.username))
  })

  test.only('User creation with short password returns proper error code and message', async () => {

    const newUser = {
      username: 'testuser1',
      name: 'Test user',
      password: 's'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    assert(result.body.error.includes('Password is too short'))
  })

  test.only('Duplicated username creation returns proper error code and message', async () => {

    const newUser = {
      username: 'root',
      name: 'Supertest',
      password: 'sekret'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    assert(result.body.error.includes('expected `username` to be unique'))
  })
})

after(async () => {
  await mongoose.connection.close()
})
const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs)
})

blogsRouter.post('/', async (request, response) => {
  const body = request.body
  const user = request.user

  const blog = new Blog({
    title: body.title,
    author: user.name,
    url: body.url,
    likes: body.likes,
    user: user.id
  })
  const savedBlog = await blog.save()

  user.blogs = user.blogs.concat(savedBlog._id)
  await user.save()

  response.status(201).json(savedBlog)
})

blogsRouter.delete('/:id', async (request, response) => {

  const user = request.user
  const blog = await Blog.findById(request.params.id)

  if (blog.user.toString() === user._id.toString()) {
    await Blog.findByIdAndDelete(request.params.id)
    response.status(204).end()
  } else {
    return response.status(401).json({ error: 'Unauthorised user' })
  }

})

blogsRouter.put('/:id', async (request, response) => {
  const body = request.body
  const user = request.user

  const blogToUpdate = await Blog.findById(request.params.id)

  if (blogToUpdate.user.toString() === user._id.toString()) {

    const modifiedBlog = {
      ...blogToUpdate.toJSON(),
      title: body.title,
      url: body.url,
      likes: body.likes
    }

    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, modifiedBlog, { new: true })
    response.json(updatedBlog)

  } else {
    return response.status(401).json({ error: 'Unauthorised user' })
  }
})

module.exports = blogsRouter
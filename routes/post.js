// routes/posts.js

const express = require('express')
const router = express.Router()
const Post = require('../models/Post.js')

router.get('/all', async (req, res) => {
  try {
    const posts = await Post.find()
    res.json(posts)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/add', async (req, res) => {
  try {
    const { title, content, author } = req.body // เพิ่ม author มาในการรับข้อมูล
    const newPost = new Post({
      title,
      content,
      author, // นำข้อมูลผู้เขียนมาใช้
    })
    const savedPost = await newPost.save()
    res.json(savedPost)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.delete('/delete/:postId', async (req, res) => {
  try {
    const deletedPost = await Post.findByIdAndDelete(req.params.postId)
    if (!deletedPost) {
      return res.status(404).json({ message: 'Post not found' })
    }
    res.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Error deleting post:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

module.exports = router

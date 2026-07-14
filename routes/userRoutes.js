const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/:id  -> profile + their posts
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatar');

    res.json({ user, posts });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   PUT /api/users/:id  -> update own profile (bio, avatar)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.params.id !== req.userId) {
      return res.status(403).json({ message: 'You can only edit your own profile' });
    }
    const { bio, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { bio, avatar },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   POST /api/users/:id/follow  -> toggle follow/unfollow
router.post('/:id/follow', auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.userId) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const target = await User.findById(targetId);
    const me = await User.findById(req.userId);
    if (!target || !me) return res.status(404).json({ message: 'User not found' });

    const isFollowing = target.followers.some((f) => f.toString() === req.userId);

    if (isFollowing) {
      target.followers = target.followers.filter((f) => f.toString() !== req.userId);
      me.following = me.following.filter((f) => f.toString() !== targetId);
    } else {
      target.followers.push(req.userId);
      me.following.push(targetId);
    }

    await target.save();
    await me.save();

    res.json({
      following: !isFollowing,
      followersCount: target.followers.length,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   GET /api/users/:id/followers
router.get('/:id/followers', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      'followers',
      'username avatar bio'
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.followers);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   GET /api/users/:id/following
router.get('/:id/following', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      'following',
      'username avatar bio'
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.following);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;

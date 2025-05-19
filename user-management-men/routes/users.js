const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get all users
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get user by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Create user (admin only)
router.post('/', auth, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (!req.user.roles.includes('admin')) {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    const { name, email, password, roles } = req.body;
    
    // Vérifier si l'utilisateur existe déjà
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }
    
    user = new User({
      name,
      email,
      password,
      roles: roles || ['client']
    });
    
    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update user
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, email, roles } = req.body;
    
    // Construire l'objet user
    const userFields = {};
    if (name) userFields.name = name;
    if (email) userFields.email = email;
    if (roles) userFields.roles = roles;
    
    let user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    
    // Vérifier si l'utilisateur est admin ou s'il modifie son propre profil
    if (!req.user.roles.includes('admin') && req.user.id !== req.params.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: userFields },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete user
router.delete('/:id', auth, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (!req.user.roles.includes('admin')) {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    
    await User.findByIdAndRemove(req.params.id);
    res.json({ msg: 'User removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
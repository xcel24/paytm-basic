const express = require('express');
const zod = require('zod');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

const User = require('../models/User');

const router = express.Router();

const signUpBody = zod.object({
  username: zod.string().email(),
  password: zod.string().min(6),
  firstName: zod.string().max(50),
  lastName: zod.string().max(50),
});

const signInBody = zod.object({
  username: zod.string().email(),
  password: zod.string(),
});

router.post('/signup', async (req, res) => {
  const { success } = signUpBody.safeParse(req.body);

  if (!success) {
    return res.status(411).json({
      message: 'Email already taken / Incorrect inputs',
    });
  }

  const { username, password, firstName, lastName } = req.body;

  const existingUser = await User.findOne({ username });

  if (existingUser) {
    return res.status(411).json({
      message: 'Email already taken / Incorrect inputs',
    });
  }

  const newUser = await User.create({
    username,
    password,
    firstName,
    lastName,
  });

  const userId = newUser._id;

  const token = jwt.sign({ userId }, JWT_SECRET);

  return res.status(200).json({
    message: 'User created successfully',
    token,
  });
});

router.post('/signin', async (req, res) => {
  const { success } = signInBody.safeParse(req.body);

  if (!success) {
    res.status(400).json({ message: 'Bad request' });
  }

  const { username, password } = req.body;

  const user = await User.findOne({ username });

  console.log(user);

  if (!user) return res.status(400).json({ message: 'User not found' });

  if (user.password !== password)
    return res.status(411).json({ message: 'Error while logging in' });

  const userId = user._id;

  const token = jwt.sign({ userId }, JWT_SECRET);

  return res.status(200).json({ token });
});

module.exports = router;

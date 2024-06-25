const express = require('express');
const zod = require('zod');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

const User = require('../models/User');
const authMiddleWare = require('../middleware');
const Account = require('../models/Account');

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

const updateBody = zod.object({
  firstName: zod.string().optional(),
  lastName: zod.string().optional(),
  password: zod.string().optional(),
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

  await Account.create({
    userId,
    balance: 1 + Math.random() * 10000,
  });

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

//route to update the information of the user
router.put('/user', authMiddleWare, async (req, res) => {
  const { success } = updateBody.safeParse(req.body);

  if (!success) {
    return res
      .status(411)
      .json({ message: 'Error while updating information' });
  }

  await User.updateOne({ _id: req.userId }, req.body);

  res.status(200).json({ message: 'Updated successfully' });
});

//route to get the users based on query params
router.get('/user/bulk', authMiddleWare, async (req, res) => {
  const filter = req.query.filter || '';

  const users = await User.find({
    $or: [
      {
        firstName: {
          $regex: filter,
        },
      },
      {
        lastName: {
          $regex: filter,
        },
      },
    ],
  });

  res.status(200).json({
    user: users.map((user) => ({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      _id: user._id,
    })),
  });
});

module.exports = router;

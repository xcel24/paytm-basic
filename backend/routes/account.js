const express = require('express');
const zod = require('zod');
const authMiddleWare = require('../middleware');
const Account = require('../models/Account');
const { default: mongoose } = require('mongoose');

const router = express.Router();

const transferAmountBody = zod.object({
  to: zod.string(),
  amount: zod.number(),
});

router.get('/balance', authMiddleWare, async (req, res) => {
  const userId = req.userId;

  const user = await Account.findOne({ userId });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.status(200).json({ balance: user.balance });
});

router.post('/transfer', authMiddleWare, async (req, res) => {
  const { success } = transferAmountBody.safeParse(req.body);

  if (!success) {
    return res.status(400).json({ message: 'Bad request' });
  }

  const session = await mongoose.startSession();

  session.startTransaction();

  const { to, amount } = req.body;

  //fetch the accounts within the transaction
  const senderAccount = await Account.findOne({ userId: req.userId });

  if (!senderAccount || senderAccount.balance < amount) {
    await session.abortTransaction();
    return res.status(400).json({ message: 'Insufficient balance' });
  }

  const toAccount = await Account.findOne({ userId: to }).session(session);

  if (!toAccount) {
    await session.abortTransaction();
    return res.status(400).json({ message: 'Invalid account' });
  }

  //start the transaction
  await Account.updateOne(
    { userId: req.userId },
    { $inc: { balance: -amount } }
  ).session(session);
  await Account.updateOne(
    { userId: to },
    { $inc: { balance: amount } }
  ).session(session);

  //commit the transaction
  await session.commitTransaction();

  return res.status(200).json({ message: 'Transfer successful' });
});

module.exports = router;

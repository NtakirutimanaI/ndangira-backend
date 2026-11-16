const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const sendToken = (res, statusCode, user) => {
  const token = user.getSignedJwtToken();
  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };
  res.status(statusCode).cookie('token', token, options).json({ success: true, token, data: user });
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role, address, upi } = req.body;
  let user = await User.findOne({ email });
  if (user) {
    const error = new Error('User already exists');
    error.statusCode = 400;
    throw error;
  }
  user = await User.create({ name, email, password, phone, role, address, upi });
  sendToken(res, 201, user);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }
  sendToken(res, 200, user);
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, data: user });
});

module.exports = { register, login, getMe };

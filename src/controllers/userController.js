import { UserModel } from '../models/userModel.js';

export const getUsers = async (req, res, next) => {
  try {
    const users = await UserModel.findAll();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      const err = new Error('Name and email are required');
      err.statusCode = 400;
      throw err;
    }
    const newUser = await UserModel.create({ name, email });
    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    next(error);
  }
};
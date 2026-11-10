import { NotFoundError, ValidationError } from '../errors.js';


const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


export function createUserController({ userModel }) {
  if (!userModel) {
    throw new Error('[createUserController] userModel is required');
  }

  return {
    async list(req, res) {
      const users = await userModel.findAll();
      res.status(200).json({ success: true, data: users });
    },

    async getById(req, res) {
      const id = parseId(req.params.id);

      const user = await userModel.findById(id);
      if (!user) throw new NotFoundError('User');

      res.status(200).json({ success: true, data: user });
    },

    async create(req, res) {
      const { name, email } = req.body ?? {};

      if (!isNonEmptyString(name) || !isNonEmptyString(email)) {
        throw new ValidationError('Name and email are required');
      }
      if (!EMAIL_PATTERN.test(email.trim())) {
        throw new ValidationError('Email address is invalid');
      }

      const user = await userModel.create({ name, email });
      res.status(201).json({ success: true, data: user });
    },
  };
}


function parseId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('Invalid user id');
  }
  return id;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

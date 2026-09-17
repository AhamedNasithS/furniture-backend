const bcrypt = require("bcrypt");
const User = require("../models/User");

const createUser = async (userData) => {
  const { name, email, password, role } = userData;

  if (!name || !email || !password) {
    throw new Error("Name, email and password are required");
  }

  const existingUser = await User.findOne({
    where: {
      email,
    },
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

module.exports = {
  createUser,
};
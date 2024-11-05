const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");
const bcrypt = require("bcrypt");

  const getAll = () => {
    //return User.find({}, "-password")
    return User.find({isCustomer: true, status: true}, "-password")
  }
  const getCustomers = () => {
    //return User.find({}, "-password")
    return User.find({isCustomer: true, status: true}, "-password")
  }
  const getById = (id) => {
    //return User.findOne({email : id}, "-password");
    return User.findById(id, "-password");
  }
  const getByEmail = (email) => {
    return User.findOne({email : email}, "-password");
    //return User.findById(id, "-password");
  }
  const getByDomain= (domain)=> {
    return User.find({domain: domain, isStudent: true, status: true }, "-password")
    //return User.find({isStudent: true, status: true}, "-password")
  }
 
  const create = (data)=> {
    const user = new User(data);
    return user.save();
  }
  const update = (id, data)=> {
    return User.findByIdAndUpdate(id, data, { new: true });
  }
  const deleteUser = (id )=> {
    return User.deleteOne({ _id: id });
  }

  const checkPasswordUser = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
      return false;
    }
    const bool = await bcrypt.compare(password, user.password);
    if (!bool) {
      return false;
    }
    return user._id;
  }


module.exports = {
  getAll,
  getCustomers,
  getById,
  getByEmail,
  getByDomain,
  create,
  update,
  deleteUser,
  checkPasswordUser
};

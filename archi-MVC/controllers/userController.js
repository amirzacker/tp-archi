const NotFoundError = require("../errors/not-found");
const UnauthorizedError = require("../errors/unauthorized");
const jwt = require("jsonwebtoken");
const config = require("../config");
const usersService = require("./services/userService");

  const  getAll = async (req, res, next)=> {
    try {
      const users = await usersService.getAll();
      res.json(users);
    } catch (err) {
      next(err);
    }
  }
  const  getCustomers = async (req, res, next)=> {
    try {
      const users = await usersService.getCustomers();
      res.json(users);
    } catch (err) {
      next(err);
    }
  }
  const  getById = async (req, res, next)=> {
    try {
      const id = req.params.id;
      const user = await usersService.getById(id);
      if (!user) {
        throw new NotFoundError();
      }
      res.json(user);
     
    } catch (err) {
      next(err);
    }
  }
  const getByEmail = async (req, res, next) => {
    try {
      const email = req.params.email;
      const user = await usersService.getByEmail(email);
      if (!user) {
        throw new NotFoundError();
      }
      res.json(user);
     
    } catch (err) {
      next(err);
    }
  }


  const create = async(req, res, next) => {
    try {
      const user = await usersService.create(req.body);
      user.password = undefined;
      req.io.emit("user:create", user);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }
  const update = async (req, res, next)=> {
      try {
       
        if (req.body.id == req.params.id || req.user.isAdmin){
          const id = req.params.id;
          const data = req.body;
          const userModified = await usersService.update(id, data);
          userModified.password = undefined;
          res.json(userModified);
        }
        else {
          return res.status(403).json("You can update only your account!");
        }
      } catch (err) {
        next(err);
      }
   
  }
  const deleteUser = async (req, res, next) => {
    if (req.user.id == req.params.id || req.user.isAdmin) {
      try {
        const id = req.params.id;
        await usersService.delete(id);
        req.io.emit("user:delete", { id });
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    } 
    else {
      return res.status(403).json("You can delete only your account!");
    }
  }
   const login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const userId = await usersService.checkPasswordUser(email, password);
      if (!userId) {
        throw new UnauthorizedError();
      }
      const user = await usersService.getById(userId);
      const token = jwt.sign({ userId }, config.secretJwtToken, {
        expiresIn: "3d",
      });

      res.json({
        token,
        user
      });
    } catch (err) {
      next(err);
    }
  }

 

module.exports = {
  getAll,
  getCustomers,
  getById,
  getByEmail,
  create,
  update,
  deleteUser,
  login
};

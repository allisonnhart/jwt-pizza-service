const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../config.js');
const { asyncHandler } = require('../endpointHelper.js');
const { DB, Role } = require('../database/database.js');
const metrics = require('../metrics.js');
// const { start } = require('repl');
const authRouter = express.Router();
const logger = require('./logger');
const app = express();

app.use(logger.httpLogger);

authRouter.endpoints = [
  {
    method: 'POST',
    path: '/api/auth',
    description: 'Register a new user',
    example: `curl -X POST localhost:3000/api/auth -d '{"name":"pizza diner", "email":"d@jwt.com", "password":"diner"}' -H 'Content-Type: application/json'`,
    response: { user: { id: 2, name: 'pizza diner', email: 'd@jwt.com', roles: [{ role: 'diner' }] }, token: 'tttttt' },
  },
  {
    method: 'PUT',
    path: '/api/auth',
    description: 'Login existing user',
    example: `curl -X PUT localhost:3000/api/auth -d '{"email":"a@jwt.com", "password":"admin"}' -H 'Content-Type: application/json'`,
    response: { user: { id: 1, name: '常用名字', email: 'a@jwt.com', roles: [{ role: 'admin' }] }, token: 'tttttt' },
  },
  {
    method: 'PUT',
    path: '/api/auth/:userId',
    requiresAuth: true,
    description: 'Update user',
    example: `curl -X PUT localhost:3000/api/auth/1 -d '{"email":"a@jwt.com", "password":"admin"}' -H 'Content-Type: application/json' -H 'Authorization: Bearer tttttt'`,
    response: { id: 1, name: '常用名字', email: 'a@jwt.com', roles: [{ role: 'admin' }] },
  },
  {
    method: 'DELETE',
    path: '/api/auth',
    requiresAuth: true,
    description: 'Logout a user',
    example: `curl -X DELETE localhost:3000/api/auth -H 'Authorization: Bearer tttttt'`,
    response: { message: 'logout successful' },
  },
];

async function setAuthUser(req, res, next) {
  const token = readAuthToken(req);
  if (token) {
    try {
      if (await DB.isLoggedIn(token)) {
        // Check the database to make sure the token is valid.
        req.user = jwt.verify(token, config.jwtSecret);
        req.user.isRole = (role) => !!req.user.roles.find((r) => r.role === role);
      }
    } catch {
      metrics.incrementFailureAuth();
      req.user = null;
    }
  }
  next();
}

// Authenticate token
authRouter.authenticateToken = (req, res, next) => {
  if (!req.user) {
    return res.status(401).send({ message: 'unauthorized' });
  }
  next();
};

// register
authRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    metrics.incrementRequests();
    metrics.incrementPostRequests();
    const { name, email, password } = req.body;
    if (!name || !email || !password) {

      metrics.incrementFailureAuth();

      return res.status(400).json({ message: 'name, email, and password are required' });
    }
    try {

      const startTime = Date.now();

      const user = await DB.addUser({ name, email, password, roles: [{ role: Role.Diner }] });
      //console.log(user);

      const elapsedTime = Date.now() - startTime;
      metrics.incrementRequestProcessingTime(elapsedTime);

      const auth = await setAuth(user);

      metrics.userIsLoggedIn();
      metrics.incrementSuccessAuth();

      res.json({ user: user, token: auth });

      // metrics.userIsLoggedIn();
      // metrics.incrementSuccessAuth();
    }
    catch(error) {
      console.error("Error registering user: ", error);
      metrics.incrementFailureAuth();
    }
    // const user = await DB.addUser({ name, email, password, roles: [{ role: Role.Diner }] });
    // const auth = await setAuth(user);
    // res.json({ user: user, token: auth });

    // metrics.userIsLoggedIn();
  })
);

// login
authRouter.put(
  '/',
  asyncHandler(async (req, res) => {
    //console.log("hitting login");
    metrics.incrementRequests();
    metrics.incrementPutRequests();
    const { email, password } = req.body;
    try {

      const startTime = Date.now();

      const user = await DB.getUser(email, password);

      const elapsedTime = Date.now() - startTime;
      metrics.incrementRequestProcessingTime(elapsedTime);

      //console.log("login user, ", user);
      //handle differently
      const auth = await setAuth(user);
      // res.json({ user: user, token: auth });
      //console.log(user);
      //console.log(auth);
      metrics.userIsLoggedIn();
      metrics.incrementSuccessAuth();

      res.json({ user: user, token: auth });
    }
    // const user = await DB.getUser(email, password);
    // const auth = await setAuth(user);
    // res.json({ user: user, token: auth });

    // metrics.userIsLoggedIn();
    // metrics.incrementSuccessAuth();
    catch(error) {
      console.error("Error logging in user: ", error);
      metrics.incrementFailureAuth();
    }
  })
  //login successfully metric 
);

// logout
authRouter.delete(
  '/',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    metrics.incrementRequests();
    metrics.incrementDeleteRequests();
    try {

      const startTime = Date.now();

      clearAuth(req);

      const elapsedTime = Date.now() - startTime;
      metrics.incrementRequestProcessingTime(elapsedTime);

      metrics.userIsLoggedOut();

      res.json({ message: 'logout successful' });
  
      // metrics.userIsLoggedOut();
    }
    // clearAuth(req);
    // res.json({ message: 'logout successful' });

    // metrics.userIsLoggedOut();
    catch(error) {
      console.error("Error logging out user: ", error);
      metrics.incrementFailureAuth();
    }
  })
  //function to notify that a user's logged out
  //logic to determine who logged in, how many, etc.
);

// updateUser
authRouter.put(
  '/:userId',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    metrics.incrementRequests();
    metrics.incrementPutRequests();
    const { email, password } = req.body;
    const userId = Number(req.params.userId);
    const user = req.user;
    if (user.id !== userId && !user.isRole(Role.Admin)) {
      return res.status(403).json({ message: 'unauthorized' });
    }

    const startTime = Date.now();

    const updatedUser = await DB.updateUser(userId, email, password);

    const elapsedTime = Date.now() - startTime;
    metrics.incrementRequestProcessingTime(elapsedTime);

    res.json(updatedUser);
  })
);

async function setAuth(user) {
  const token = jwt.sign(user, config.jwtSecret);
  await DB.loginUser(user.id, token);
  return token;
}

async function clearAuth(req) {
  const token = readAuthToken(req);
  if (token) {
    await DB.logoutUser(token);
  }
}

function readAuthToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    return authHeader.split(' ')[1];
  }
  return null;
}

module.exports = { authRouter, setAuthUser };

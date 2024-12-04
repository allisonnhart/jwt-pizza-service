const express = require('express');
const config = require('../config.js');
const { Role, DB } = require('../database/database.js');
const { authRouter } = require('./authRouter.js');
const { asyncHandler, StatusCodeError } = require('../endpointHelper.js');
const metrics = require('../metrics.js');
const orderRouter = express.Router();

app.use(logger.httpLogger);

orderRouter.endpoints = [
  {
    method: 'GET',
    path: '/api/order/menu',
    description: 'Get the pizza menu',
    example: `curl localhost:3000/api/order/menu`,
    response: [{ id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' }],
  },
  {
    method: 'PUT',
    path: '/api/order/menu',
    requiresAuth: true,
    description: 'Add an item to the menu',
    example: `curl -X PUT localhost:3000/api/order/menu -H 'Content-Type: application/json' -d '{ "title":"Student", "description": "No topping, no sauce, just carbs", "image":"pizza9.png", "price": 0.0001 }'  -H 'Authorization: Bearer tttttt'`,
    response: [{ id: 1, title: 'Student', description: 'No topping, no sauce, just carbs', image: 'pizza9.png', price: 0.0001 }],
  },
  {
    method: 'GET',
    path: '/api/order',
    requiresAuth: true,
    description: 'Get the orders for the authenticated user',
    example: `curl -X GET localhost:3000/api/order  -H 'Authorization: Bearer tttttt'`,
    response: { dinerId: 4, orders: [{ id: 1, franchiseId: 1, storeId: 1, date: '2024-06-05T05:14:40.000Z', items: [{ id: 1, menuId: 1, description: 'Veggie', price: 0.05 }] }], page: 1 },
  },
  {
    method: 'POST',
    path: '/api/order',
    requiresAuth: true,
    description: 'Create a order for the authenticated user',
    example: `curl -X POST localhost:3000/api/order -H 'Content-Type: application/json' -d '{"franchiseId": 1, "storeId":1, "items":[{ "menuId": 1, "description": "Veggie", "price": 0.05 }]}'  -H 'Authorization: Bearer tttttt'`,
    response: { order: { franchiseId: 1, storeId: 1, items: [{ menuId: 1, description: 'Veggie', price: 0.05 }], id: 1 }, jwt: '1111111111' },
  },
];

// getMenu
orderRouter.get(
  '/menu',
  asyncHandler(async (req, res) => {
    metrics.incrementRequests();
    metrics.incrementGetRequests();

    const startTime = Date.now();

    try {
    const menu = await DB.getMenu();

    const elapsedTime = Date.now() - startTime;
    metrics.incrementRequestProcessingTime(elapsedTime);

    // console.log(menu);

    //res.send(await DB.getMenu());
    res.send(menu);
    } catch(error) {
      console.error('get menu error: ', error);
    }
  })
);

// addMenuItem
orderRouter.put(
  '/menu',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    metrics.incrementRequests();
    metrics.incrementPutRequests();
    if (!req.user.isRole(Role.Admin)) {
      throw new StatusCodeError('unable to add menu item', 403);
    }

    const startTime = Date.now();

    const addMenuItemReq = req.body;
    await DB.addMenuItem(addMenuItemReq);

    const elapsedTime = Date.now() - startTime;
    metrics.incrementRequestProcessingTime(elapsedTime);

    res.send(await DB.getMenu());
  })
);

// getOrders
orderRouter.get(
  '/',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    metrics.incrementRequests();
    metrics.incrementGetRequests();

    const startTime = Date.now();

    try {
    const orders = await DB.getOrders(req.user, req.query.page);
    
    const elapsedTime = Date.now() - startTime;
    metrics.incrementRequestProcessingTime(elapsedTime);
    //res.json(await DB.getOrders(req.user, req.query.page));
    res.json(orders);

    } catch(error) {
      console.error('Get orders error: ', error);
    }
  })
);

// createOrder
orderRouter.post(
  '/',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    console.log("made it to post route for createOrder");
    metrics.incrementRequests();
    metrics.incrementPostRequests();
    const orderReq = req.body;
    console.log("before adding an order");
    const order = await DB.addDinerOrder(req.user, orderReq);
    console.log(order);
    //start a timer here
    const startTime = Date.now();
    let r;
    let j;
    try {
      r = await fetch(`${config.factory.url}/api/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${config.factory.apiKey}` },
        body: JSON.stringify({ diner: { id: req.user.id, name: req.user.name, email: req.user.email }, order }),
      });

      j = await r.json();
    } catch(error) {
      console.log(error);
    }

    // const j = await r.json();
    const elapsedTime = Date.now() - startTime;

    console.log('elapsed time: ', elapsedTime);
    metrics.incrementRequestProcessingTime(elapsedTime);
    metrics.incrementPizzaRequestProcessingTime(elapsedTime);
    // console.log('Request processed in ${elapsedTime}ms');
    //stop timer 
    //that's my latency i wanna keep track of
    //send regardless of whether r is ok or not
    if (r.ok) {
      console.log('r.ok log');
      // res.send({ order, jwt: j.jwt, reportUrl: j.reportUrl });

      metrics.incrementCreationSuccesses();
      metrics.incrementPizzasSold();
      const currentRevenue = orderReq.items.reduce((total, item) => total + item.price, 0);
      // console.log("Order object: ", order);
      // console.log('order items: ', orderReq.items);
      metrics.currentPizzaRevenue(currentRevenue);
      metrics.incrementTotalRevenue(currentRevenue);
      res.send({ order, jwt: j.jwt, reportUrl: j.reportUrl });
    } else {
      console.log('r is not okay log');
      metrics.incrementCreationFailures();
      res.status(500).send({ message: 'Failed to fulfill order at factory', reportUrl: j.reportUrl });
      // metrics.incrementCreationFailures();
    }
  })
  //messing w this to add in to determine how many pizzas sold, total rev, creation latency, and if there are any creation failures
);

module.exports = orderRouter;

//start timer for when order gets sent off and stop when results come back
//same kinda thing for request




//data is being sent to grafana and grafana is updating
//however, after giving me the total revenue and logging the user out,
  //it gives me a bunch of erors, all saying 'Failed to push metrics data to Grafana'

// is it because my premium trial ended while I was working on this?
//am not super sure if that's the way to understand things here

//or what i could've possibly screwed up in my metrics and/or router functions 

//also, my cpu isn't updating data to grafana and i do not know why
  //like i think i changed the return but the logic given to us should still be the same
//kinda confused because the memory one is working fine in the various places
//it's being used in metrics.js, so idk why cpu is acting different


//there are no pizza creation failures happening in my script right now, is that something
  //i should try and test or should i just not worry about it

//also I was trying to mess with user authentication failures
  //and it only sends one bad user
//i have code in my script to send out an invalid user,
//but it's not registering that and i wonder why the server isn't picking that up/
  //how, if it's not picking anything up, it managed to have one invalid user
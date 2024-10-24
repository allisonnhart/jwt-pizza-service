const request = require('supertest');
const app = require('../service');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;

const firstTestPizza = { "title":"Pepperoni", "description": "Spicy treat", "image":"pizza2.png", "price": 0.0042 };

const { Role, DB } = require('../database/database.js');
//const database = require('../database/database.js');

beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
  const registerRes = await request(app).post('/api/auth').send(testUser);
  testUserAuthToken = registerRes.body.token;
  expect(testUserAuthToken).toBe(registerRes.body.token);

}, 10000);

test('login', async () => {
  const loginRes = await request(app).put('/api/auth').send(testUser);
  expect(loginRes.status).toBe(200);
  expect(loginRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);

  const { password, ...user } = { ...testUser, roles: [{ role: 'diner' }] };
  expect(password).toBe('a');
  expect(loginRes.body.user).toMatchObject(user);
});

function randomName() {
    return Math.random().toString(36).substring(2, 12);
  }

if (process.env.VSCODE_INSPECTOR_OPTIONS) {
    jest.setTimeout(60 * 1000 * 5); // 5 minutes
}

async function createAdminUser() {
  let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
  user.name = randomName();
  user.email = user.name + '@admin.com';

  await DB.addUser(user);

  user.password = 'toomanysecrets';
  return user;
}

async function createFranchise(adminUser, adminAuthToken) {

  const franchise = await request(app).post('/api/franchise').set("Authorization", `Bearer ${adminAuthToken}`).send({ name: adminUser.name, admins: [{email:adminUser.email}]});

  return franchise;
}


// test('getting menu', async () => {

//   const getMenuRes = await request(app).get('/api/order/menu');
//   expect(getMenuRes.status).toBe(200);

//   const menu = await database.DB.getMenu();
//   let menuLength = menu.length;
//   expect(menu.length).toBe(menuLength);

//   const lastItem = menu[menu.length - 1]; 
//   expect(lastItem.title).toBe(firstTestPizza.title);
//   expect(lastItem.image).toBe(firstTestPizza.image);
//   expect(lastItem.price).toBe(firstTestPizza.price);

// });

test('adding to menu when admin', async () => {

  const adminUser = await createAdminUser();

  const loginRes = await request(app).put('/api/auth').send(adminUser);
  expect(loginRes.status).toBe(200);
  const adminAuthToken = loginRes.body.token;


  const addingToMenuRes = await request(app).put('/api/order/menu').set('Authorization', `Bearer ${adminAuthToken}`).send(firstTestPizza);
  expect(addingToMenuRes.status).toBe(200);

});

test('adding to menu when not admin', async () => {

  const addingToMenuRes = await request(app).put('/api/order/menu').set('Authorization', `Bearer ${testUserAuthToken}`).send(firstTestPizza);
  expect(addingToMenuRes.status).toBe(403);
  expect(addingToMenuRes.body.message).toBe('unable to add menu item');

});

test('updating user', async () => {
  const secondTestUser = { name: 'pizza diner2', email: 'reg2@test.com', password: 'b' };

  const loginRes = await request(app).post('/api/auth').send(secondTestUser);
  expect(loginRes.status).toBe(200);
  let secondTestUserAuthToken = loginRes.body.token;

  const userID = loginRes.body.user.id || null;
  expect(userID).not.toBeNull();

  const updatedUserData = { email: 'newreg2@test.com', password: 'newb' };

  const updateRes = await request(app).put(`/api/auth/${userID}`).set('Authorization', `Bearer ${secondTestUserAuthToken}`).send(updatedUserData);
  expect(updateRes.status).toBe(200);
  
  expect(updateRes.body.email).toBe(updatedUserData.email);
  expect(updateRes.body.password).not.toBe(updatedUserData.password);

});

test('incorrectly updating user', async () => {
  const badUpdateAdmin = await createAdminUser();
  const loginRes = await request(app).post('/api/auth').send(badUpdateAdmin);
  expect(loginRes.status).toBe(200);
  let badUpdateAdminAuthToken = loginRes.body.token;

  const userID = 27;
  expect(userID).not.toBeNull();

  const updatedUserData = { email: 'newreg2@test.com', password: 'newb' };

  const updateRes = await request(app).put(`/api/auth/${userID}`).set('Authorization', `Bearer ${badUpdateAdminAuthToken}`).send(updatedUserData);
  expect(updateRes.status).toBe(403);
  expect(updateRes.body.message).toBe('unauthorized');

});

test('invalid user registration', async () => {

  const invalidUser = { name: 'evil pizza diner', email: 'evilReg@test.com', password: null };
  
  invalidUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
  const registerRes = await request(app).post('/api/auth').send(invalidUser);

  expect(registerRes.status).toBe(400);
  expect(registerRes.body.message).toBe('name, email, and password are required');

});

test('logging out a user', async () => {

  const adminUser = await createAdminUser();

  const loginRes = await request(app).put('/api/auth').send(adminUser);
  expect(loginRes.status).toBe(200);
  const adminAuthToken = loginRes.body.token;


  const deleteUserRes = await request(app).delete(`/api/auth`).set('Authorization', `Bearer ${adminAuthToken}`);
  expect(deleteUserRes.status).toBe(200);

});

test('creating a franchise', async() => {

  const adminUser = await createAdminUser();

  const loginRes = await request(app).put('/api/auth').send(adminUser);
  expect(loginRes.status).toBe(200);
  const adminAuthToken = loginRes.body.token;

  const franchise = await createFranchise(adminUser, adminAuthToken);

  expect(franchise.body.admins).not.toBeUndefined();

  expect(Array.isArray(franchise.body.admins)).toBe(true);

});

test('error in creating a franchise', async() => {

  const loginRes = await request(app).put('/api/auth').send(testUser);
  expect(loginRes.status).toBe(200);
  const testUserAuthToken = loginRes.body.token;

  const franchise = await createFranchise(testUser, testUserAuthToken);

  expect(franchise.status).toBe(403);
  expect(franchise.body.message).toBe('unable to create a franchise');

});

test('getting user franchises', async () => {

  const adminUser = await createAdminUser();

  const loginRes = await request(app).put('/api/auth').send(adminUser);
  expect(loginRes.status).toBe(200);
  const adminAuthToken = loginRes.body.token;

  const userID = loginRes.body.user.id || null;
  expect(userID).not.toBeNull();

  const franchise = await createFranchise(adminUser, adminAuthToken);

  expect(franchise.body.admins).not.toBeUndefined();

  const getFranchisesRes = await request(app).get(`/api/franchise/${userID}`).set('Authorization', `Bearer ${adminAuthToken}`).send(adminUser);
  expect(getFranchisesRes.status).toBe(200);
  
  expect(getFranchisesRes.body.name).toBe((await franchise).name);

});

test('deleting user franchises', async () => {

  const adminUser = await createAdminUser();

  const loginRes = await request(app).put('/api/auth').send(adminUser);
  expect(loginRes.status).toBe(200);
  const adminAuthToken = loginRes.body.token;

  const userID = loginRes.body.user.id || null;
  expect(userID).not.toBeNull();

  const franchise = await createFranchise(adminUser, adminAuthToken);

  expect(franchise.body.admins).not.toBeUndefined();

  const deleteFranchisesRes = await request(app).delete(`/api/franchise/${userID}`).set('Authorization', `Bearer ${adminAuthToken}`);
  expect(deleteFranchisesRes.status).toBe(200);

});

test('error in deleting a franchise', async() => {
  const adminUser = await createAdminUser();
  const loginRes = await request(app).put('/api/auth').send(adminUser);
  expect(loginRes.status).toBe(200);

  const userID = loginRes.body.user.id || null;
  expect(userID).not.toBeNull();

  const deleteFranchisesRes = await request(app).delete(`/api/franchise/${userID}`).set('Authorization', `Bearer ${testUserAuthToken}`);

  expect(deleteFranchisesRes.status).toBe(403);
  expect(deleteFranchisesRes.body.message).toBe('unable to delete a franchise');

});

test('creating a store', async() => {

  const adminUser = await createAdminUser();

  const loginRes = await request(app).put('/api/auth').send(adminUser);
  expect(loginRes.status).toBe(200);
  const adminAuthToken = loginRes.body.token;

  const franchise = await createFranchise(adminUser, adminAuthToken);
  const franchiseID = franchise.body.id || null;
  expect(franchiseID).not.toBeNull();

  const store = await request(app).post(`/api/franchise/${franchiseID}/store`).set("Authorization", `Bearer ${adminAuthToken}`).send({franchiseId: franchiseID, name:randomName()});
  expect(store.status).toBe(200);

});

test('deleting a store', async () => {

  const adminUser = await createAdminUser();

  const loginRes = await request(app).put('/api/auth').send(adminUser);
  expect(loginRes.status).toBe(200);
  const adminAuthToken = loginRes.body.token;

  const franchise = await createFranchise(adminUser, adminAuthToken);
  const franchiseID = franchise.body.id || null;
  expect(franchiseID).not.toBeNull();

  const store = await request(app).post(`/api/franchise/${franchiseID}/store`).set("Authorization", `Bearer ${adminAuthToken}`).send({franchiseId: franchiseID, name:randomName()});
  expect(store.status).toBe(200);

  const storeID = store.body.id || null;
  expect(storeID).not.toBeNull();

  const deleteStoreRes = await request(app).delete(`/api/franchise/${franchiseID}/store/${storeID}`).set('Authorization', `Bearer ${adminAuthToken}`);
  expect(deleteStoreRes.status).toBe(200);

});
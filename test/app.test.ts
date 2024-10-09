import request from 'supertest';
import app from '../src/app';

describe('Company API', () => {
  let companyId: string;

  it('should create a new company', async () => {
    const response = await request(app)
      .post('/api/companies')
      .send({name: 'Test Company', address: '123 Test Street'});
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('_id');
    companyId = response.body._id;
  });

  it('should fetch all companies', async () => {
    const response = await request(app).get('/api/companies');
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
  });
});

describe('Role API', () => {
  let roleId: string;

  it('should create a new role', async () => {
    const response = await request(app)
      .post('/api/roles')
      .send({name: 'Admin'});
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('_id');
    roleId = response.body._id;
  });

  it('should fetch all roles', async () => {
    const response = await request(app).get('/api/roles');
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
  });
});

describe('User API', () => {
  let userId: string;

  it('should create a new user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        name: 'John Doe',
        email: `john${Date.now()}@example.com`,
        password: 'password',
        companyId: 'companyId',
        roleId: 'roleId',
      });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('_id');
    userId = response.body._id;
  });

  it('should fetch all users', async () => {
    const response = await request(app).get('/api/users');
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
  });
});

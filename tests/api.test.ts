import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/db';
import { hashPassword } from '../src/utils/auth';

let adminToken: string;
let analystToken: string;
let viewerToken: string;
let testRecordId: string;

beforeAll(async () => {
  await prisma.record.deleteMany();
  await prisma.user.deleteMany();

  const hash = await hashPassword('testpass123');

  await prisma.user.create({
    data: { email: 'testadmin@test.com', password: hash, role: 'ADMIN', status: 'ACTIVE' },
  });
  await prisma.user.create({
    data: { email: 'testanalyst@test.com', password: hash, role: 'ANALYST', status: 'ACTIVE' },
  });
  await prisma.user.create({
    data: { email: 'testviewer@test.com', password: hash, role: 'VIEWER', status: 'ACTIVE' },
  });
  await prisma.user.create({
    data: { email: 'testinactive@test.com', password: hash, role: 'VIEWER', status: 'INACTIVE' },
  });

  const adminRes = await request(app).post('/api/auth/login').send({ email: 'testadmin@test.com', password: 'testpass123' });
  adminToken = adminRes.body.token;

  const analystRes = await request(app).post('/api/auth/login').send({ email: 'testanalyst@test.com', password: 'testpass123' });
  analystToken = analystRes.body.token;

  const viewerRes = await request(app).post('/api/auth/login').send({ email: 'testviewer@test.com', password: 'testpass123' });
  viewerToken = viewerRes.body.token;
});

afterAll(async () => {
  await prisma.record.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe('Auth Endpoints', () => {
  test('POST /api/auth/register creates user with VIEWER role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'newreg@test.com', password: 'pass123' });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('User registered successfully');
  });

  test('POST /api/auth/register rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'testadmin@test.com', password: 'pass123' });

    expect(res.status).toBe(409);
  });

  test('POST /api/auth/register validates input', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: '12' });

    expect(res.status).toBe(400);
    expect(res.body.details).toBeDefined();
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  test('POST /api/auth/login returns JWT for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testadmin@test.com', password: 'testpass123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.role).toBe('ADMIN');
  });

  test('POST /api/auth/login rejects inactive user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testinactive@test.com', password: 'testpass123' });

    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me returns current user profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('testadmin@test.com');
    expect(res.body.user.role).toBe('ADMIN');
  });

  test('GET /api/auth/me rejects unauthenticated request', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('RBAC - Access Control', () => {
  test('VIEWER cannot access records', async () => {
    const res = await request(app)
      .get('/api/records')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
  });

  test('VIEWER cannot create records', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ amount: 100, type: 'INCOME', category: 'Test', date: '2026-01-01T00:00:00.000Z' });

    expect(res.status).toBe(403);
  });

  test('VIEWER can access dashboard', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
  });

  test('ANALYST can read records', async () => {
    const res = await request(app)
      .get('/api/records')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
  });

  test('ANALYST cannot create records', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({ amount: 100, type: 'INCOME', category: 'Test', date: '2026-01-01T00:00:00.000Z' });

    expect(res.status).toBe(403);
  });

  test('ANALYST cannot manage users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(403);
  });
});

describe('Records CRUD', () => {
  test('ADMIN can create a record', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 5000, type: 'INCOME', category: 'Salary', date: '2026-03-01T00:00:00.000Z', notes: 'March salary payment' });

    expect(res.status).toBe(201);
    expect(res.body.record.amount).toBe(5000);
    testRecordId = res.body.record.id;
  });

  test('rejects invalid record data', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: -100, type: 'WRONG', category: '' });

    expect(res.status).toBe(400);
    expect(res.body.details).toBeDefined();
  });

  test('ADMIN can list records with pagination', async () => {
    await request(app).post('/api/records').set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 1200, type: 'EXPENSE', category: 'Rent', date: '2026-03-05T00:00:00.000Z' });
    await request(app).post('/api/records').set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 300, type: 'EXPENSE', category: 'Groceries', date: '2026-03-10T00:00:00.000Z', notes: 'Weekly groceries' });

    const res = await request(app)
      .get('/api/records?page=1&limit=2')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.records.length).toBe(2);
    expect(res.body.pagination.totalCount).toBe(3);
    expect(res.body.pagination.totalPages).toBe(2);
  });

  test('can filter records by type', async () => {
    const res = await request(app)
      .get('/api/records?type=INCOME')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    res.body.records.forEach((r: any) => expect(r.type).toBe('INCOME'));
  });

  test('can search records by keyword', async () => {
    const res = await request(app)
      .get('/api/records?search=salary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.records.length).toBeGreaterThan(0);
  });

  test('ADMIN can update a record', async () => {
    const res = await request(app)
      .patch(`/api/records/${testRecordId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 5500 });

    expect(res.status).toBe(200);
    expect(res.body.record.amount).toBe(5500);
  });

  test('update non-existent record returns 404', async () => {
    const res = await request(app)
      .patch('/api/records/nonexistent-id')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 99 });

    expect(res.status).toBe(404);
  });

  test('ADMIN can soft-delete a record', async () => {
    const res = await request(app)
      .delete(`/api/records/${testRecordId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    const getRes = await request(app)
      .get(`/api/records/${testRecordId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getRes.status).toBe(404);
  });

  test('delete non-existent record returns 404', async () => {
    const res = await request(app)
      .delete('/api/records/nonexistent-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

describe('Dashboard & Analytics', () => {
  test('GET /api/dashboard/summary returns aggregated data', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.totalIncome).toBe('number');
    expect(typeof res.body.totalExpenses).toBe('number');
    expect(typeof res.body.netBalance).toBe('number');
    expect(res.body.categoryBreakdown).toBeDefined();
    expect(Array.isArray(res.body.categoryBreakdown)).toBe(true);
  });

  test('GET /api/dashboard/recent returns latest transactions', async () => {
    const res = await request(app)
      .get('/api/dashboard/recent')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.recentActivity)).toBe(true);
  });

  test('GET /api/dashboard/trends returns monthly breakdown', async () => {
    const res = await request(app)
      .get('/api/dashboard/trends')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.trends)).toBe(true);
    if (res.body.trends.length > 0) {
      expect(res.body.trends[0]).toHaveProperty('month');
      expect(res.body.trends[0]).toHaveProperty('income');
      expect(res.body.trends[0]).toHaveProperty('expense');
      expect(res.body.trends[0]).toHaveProperty('net');
    }
  });
});

describe('User Management (ADMIN)', () => {
  test('ADMIN can list users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeGreaterThan(0);
    expect(res.body.total).toBeDefined();
  });

  test('ADMIN can get user by ID', async () => {
    const listRes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    const userId = listRes.body.users[0].id;

    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(userId);
  });

  test('ADMIN can update user role', async () => {
    const listRes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    const viewerUser = listRes.body.users.find((u: any) => u.role === 'VIEWER');

    const res = await request(app)
      .patch(`/api/users/${viewerUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'ANALYST' });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('ANALYST');
  });
});

describe('Error Handling', () => {
  test('unknown endpoint returns 404', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Endpoint not found');
  });

  test('missing auth token returns 401', async () => {
    const res = await request(app).get('/api/records');
    expect(res.status).toBe(401);
  });

  test('invalid auth token returns 401', async () => {
    const res = await request(app)
      .get('/api/records')
      .set('Authorization', 'Bearer invalid.token.here');

    expect(res.status).toBe(401);
  });
});

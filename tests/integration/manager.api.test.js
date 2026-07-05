const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const {
  request,
  app,
  isDatabaseReady,
  loginManager,
  loginAdmin,
  pool,
} = require('../helpers/http');

describe('Manager API integration', { skip: process.env.SKIP_INTEGRATION_TESTS === 'true' }, () => {
  /** @type {boolean} */
  let dbReady = false;
  /** @type {string} */
  let managerToken = '';
  /** @type {string} */
  let adminToken = '';
  /** @type {string} */
  let otherManagerEventUuid = '';

  before(async () => {
    dbReady = await isDatabaseReady();
    if (!dbReady) return;

    const managerLogin = await loginManager();
    assert.equal(managerLogin.status, 200);
    managerToken = managerLogin.body.data.token;

    const adminLogin = await loginAdmin();
    assert.equal(adminLogin.status, 200);
    adminToken = adminLogin.body.data.token;

    const [rows] = await pool.execute(
      `SELECT uuid FROM events
       WHERE uuid = 'f3000000-0000-4000-8000-000000000002' AND deleted_at IS NULL
       LIMIT 1`
    );
    otherManagerEventUuid = rows[0]?.uuid || '';
  });

  after(async () => {
    await pool.end();
  });

  it('skips when database is not migrated/seeded', () => {
    if (!dbReady) {
      console.warn('Skipping manager integration tests — run npm run db:setup first');
    }
    assert.ok(true);
  });

  it('POST /api/manager/auth/login returns manager token and staffId', async (t) => {
    if (!dbReady) return t.skip();

    const res = await loginManager();
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.role, 'manager');
    assert.ok(res.body.data.user.staffId);
  });

  it('rejects super_admin login on manager auth endpoint', async (t) => {
    if (!dbReady) return t.skip();

    const res = await request(app)
      .post('/api/manager/auth/login')
      .send({ identifier: 'admin@justtap.com', password: 'admin123' });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('GET /api/manager/auth/me returns manager profile', async (t) => {
    if (!dbReady) return t.skip();

    const res = await request(app)
      .get('/api/manager/auth/me')
      .set('Authorization', `Bearer ${managerToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.role, 'manager');
    assert.equal(res.body.data.user.email, 'manager@justtap.com');
  });

  it('manager token is forbidden on admin dashboard', async (t) => {
    if (!dbReady) return t.skip();

    const res = await request(app)
      .get('/api/v1/dashboard/home')
      .set('Authorization', `Bearer ${managerToken}`);

    assert.equal(res.status, 403);
  });

  it('admin token is forbidden on manager dashboard', async (t) => {
    if (!dbReady) return t.skip();

    const res = await request(app)
      .get('/api/manager/dashboard/home')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 403);
  });

  it('POST /api/v1/managers creates event manager from allocate member form', async (t) => {
    if (!dbReady) return t.skip();

    const res = await request(app)
      .post('/api/v1/managers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        memberName: 'Julian Reed',
        designation: 'Content Strategist',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, 'Manager created');
    assert.equal(res.body.data.name, 'Julian Reed');
    assert.equal(res.body.data.designation, 'Content Strategist');
    assert.equal(res.body.data.role, 'event_manager');
    assert.equal(res.body.data.isActive, true);
  });

  it('GET /api/manager/dashboard/home returns scoped stats', async (t) => {
    if (!dbReady) return t.skip();

    const res = await request(app)
      .get('/api/manager/dashboard/home')
      .set('Authorization', `Bearer ${managerToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(typeof res.body.data.todayEvents === 'number');
    assert.ok(typeof res.body.data.upcomingEvents === 'number');
    assert.equal(res.body.data.pendingInquiries, undefined);
  });

  it('GET /api/manager/events lists only allocated events for manager 1', async (t) => {
    if (!dbReady) return t.skip();

    const res = await request(app)
      .get('/api/manager/events')
      .set('Authorization', `Bearer ${managerToken}`);

    assert.equal(res.status, 200);
    const items = res.body.data.items || [];
    assert.ok(items.length >= 1);
    for (const event of items) {
      assert.notEqual(event.uuid, otherManagerEventUuid);
    }
  });

  it('GET /api/manager/events/:id denies access to another manager event', async (t) => {
    if (!dbReady || !otherManagerEventUuid) return t.skip();

    const res = await request(app)
      .get(`/api/manager/events/${otherManagerEventUuid}`)
      .set('Authorization', `Bearer ${managerToken}`);

    assert.equal(res.status, 404);
  });

  it('GET /api/manager/events/today returns today events', async (t) => {
    if (!dbReady) return t.skip();

    const res = await request(app)
      .get('/api/manager/events/today')
      .set('Authorization', `Bearer ${managerToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
  });

  it('GET /api/manager/events/calendar supports monthly view', async (t) => {
    if (!dbReady) return t.skip();

    const res = await request(app)
      .get('/api/manager/events/calendar')
      .query({ year: 2026, month: 7 })
      .set('Authorization', `Bearer ${managerToken}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.data.calendar);
    assert.equal(res.body.data.view, 'month');
  });

  it('GET /api/manager/menu/categories returns catalog', async (t) => {
    if (!dbReady) return t.skip();

    const res = await request(app)
      .get('/api/manager/menu/categories')
      .set('Authorization', `Bearer ${managerToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data.items));
  });

  it('GET /api/manager/tasks lists event tasks for allocated events', async (t) => {
    if (!dbReady) return t.skip();

    const res = await request(app)
      .get('/api/manager/tasks')
      .set('Authorization', `Bearer ${managerToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data.items));
  });

  it('GET /api/manager/events/:eventId/tables returns assign table list for manager event', async (t) => {
    if (!dbReady) return t.skip();

    const eventsRes = await request(app)
      .get('/api/manager/events')
      .set('Authorization', `Bearer ${managerToken}`);

    assert.equal(eventsRes.status, 200);
    const eventUuid = eventsRes.body.data.items?.[0]?.uuid;
    if (!eventUuid) return t.skip();

    const res = await request(app)
      .get(`/api/manager/events/${eventUuid}/tables`)
      .set('Authorization', `Bearer ${managerToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    if (res.body.data.length) {
      assert.ok('tableNumber' in res.body.data[0]);
      assert.ok('allocationType' in res.body.data[0]);
      assert.ok('isAssigned' in res.body.data[0]);
    }
  });

  it('GET /api/manager/events/:eventId/tables denies access to another manager event', async (t) => {
    if (!dbReady || !otherManagerEventUuid) return t.skip();

    const res = await request(app)
      .get(`/api/manager/events/${otherManagerEventUuid}/tables`)
      .set('Authorization', `Bearer ${managerToken}`);

    assert.equal(res.status, 404);
  });

  it('GET /api/manager/feedback lists feedback for allocated events', async (t) => {
    if (!dbReady) return t.skip();

    const res = await request(app)
      .get('/api/manager/feedback')
      .set('Authorization', `Bearer ${managerToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data.items));
  });

  it('GET /api/manager/events/:eventId/all-tasks returns All Tasks screen payload', async (t) => {
    if (!dbReady) return t.skip();

    const eventsRes = await request(app)
      .get('/api/manager/events')
      .set('Authorization', `Bearer ${managerToken}`);

    const eventUuid = eventsRes.body.data.items?.[0]?.uuid;
    if (!eventUuid) return t.skip();

    const res = await request(app)
      .get(`/api/manager/events/${eventUuid}/all-tasks`)
      .set('Authorization', `Bearer ${managerToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.tasks));
    assert.ok(res.body.data.tasks.length >= 7);
    const keys = res.body.data.tasks.map((task) => task.key);
    assert.ok(keys.includes('reporting_on_ground_time'));
    assert.ok(keys.includes('gain_followers'));
    assert.ok(keys.includes('billing_tracking'));
  });

  it('PATCH /api/manager/events/:eventId/all-tasks saves progress', async (t) => {
    if (!dbReady) return t.skip();

    const eventsRes = await request(app)
      .get('/api/manager/events')
      .set('Authorization', `Bearer ${managerToken}`);

    const eventUuid = eventsRes.body.data.items?.[0]?.uuid;
    if (!eventUuid) return t.skip();

    const res = await request(app)
      .patch(`/api/manager/events/${eventUuid}/all-tasks`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        followersAchievedCount: 22,
        activeSessionRecording: true,
        amountCollected: 10000,
      });

    assert.equal(res.status, 200);
    const followersTask = res.body.data.tasks.find((task) => task.key === 'gain_followers');
    assert.equal(followersTask.achievedCount, 22);
  });

  it('GET /api/manager/events/:eventId/orders/summary returns order stats', async (t) => {
    if (!dbReady) return t.skip();

    const eventsRes = await request(app)
      .get('/api/manager/events')
      .set('Authorization', `Bearer ${managerToken}`);

    const eventUuid = eventsRes.body.data.items?.[0]?.uuid;
    if (!eventUuid) return t.skip();

    const res = await request(app)
      .get(`/api/manager/events/${eventUuid}/orders/summary`)
      .set('Authorization', `Bearer ${managerToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok('totalOrder' in res.body.data);
    assert.ok('totalDelivered' in res.body.data);
  });

  it('GET /api/manager/events/:eventId/orders/tables returns table list', async (t) => {
    if (!dbReady) return t.skip();

    const eventsRes = await request(app)
      .get('/api/manager/events')
      .set('Authorization', `Bearer ${managerToken}`);

    const eventUuid = eventsRes.body.data.items?.[0]?.uuid;
    if (!eventUuid) return t.skip();

    const res = await request(app)
      .get(`/api/manager/events/${eventUuid}/orders/tables`)
      .set('Authorization', `Bearer ${managerToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    if (res.body.data.length) {
      assert.ok('tableNumber' in res.body.data[0]);
      assert.ok('waiterName' in res.body.data[0]);
    }
  });

  it('GET /api/manager/events/:eventId/orders/tables/:tableNumber returns table order detail', async (t) => {
    if (!dbReady) return t.skip();

    const eventsRes = await request(app)
      .get('/api/manager/events')
      .set('Authorization', `Bearer ${managerToken}`);

    const eventUuid = eventsRes.body.data.items?.[0]?.uuid;
    if (!eventUuid) return t.skip();

    const res = await request(app)
      .get(`/api/manager/events/${eventUuid}/orders/tables/1`)
      .set('Authorization', `Bearer ${managerToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.tableNumber, 1);
    assert.ok(Array.isArray(res.body.data.items));
  });

  it('GET /api/manager/events/:eventId/orders/report returns order report', async (t) => {
    if (!dbReady) return t.skip();

    const eventsRes = await request(app)
      .get('/api/manager/events')
      .set('Authorization', `Bearer ${managerToken}`);

    const eventUuid = eventsRes.body.data.items?.[0]?.uuid;
    if (!eventUuid) return t.skip();

    const res = await request(app)
      .get(`/api/manager/events/${eventUuid}/orders/report`)
      .set('Authorization', `Bearer ${managerToken}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.data.summary);
    assert.ok(Array.isArray(res.body.data.tables));
  });

  it('GET /api/manager/orders/items/:lineItemId returns item details', async (t) => {
    if (!dbReady) return t.skip();

    const [rows] = await pool.execute(
      `SELECT oli.uuid
       FROM order_line_items oli
       JOIN order_tables ot ON ot.id = oli.order_table_id
       JOIN event_orders eo ON eo.id = ot.event_order_id
       JOIN events e ON e.id = eo.event_id
       WHERE e.assigned_manager_id = 1 AND oli.deleted_at IS NULL
       LIMIT 1`
    );
    const lineItemUuid = rows[0]?.uuid;
    if (!lineItemUuid) return t.skip();

    const res = await request(app)
      .get(`/api/manager/orders/items/${lineItemUuid}`)
      .set('Authorization', `Bearer ${managerToken}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.data.name);
    assert.ok(Array.isArray(res.body.data.history));
  });

  it('GET /api/manager/events/:eventId/orders/summary denies access to another manager event', async (t) => {
    if (!dbReady || !otherManagerEventUuid) return t.skip();

    const res = await request(app)
      .get(`/api/manager/events/${otherManagerEventUuid}/orders/summary`)
      .set('Authorization', `Bearer ${managerToken}`);

    assert.equal(res.status, 404);
  });

  it('GET /api/manager/inquiries/stats returns inquiry stats', async (t) => {
    if (!dbReady) return t.skip();

    const res = await request(app)
      .get('/api/manager/inquiries/stats')
      .set('Authorization', `Bearer ${managerToken}`);

    assert.equal(res.status, 200);
    assert.ok('pendingCount' in res.body.data);
  });

  it('GET /api/manager/inquiries returns inquiry list', async (t) => {
    if (!dbReady) return t.skip();

    const res = await request(app)
      .get('/api/manager/inquiries')
      .set('Authorization', `Bearer ${managerToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data.items));
  });

  it('GET /api/manager/staff returns staff list', async (t) => {
    if (!dbReady) return t.skip();

    const res = await request(app)
      .get('/api/manager/staff')
      .set('Authorization', `Bearer ${managerToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data.items));
  });

  it('GET /api/manager/managers returns manager list for select', async (t) => {
    if (!dbReady) return t.skip();

    const res = await request(app)
      .get('/api/manager/managers?forSelect=true')
      .set('Authorization', `Bearer ${managerToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data.items));
  });

  it('GET /api/manager/content/about returns about content', async (t) => {
    if (!dbReady) return t.skip();

    const res = await request(app)
      .get('/api/manager/content/about')
      .set('Authorization', `Bearer ${managerToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  it('GET /api/manager/menu/package-features returns package features', async (t) => {
    if (!dbReady) return t.skip();

    const res = await request(app)
      .get('/api/manager/menu/package-features')
      .set('Authorization', `Bearer ${managerToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data.features));
    assert.ok(Array.isArray(res.body.data.packages));
  });

  it('GET /api/manager/analytics/package-revenue returns package revenue', async (t) => {
    if (!dbReady) return t.skip();

    const res = await request(app)
      .get('/api/manager/analytics/package-revenue')
      .set('Authorization', `Bearer ${managerToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data.packages));
    assert.ok('totalRevenue' in res.body.data);
  });

  it('GET /api/manager/events/:eventId/billing returns billing', async (t) => {
    if (!dbReady) return t.skip();

    const eventsRes = await request(app)
      .get('/api/manager/events')
      .set('Authorization', `Bearer ${managerToken}`);

    const eventUuid = eventsRes.body.data.items?.[0]?.uuid;
    if (!eventUuid) return t.skip();

    const res = await request(app)
      .get(`/api/manager/events/${eventUuid}/billing`)
      .set('Authorization', `Bearer ${managerToken}`);

    assert.equal(res.status, 200);
    assert.ok('estimate' in res.body.data);
  });
});

import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- Starting Integration Tests for Module 2: Dashboard & News ---');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string, extraInfo = '') => {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${extraInfo}`);
      failed++;
    }
  };

  try {
    // 1. Health check
    const healthRes = await axios.get(`${API_BASE}/health`);
    assert(healthRes.status === 200, 'Health endpoint responds with 200');

    // 2. SuperAdmin Login to obtain elevated clearance
    const superAdminLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      identifier: 'superadmin@codecircle.com',
      password: 'SuperAdmin@2026!',
    });
    assert(superAdminLoginRes.data.success === true, 'SuperAdmin login succeeds');
    const adminToken = superAdminLoginRes.data.token;
    const authHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };

    // 3. Test Scalable Metrics Aggregation Service
    console.log('\n--- Testing Metrics Aggregation Service ---');
    const metricsRes = await axios.get(`${API_BASE}/analytics/metrics`, authHeaders);
    assert(metricsRes.status === 200, 'GET /api/analytics/metrics returns 200');
    assert(metricsRes.data.success === true, 'Metrics response indicates success');
    assert(typeof metricsRes.data.metrics.totalUsers === 'number', 'totalUsers is a number');
    assert(typeof metricsRes.data.metrics.activeEvents === 'number', 'activeEvents is a number');
    assert(typeof metricsRes.data.metrics.totalEvents === 'number', 'totalEvents is a number');
    assert(typeof metricsRes.data.metrics.totalAssessmentLevels === 'number', 'totalAssessmentLevels is a number');
    console.log('Metrics retrieved:', metricsRes.data.metrics);

    // 4. Test Caching Behavior
    const cachedMetricsRes = await axios.get(`${API_BASE}/analytics/metrics`, authHeaders);
    assert(cachedMetricsRes.data.isCached === true, 'Subsequent metrics request is served from cache');

    const forcedRefreshRes = await axios.get(`${API_BASE}/analytics/metrics?refresh=true`, authHeaders);
    assert(forcedRefreshRes.data.isCached === false, 'Forced refresh (?refresh=true) bypasses cache');

    // 5. Test CSV Report Export
    console.log('\n--- Testing Report Export Service ---');
    const csvSummaryRes = await axios.get(`${API_BASE}/analytics/reports/export?type=summary&format=csv`, authHeaders);
    assert(csvSummaryRes.status === 200, 'Export CSV Summary returns 200');
    assert(csvSummaryRes.headers['content-type']?.includes('text/csv'), 'CSV Content-Type is text/csv');
    assert(csvSummaryRes.data.includes('Total Registered Users'), 'CSV contains metric description');

    const csvUsersRes = await axios.get(`${API_BASE}/analytics/reports/export?type=users&format=csv`, authHeaders);
    assert(csvUsersRes.status === 200, 'Export CSV Users returns 200');
    assert(csvUsersRes.data.includes('Roll Number'), 'CSV contains users table header');

    // 6. Test PDF Report Export
    const pdfRes = await axios.get(`${API_BASE}/analytics/reports/export?type=summary&format=pdf`, {
      ...authHeaders,
      responseType: 'arraybuffer',
    });
    assert(pdfRes.status === 200, 'Export PDF Summary returns 200');
    assert(pdfRes.headers['content-type']?.includes('application/pdf'), 'PDF Content-Type is application/pdf');
    assert(pdfRes.data.byteLength > 1000, 'PDF buffer has valid non-trivial size');

    // 7. Test News Subsystem CRUD
    console.log('\n--- Testing News Management CRUD ---');
    
    // 7a. Create News Article
    const uniqueTitle = `Nebula Hackathon 2026 Announced - ${Date.now()}`;
    const createNewsRes = await axios.post(
      `${API_BASE}/news`,
      {
        title: uniqueTitle,
        content: 'Registration for the flagship 24-hour coding hackathon is now open. Prizes up to 50,000 INR.',
        coverImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
        date: new Date().toISOString(),
        tags: ['Hackathon', 'Announcement', 'Competitive'],
        pinned: true,
      },
      authHeaders
    );
    assert(createNewsRes.status === 201, 'POST /api/news returns 201 Created');
    assert(createNewsRes.data.news.title === uniqueTitle, 'Created news article has matching title');
    assert(createNewsRes.data.news.pinned === true, 'Created news article has pinned=true');
    const createdNewsId = createNewsRes.data.news._id;

    // 7b. Public News Feed (unauthenticated)
    const publicNewsRes = await axios.get(`${API_BASE}/news`);
    assert(publicNewsRes.status === 200, 'GET /api/news returns 200 (Public)');
    assert(Array.isArray(publicNewsRes.data.news), 'Public news feed returns array of articles');
    assert(publicNewsRes.data.news.length > 0, 'News feed has at least one article');
    assert(publicNewsRes.data.news[0]._id === createdNewsId, 'Pinned article appears at top of feed');

    // 7c. Public Filter by Tag
    const tagFilteredRes = await axios.get(`${API_BASE}/news?tag=Hackathon`);
    assert(tagFilteredRes.status === 200, 'GET /api/news?tag=Hackathon returns 200');
    assert(tagFilteredRes.data.news.some((n: any) => n._id === createdNewsId), 'Filtered feed includes created hackathon news');

    // 7d. Get News Article By ID
    const singleArticleRes = await axios.get(`${API_BASE}/news/${createdNewsId}`);
    assert(singleArticleRes.status === 200, 'GET /api/news/:id returns 200');
    assert(singleArticleRes.data.news.viewsCount >= 1, 'View count incremented on fetch');

    // 7e. Update News Article
    const updatedTitle = `${uniqueTitle} [UPDATED - REGISTRATIONS CLOSING SOON]`;
    const updateNewsRes = await axios.put(
      `${API_BASE}/news/${createdNewsId}`,
      {
        title: updatedTitle,
        pinned: false,
      },
      authHeaders
    );
    assert(updateNewsRes.status === 200, 'PUT /api/news/:id returns 200');
    assert(updateNewsRes.data.news.title === updatedTitle, 'Title updated successfully');
    assert(updateNewsRes.data.news.pinned === false, 'Pinned updated to false');

    // 7f. Delete News Article
    const deleteNewsRes = await axios.delete(`${API_BASE}/news/${createdNewsId}`, authHeaders);
    assert(deleteNewsRes.status === 200, 'DELETE /api/news/:id returns 200');

    // Verify it is gone
    const verifyDeleted = await axios.get(`${API_BASE}/news/${createdNewsId}`).catch((err) => err.response);
    assert(verifyDeleted.status === 404, 'Deleted news article responds with 404');

  } catch (error: any) {
    console.error('Test run error:', error.response?.data || error.message);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Tests Completed: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Report = require('../models/Report');
const Pet = require('../models/Pet');

describe('Report Controller', () => {
  let authToken;
  let userId;
  let petId;

  beforeEach(async () => {
    await User.deleteMany({});
    await Pet.deleteMany({});
    await Report.deleteMany({});

    // Create and login a test user
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        phone: '+1234567890'
      });

    authToken = signupResponse.body.data.token;
    userId = signupResponse.body.data.user.id;

    // Create a test pet
    const pet = await Pet.create({
      name: 'Buddy',
      species: 'dog',
      breed: 'Golden Retriever',
      age: 3,
      color: 'Golden',
      owner: userId
    });
    petId = pet._id;
  });

  describe('POST /api/reports', () => {
    it('should create a new report successfully', async () => {
      const reportData = {
        type: 'lost',
        pet: petId,
        description: 'Lost my dog at the park',
        location: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749] // San Francisco
        },
        lastSeen: new Date().toISOString()
      };

      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reportData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe(reportData.type);
      expect(response.body.data.reporter).toBe(userId);
    });

    it('should return validation error for invalid type', async () => {
      const reportData = {
        type: 'invalid_type',
        pet: petId,
        description: 'Test description',
        location: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749]
        }
      };

      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reportData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return error without authentication', async () => {
      const reportData = {
        type: 'lost',
        pet: petId,
        description: 'Test description',
        location: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749]
        }
      };

      const response = await request(app)
        .post('/api/reports')
        .send(reportData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/reports', () => {
    beforeEach(async () => {
      // Create test reports
      await Report.create([
        {
          type: 'lost',
          pet: petId,
          description: 'Lost dog report 1',
          location: {
            type: 'Point',
            coordinates: [-122.4194, 37.7749]
          },
          reporter: userId,
          status: 'active'
        },
        {
          type: 'found',
          pet: petId,
          description: 'Found dog report 1',
          location: {
            type: 'Point',
            coordinates: [-122.4094, 37.7849]
          },
          reporter: userId,
          status: 'active'
        }
      ]);
    });

    it('should get all reports', async () => {
      const response = await request(app)
        .get('/api/reports');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter reports by type', async () => {
      const response = await request(app)
        .get('/api/reports?type=lost');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].type).toBe('lost');
    });

    it('should filter reports by status', async () => {
      const response = await request(app)
        .get('/api/reports?status=active');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/reports/nearby', () => {
    beforeEach(async () => {
      // Create test reports at different locations
      await Report.create([
        {
          type: 'lost',
          pet: petId,
          description: 'Lost dog nearby',
          location: {
            type: 'Point',
            coordinates: [-122.4194, 37.7749] // San Francisco
          },
          reporter: userId,
          status: 'active'
        },
        {
          type: 'found',
          pet: petId,
          description: 'Found dog far away',
          location: {
            type: 'Point',
            coordinates: [-74.0059, 40.7128] // New York
          },
          reporter: userId,
          status: 'active'
        }
      ]);
    });

    it('should find reports within radius', async () => {
      const response = await request(app)
        .get('/api/reports/nearby')
        .query({
          lat: 37.7749,
          lng: -122.4194,
          radius: 10 // 10km radius
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].description).toBe('Lost dog nearby');
    });

    it('should return validation error for missing coordinates', async () => {
      const response = await request(app)
        .get('/api/reports/nearby')
        .query({
          radius: 10
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/reports/:id', () => {
    let reportId;

    beforeEach(async () => {
      const report = await Report.create({
        type: 'lost',
        pet: petId,
        description: 'Test report',
        location: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749]
        },
        reporter: userId,
        status: 'active'
      });
      reportId = report._id;
    });

    it('should get a specific report by id', async () => {
      const response = await request(app)
        .get(`/api/reports/${reportId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe('Test report');
    });

    it('should return 404 for non-existent report', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/reports/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/reports/:id', () => {
    let reportId;

    beforeEach(async () => {
      const report = await Report.create({
        type: 'lost',
        pet: petId,
        description: 'Test report',
        location: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749]
        },
        reporter: userId,
        status: 'active'
      });
      reportId = report._id;
    });

    it('should update a report successfully', async () => {
      const updateData = {
        description: 'Updated description',
        status: 'resolved'
      };

      const response = await request(app)
        .put(`/api/reports/${reportId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe('Updated description');
      expect(response.body.data.status).toBe('resolved');
    });

    it('should return 403 when trying to update another user\'s report', async () => {
      // Create another user
      const anotherUserResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'anotheruser',
          email: 'another@example.com',
          password: 'Password123!',
          phone: '+1234567891'
        });

      const anotherToken = anotherUserResponse.body.data.token;

      const response = await request(app)
        .put(`/api/reports/${reportId}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ description: 'Hacked' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/reports/:id', () => {
    let reportId;

    beforeEach(async () => {
      const report = await Report.create({
        type: 'lost',
        pet: petId,
        description: 'Test report',
        location: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749]
        },
        reporter: userId,
        status: 'active'
      });
      reportId = report._id;
    });

    it('should delete a report successfully', async () => {
      const response = await request(app)
        .delete(`/api/reports/${reportId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify report is deleted
      const deletedReport = await Report.findById(reportId);
      expect(deletedReport).toBeNull();
    });
  });
});

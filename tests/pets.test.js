const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Pet = require('../models/Pet');

describe('Pet Controller', () => {
  let authToken;
  let userId;

  beforeEach(async () => {
    await User.deleteMany({});
    await Pet.deleteMany({});

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
  });

  describe('POST /api/pets', () => {
    it('should create a new pet successfully', async () => {
      const petData = {
        name: 'Buddy',
        species: 'dog',
        breed: 'Golden Retriever',
        age: 3,
        color: 'Golden',
        description: 'Friendly and energetic'
      };

      const response = await request(app)
        .post('/api/pets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(petData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(petData.name);
      expect(response.body.data.owner).toBe(userId);
    });

    it('should return error without authentication', async () => {
      const petData = {
        name: 'Buddy',
        species: 'dog',
        breed: 'Golden Retriever',
        age: 3,
        color: 'Golden'
      };

      const response = await request(app)
        .post('/api/pets')
        .send(petData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return validation error for missing required fields', async () => {
      const petData = {
        name: 'Buddy'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/pets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(petData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/pets', () => {
    beforeEach(async () => {
      // Create test pets
      await Pet.create([
        {
          name: 'Buddy',
          species: 'dog',
          breed: 'Golden Retriever',
          age: 3,
          color: 'Golden',
          owner: userId
        },
        {
          name: 'Whiskers',
          species: 'cat',
          breed: 'Persian',
          age: 2,
          color: 'White',
          owner: userId
        }
      ]);
    });

    it('should get all pets for authenticated user', async () => {
      const response = await request(app)
        .get('/api/pets')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter pets by species', async () => {
      const response = await request(app)
        .get('/api/pets?species=dog')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].species).toBe('dog');
    });
  });

  describe('GET /api/pets/:id', () => {
    let petId;

    beforeEach(async () => {
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

    it('should get a specific pet by id', async () => {
      const response = await request(app)
        .get(`/api/pets/${petId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Buddy');
    });

    it('should return 404 for non-existent pet', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/pets/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/pets/:id', () => {
    let petId;

    beforeEach(async () => {
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

    it('should update a pet successfully', async () => {
      const updateData = {
        name: 'Buddy Updated',
        age: 4
      };

      const response = await request(app)
        .put(`/api/pets/${petId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Buddy Updated');
      expect(response.body.data.age).toBe(4);
    });

    it('should return 403 when trying to update another user\'s pet', async () => {
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
        .put(`/api/pets/${petId}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ name: 'Hacked' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/pets/:id', () => {
    let petId;

    beforeEach(async () => {
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

    it('should delete a pet successfully', async () => {
      const response = await request(app)
        .delete(`/api/pets/${petId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify pet is deleted
      const deletedPet = await Pet.findById(petId);
      expect(deletedPet).toBeNull();
    });
  });
});

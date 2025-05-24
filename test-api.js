#!/usr/bin/env node

/**
 * Missing Pets API Test Script
 * This script tests the basic functionality of the Missing Pets API
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8080';
const API = axios.create({
  baseURL: BASE_URL,
  timeout: 5000
});

// Test data
const testUser = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  password: 'password123',
  phone: '+1234567890'
};

const testPet = {
  name: 'Buddy',
  breed: 'Golden Retriever'
};

const testReport = {
  status: 'lost',
  description: 'Lost near Central Park',
  location: {
    type: 'Point',
    coordinates: [-73.968285, 40.785091] // Central Park, NYC
  }
};

let authToken = '';
let createdPetId = '';
let createdReportId = '';

async function runTests() {
  console.log('🧪 Starting Missing Pets API Tests\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await API.get('/health');
    console.log('✅ Health Check:', healthResponse.data.status);

    // Test 2: User Signup
    console.log('\n2️⃣ Testing User Signup...');
    const signupResponse = await API.post('/auth/signup', testUser);
    authToken = signupResponse.data.token;
    console.log('✅ User Signup successful');
    console.log('   User ID:', signupResponse.data.user._id);

    // Set auth header for subsequent requests
    API.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

    // Test 3: User Login
    console.log('\n3️⃣ Testing User Login...');
    const loginResponse = await API.post('/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ User Login successful');

    // Test 4: Get Profile
    console.log('\n4️⃣ Testing Get Profile...');
    const profileResponse = await API.get('/users/me');
    console.log('✅ Profile retrieved:', profileResponse.data.user.name);

    // Test 5: Create Pet
    console.log('\n5️⃣ Testing Create Pet...');
    const petResponse = await API.post('/pets', testPet);
    createdPetId = petResponse.data.pet._id;
    console.log('✅ Pet created:', petResponse.data.pet.name);
    console.log('   Pet ID:', createdPetId);

    // Test 6: Get Pets
    console.log('\n6️⃣ Testing Get Pets...');
    const petsResponse = await API.get('/pets');
    console.log('✅ Pets retrieved:', petsResponse.data.data.length, 'pets found');

    // Test 7: Create Report
    console.log('\n7️⃣ Testing Create Report...');
    testReport.pet = createdPetId;
    const reportResponse = await API.post('/reports', testReport);
    createdReportId = reportResponse.data.report._id;
    console.log('✅ Report created:', reportResponse.data.report.status);
    console.log('   Report ID:', createdReportId);

    // Test 8: Get Reports
    console.log('\n8️⃣ Testing Get Reports...');
    const reportsResponse = await API.get('/reports');
    console.log('✅ Reports retrieved:', reportsResponse.data.data.length, 'reports found');

    // Test 9: Geospatial Search
    console.log('\n9️⃣ Testing Geospatial Search...');
    const geoResponse = await API.get('/reports?lat=40.785091&lng=-73.968285&radius=1000');
    console.log('✅ Geospatial search:', geoResponse.data.data.length, 'reports found within 1km');

    // Test 10: Update Report
    console.log('\n🔟 Testing Update Report...');
    const updateResponse = await API.patch(`/reports/${createdReportId}`, {
      description: 'Updated: Still missing near Central Park'
    });
    console.log('✅ Report updated successfully');

    console.log('\n🎉 All tests passed successfully!\n');

    // Clean up
    console.log('🧹 Cleaning up test data...');
    await API.delete(`/reports/${createdReportId}`);
    await API.delete(`/pets/${createdPetId}`);
    await API.delete('/users/me');
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    console.error('   Status:', error.response?.status);
    
    // Attempt cleanup even if tests failed
    try {
      if (createdReportId) await API.delete(`/reports/${createdReportId}`);
      if (createdPetId) await API.delete(`/pets/${createdPetId}`);
      if (authToken) await API.delete('/users/me');
      console.log('🧹 Partial cleanup completed');
    } catch (cleanupError) {
      console.error('⚠️ Cleanup failed:', cleanupError.message);
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };

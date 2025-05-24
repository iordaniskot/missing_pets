#!/usr/bin/env node

/**
 * Missing Pets API - Attachment Upload Test Script
 * This script tests the file upload functionality for pets and reports
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:8080';
const API = axios.create({
  baseURL: BASE_URL,
  timeout: 10000
});

// Test data
const testUser = {
  name: 'Jane Smith',
  email: 'jane.smith@example.com',
  password: 'password123',
  phone: '+1234567890'
};

const testPet = {
  name: 'Max',
  breed: 'German Shepherd',
  height: 65,
  weight: 35,
  color: 'brown and black'
};

const testReport = {
  status: 'lost',
  description: 'Lost near downtown area',
  location: {
    type: 'Point',
    coordinates: [-74.006, 40.7128] // NYC coordinates
  }
};

let authToken = '';
let createdPetId = '';
let createdReportId = '';

// Helper function to create test files
function createTestFiles() {
  console.log('📁 Creating test files...');
  
  const testDir = path.join(__dirname, 'test-files');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
  }

  // Create a simple test image (1x1 pixel PNG)
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
    0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x01, 0x35, 0xAB, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
    0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  fs.writeFileSync(path.join(testDir, 'test-image.png'), pngData);

  // Create a simple JPEG test file (minimal valid JPEG)
  const jpegData = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xD9
  ]);
  fs.writeFileSync(path.join(testDir, 'test-photo.jpg'), jpegData);

  // Create a test executable file (should be rejected)
  const exeData = Buffer.from([0x4D, 0x5A, 0x90, 0x00]); // MZ header for .exe
  fs.writeFileSync(path.join(testDir, 'malicious.exe'), exeData);

  // Create a test PDF file (minimal valid PDF)
  const pdfData = Buffer.from([
    0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A, 0x25, 0xC4, 0xE5,
    0xF2, 0xE5, 0xEB, 0xA7, 0xF3, 0xA0, 0xD0, 0xC4, 0xC6, 0x0A, 0x34, 0x20,
    0x30, 0x20, 0x6F, 0x62, 0x6A, 0x0A, 0x3C, 0x3C, 0x0A, 0x2F, 0x54, 0x79,
    0x70, 0x65, 0x20, 0x2F, 0x43, 0x61, 0x74, 0x61, 0x6C, 0x6F, 0x67, 0x0A,
    0x2F, 0x50, 0x61, 0x67, 0x65, 0x73, 0x20, 0x33, 0x20, 0x30, 0x20, 0x52,
    0x0A, 0x3E, 0x3E, 0x0A, 0x65, 0x6E, 0x64, 0x6F, 0x62, 0x6A, 0x0A
  ]);
  fs.writeFileSync(path.join(testDir, 'test-document.pdf'), pdfData);

  console.log('✅ Test files created');
}

// Helper function to clean up test files
function cleanupTestFiles() {
  const testDir = path.join(__dirname, 'test-files');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
    console.log('🧹 Test files cleaned up');
  }
}

// Helper function to test file accessibility
async function testFileAccessibility(cdnUrl) {
  try {
    const fullUrl = BASE_URL + cdnUrl;
    const fileResponse = await axios.get(fullUrl, { timeout: 5000 });
    return fileResponse.status === 200;
  } catch (error) {
    console.log(`     File accessibility error: ${error.message}`);
    return false;
  }
}

async function runAttachmentTests() {
  console.log('🧪 Starting Attachment Upload Tests\n');

  try {
    // Setup: Create test files
    createTestFiles();

    // Test 1: Health Check
    console.log('1️⃣ Testing API Health...');
    const healthResponse = await API.get('/health');
    console.log('✅ API is healthy:', healthResponse.data.status);

    // Test 2: User Setup
    console.log('\n2️⃣ Setting up test user...');
    try {
      await API.post('/auth/signup', testUser);
      console.log('✅ User created');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️ User already exists, proceeding...');
      } else {
        throw error;
      }
    }

    const loginResponse = await API.post('/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    authToken = loginResponse.data.token;
    API.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    console.log('✅ User authenticated');

    // Test 3: Create Pet with Image Upload
    console.log('\n3️⃣ Testing Pet Creation with Image Upload...');
    const petFormData = new FormData();
    petFormData.append('name', testPet.name);
    petFormData.append('breed', testPet.breed);
    petFormData.append('height', testPet.height);
    petFormData.append('weight', testPet.weight);
    petFormData.append('color', testPet.color);
    
    const imagePath = path.join(__dirname, 'test-files', 'test-image.png');
    petFormData.append('attachments', fs.createReadStream(imagePath));

    const petResponse = await API.post('/pets', petFormData, {
      headers: {
        ...petFormData.getHeaders(),
      }
    });

    createdPetId = petResponse.data.pet._id;
    console.log('✅ Pet created with image:', petResponse.data.pet.name);
    console.log('   Pet ID:', createdPetId);
    
    if (petResponse.data.pet.photos && petResponse.data.pet.photos.length > 0) {
      console.log('   Photo CDN URL:', petResponse.data.pet.photos[0]);
      
      // Test file accessibility
      const isAccessible = await testFileAccessibility(petResponse.data.pet.photos[0]);
      console.log('   Photo accessible:', isAccessible ? '✅' : '❌');
    } else {
      console.log('   ⚠️ No photos attached to pet');
    }

    // Test 4: Update Pet with Multiple Images
    console.log('\n4️⃣ Testing Pet Update with Multiple Images...');
    const updateFormData = new FormData();
    updateFormData.append('description', 'Updated with more photos');
    
    const jpegPath = path.join(__dirname, 'test-files', 'test-photo.jpg');
    const pngPath = path.join(__dirname, 'test-files', 'test-image.png');
    updateFormData.append('attachments', fs.createReadStream(jpegPath));
    updateFormData.append('attachments', fs.createReadStream(pngPath));

    const petUpdateResponse = await API.patch(`/pets/${createdPetId}`, updateFormData, {
      headers: {
        ...updateFormData.getHeaders(),
      }
    });

    console.log('✅ Pet updated with multiple images');
    if (petUpdateResponse.data.pet.photos) {
      console.log('   Total photos:', petUpdateResponse.data.pet.photos.length);
      petUpdateResponse.data.pet.photos.forEach((photo, index) => {
        console.log(`   Photo ${index + 1}:`, photo);
      });
    }

    // Test 5: Create Report with PDF Attachment
    console.log('\n5️⃣ Testing Report Creation with PDF Attachment...');
    const reportFormData = new FormData();
    reportFormData.append('pet', createdPetId);
    reportFormData.append('status', testReport.status);
    reportFormData.append('description', testReport.description);
    reportFormData.append('location[type]', testReport.location.type);
    reportFormData.append('location[coordinates][0]', testReport.location.coordinates[0]);
    reportFormData.append('location[coordinates][1]', testReport.location.coordinates[1]);
    
    const pdfPath = path.join(__dirname, 'test-files', 'test-document.pdf');
    reportFormData.append('attachments', fs.createReadStream(pdfPath));

    const reportResponse = await API.post('/reports', reportFormData, {
      headers: {
        ...reportFormData.getHeaders(),
      }
    });

    createdReportId = reportResponse.data.report._id;
    console.log('✅ Report created with PDF:', reportResponse.data.report.status);
    console.log('   Report ID:', createdReportId);
    
    if (reportResponse.data.report.photos && reportResponse.data.report.photos.length > 0) {
      console.log('   PDF CDN URL:', reportResponse.data.report.photos[0]);
      
      // Test file accessibility
      const isAccessible = await testFileAccessibility(reportResponse.data.report.photos[0]);
      console.log('   PDF accessible:', isAccessible ? '✅' : '❌');
    } else {
      console.log('   ⚠️ No attachments found in report');
    }

    // Test 6: Invalid File Type Upload
    console.log('\n6️⃣ Testing Invalid File Type Rejection...');
    const invalidFormData = new FormData();
    invalidFormData.append('name', 'Test Pet');
    invalidFormData.append('breed', 'Test Breed');
    
    const exePath = path.join(__dirname, 'test-files', 'malicious.exe');
    invalidFormData.append('attachments', fs.createReadStream(exePath));

    try {
      await API.post('/pets', invalidFormData, {
        headers: {
          ...invalidFormData.getHeaders(),
        }
      });
      console.log('❌ Invalid file type was accepted (this should not happen)');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Invalid file type correctly rejected');
        console.log('   Error message:', error.response.data.message);
      } else {
        throw error;
      }
    }

    // Test 7: Static File Serving
    console.log('\n7️⃣ Testing Static File Serving...');
    if (petResponse.data.pet.photos && petResponse.data.pet.photos.length > 0) {
      const cdnUrl = petResponse.data.pet.photos[0];
      const staticUrl = BASE_URL + cdnUrl; // CDN URL is already /attachments/filename
      
      try {
        const staticResponse = await axios.get(staticUrl, { timeout: 5000 });
        console.log('✅ Static file serving works');
        console.log('   Static URL:', staticUrl);
        console.log('   Content-Type:', staticResponse.headers['content-type']);
      } catch (error) {
        console.log('❌ Static file serving failed:', error.message);
      }
    }

    // Test 8: File Upload Limits (if configured)
    console.log('\n8️⃣ Testing File Upload Behavior...');
    const largeFormData = new FormData();
    largeFormData.append('name', 'Large File Test');
    largeFormData.append('breed', 'Test Breed');
    
    // Try uploading multiple files to test limits
    for (let i = 0; i < 3; i++) {
      largeFormData.append('attachments', fs.createReadStream(imagePath));
    }

    try {
      const largeUploadResponse = await API.post('/pets', largeFormData, {
        headers: {
          ...largeFormData.getHeaders(),
        }
      });
      console.log('✅ Multiple file upload successful');
      console.log('   Files uploaded:', largeUploadResponse.data.pet.photos?.length || 0);
      
      // Clean up this test pet
      await API.delete(`/pets/${largeUploadResponse.data.pet._id}`);
    } catch (error) {
      console.log('ℹ️ Multiple file upload limitation:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 All attachment upload tests completed!\n');

  } catch (error) {
    console.error('\n❌ Attachment test failed:', error.response?.data || error.message);
    console.error('   Status:', error.response?.status);
    if (error.config) {
      console.error('   Request URL:', error.config.url);
      console.error('   Request Method:', error.config.method);
    }
  } finally {
    // Clean up
    console.log('🧹 Cleaning up test data...');
    try {
      if (createdReportId) {
        await API.delete(`/reports/${createdReportId}`);
        console.log('✅ Test report deleted');
      }
      if (createdPetId) {
        await API.delete(`/pets/${createdPetId}`);
        console.log('✅ Test pet deleted');
      }
      if (authToken) {
        await API.delete('/users/me');
        console.log('✅ Test user deleted');
      }
    } catch (cleanupError) {
      console.error('⚠️ Cleanup failed:', cleanupError.message);
    }
    
    // Clean up test files
    cleanupTestFiles();
  }
}

// Helper function to test CDN functionality specifically
async function testCDNFunctionality() {
  console.log('\n🌐 Testing CDN Functionality...');
  
  try {
    // Test if attachments directory exists and is served
    const testEndpoints = [
      '/attachments/',
      '/health'
    ];

    for (const endpoint of testEndpoints) {
      try {
        const response = await API.get(endpoint);
        console.log(`✅ ${endpoint}:`, response.status);
      } catch (error) {
        console.log(`ℹ️ ${endpoint}:`, error.response?.status || 'Failed');
      }
    }
  } catch (error) {
    console.error('❌ CDN test failed:', error.message);
  }
}

async function main() {
  console.log('🚀 Missing Pets API - Attachment Upload Testing\n');
  
  // Check if server is running
  try {
    await API.get('/health');
    console.log('✅ Server is running\n');
  } catch (error) {
    console.error('❌ Server is not running. Please start the server first.');
    console.error('   Run: npm start or node app.js\n');
    process.exit(1);
  }

  await testCDNFunctionality();
  await runAttachmentTests();
}

if (require.main === module) {
  main();
}

module.exports = { runAttachmentTests, testCDNFunctionality };

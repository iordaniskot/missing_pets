const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');

async function debugUpload() {
  try {
    // First login
    const loginResponse = await axios.post('http://localhost:3000/auth/login', {
      email: 'jane.smith@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Logged in successfully');
    
    // Create form data
    const form = new FormData();
    form.append('name', 'Debug Test Pet');
    form.append('breed', 'Test Breed');
    
    // Create a small test image
    const testImageData = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xD9
    ]);
    
    form.append('attachments', testImageData, {
      filename: 'debug-test.jpg',
      contentType: 'image/jpeg'
    });
    
    console.log('📤 Sending upload request...');
    
    const response = await axios.post('http://localhost:3000/pets', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Upload successful!');
    console.log('Pet ID:', response.data.pet._id);
    console.log('Photos:', response.data.pet.photos);
    
    // Check if file exists
    if (response.data.pet.photos && response.data.pet.photos.length > 0) {
      const filename = response.data.pet.photos[0].split('/').pop();
      const filePath = `./attachments/${filename}`;
      console.log('Checking file at:', filePath);
      console.log('File exists:', fs.existsSync(filePath));
      
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log('File size:', stats.size, 'bytes');
      }
    }
    
    // Clean up
    await axios.delete(`http://localhost:3000/pets/${response.data.pet._id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Cleanup completed');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugUpload();

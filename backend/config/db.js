const mongoose = require('./mongooseMock');

const connectDB = async () => {
  console.log('✨ PlaySphere Database Adapter Loaded (Firebase Firestore / Local Fallback Active)');
};

module.exports = connectDB;


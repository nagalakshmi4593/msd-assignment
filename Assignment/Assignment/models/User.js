const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    images: { type: [String], default: [] } // Array to store uploaded image filenames
});

const User = mongoose.model('User', userSchema);

module.exports = User;

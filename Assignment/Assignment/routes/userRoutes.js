// routes/userRoutes.js
const express = require('express');
const User = require('../models/User');
const router = express.Router();
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Import fs to delete files

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Directory to store uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to avoid name clashes
    }
});

const upload = multer({ storage: storage });

// Render the index page
router.get('/index', (req, res) => {
    res.render('index'); // Render the index page
});

// Redirect root path to the registration page
router.get('/', (req, res) => {
    res.redirect('/index'); // Redirect to the index page
});

// Render the registration page
router.get('/register', (req, res) => {
    res.render('register'); // Render the registration page
});

// Handle user registration
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, images: [] }); // Initialize images array
    
    try {
        await newUser.save();
        res.redirect('/login'); // Redirect to login after registration
    } catch (err) {
        console.error(err);
        res.send('Error registering user'); // Handle registration errors
    }
});

// Render the login page
router.get('/login', (req, res) => {
    res.render('login'); // Render the login page
});

// Handle user login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user._id; // Store user ID in session
        res.redirect('/dashboard'); // Redirect to the dashboard after login
    } else {
        res.send('Invalid credentials'); // Handle invalid credentials
    }
});

// Render the dashboard page
router.get('/dashboard', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login'); // Redirect to login if not authenticated
    }

    const user = await User.findById(req.session.userId);
    res.render('dashboard', { user }); // Render dashboard with user details
});

// Handle updating user details
router.post('/update', async (req, res) => {
    const { username } = req.body;
    
    try {
        await User.findByIdAndUpdate(req.session.userId, { username });
        res.redirect('/dashboard'); // Redirect to dashboard after update
    } catch (err) {
        console.error(err);
        res.send('Error updating user details'); // Handle update errors
    }
});

// Handle user account deletion
router.post('/delete', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.session.userId);
        req.session.destroy(); // Destroy the session
        res.redirect('/register'); // Redirect to registration page after deletion
    } catch (err) {
        console.error(err);
        res.send('Error deleting account'); // Handle deletion errors
    }
});

// Handle logout
router.post('/logout', (req, res) => {
    req.session.destroy(); // Destroy the session
    res.redirect('/'); // Redirect to home page
});

// Handle image uploads
router.post('/upload', upload.single('image'), async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login'); // Redirect to login if not authenticated
    }

    const user = await User.findById(req.session.userId);
    user.images.push(req.file.filename); // Add uploaded image filename to user's images
    await user.save(); // Save user with updated images
    res.redirect('/dashboard'); // Redirect to dashboard after upload
});

// Handle image deletion
router.post('/delete-image', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login'); // Redirect to login if not authenticated
    }

    const { image } = req.body; // Get the image filename from request body
    const user = await User.findById(req.session.userId);
    
    // Remove image from user's images array
    user.images = user.images.filter(img => img !== image);
    await user.save(); // Save user with updated images

    // Delete the image file from the uploads directory
    const filePath = path.join('uploads', image);
    fs.unlink(filePath, (err) => {
        if (err) console.error(err); // Log any errors while deleting the file
    });

    res.redirect('/dashboard'); // Redirect to dashboard after deletion
});

module.exports = router;

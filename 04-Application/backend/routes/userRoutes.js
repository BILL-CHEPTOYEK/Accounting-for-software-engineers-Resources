// /04-Application/backend/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');

// Public routes (no authentication required)
router.post('/signup', userController.signupUser);
router.post('/login', userController.loginUser);

// Protected routes (authentication required)
router.get('/', verifyToken, userController.getAllUsers);
router.get('/:user_id', verifyToken, userController.getUserById);
router.post('/', verifyToken, userController.createUser); 
router.put('/:user_id', verifyToken, userController.updateUser);
router.delete('/:user_id', verifyToken, userController.deleteUser);

module.exports = router;

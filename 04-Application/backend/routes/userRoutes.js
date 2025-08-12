// /04-Application/backend/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getAllUsers);
router.get('/:user_id', userController.getUserById);
router.post('/', userController.createUser); 
router.put('/:user_id', userController.updateUser);
router.delete('/:user_id', userController.deleteUser);
router.post('/login', userController.loginUser);

module.exports = router;

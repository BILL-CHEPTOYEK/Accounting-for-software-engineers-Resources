// /04-Application/backend/routes/accountTypeRoutes.js

const express = require('express');
const router = express.Router();
const accountTypeController = require('../controllers/accountTypeController');

router.get('/', accountTypeController.getAllAccountTypes);
router.get('/:account_type_id', accountTypeController.getAccountTypeById);
router.post('/', accountTypeController.createAccountType);
router.put('/:account_type_id', accountTypeController.updateAccountType);
router.delete('/:account_type_id', accountTypeController.deleteAccountType);

module.exports = router;

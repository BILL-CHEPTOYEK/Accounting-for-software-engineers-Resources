// /04-Application/backend/routes/chartOfAccountRoutes.js

const express = require('express');
const router = express.Router();
const chartOfAccountController = require('../controllers/chartOfAccountController');

router.get('/', chartOfAccountController.getAllChartOfAccounts);
router.get('/:account_id', chartOfAccountController.getChartOfAccountById);
router.post('/', chartOfAccountController.createChartOfAccount);
router.put('/:account_id', chartOfAccountController.updateChartOfAccount);
router.delete('/:account_id', chartOfAccountController.deleteChartOfAccount);

module.exports = router;

// /04-Application/backend/routes/branchRoutes.js

const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');

router.get('/', branchController.getAllBranches);
router.get('/:branch_id', branchController.getBranchById);
router.post('/', branchController.createBranch);
router.put('/:branch_id', branchController.updateBranch);
router.delete('/:branch_id', branchController.deleteBranch);

module.exports = router;

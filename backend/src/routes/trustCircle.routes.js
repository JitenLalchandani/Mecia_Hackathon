const express = require('express');
const router = express.Router();
const {
  getMyCircle,
  sendInvite,
  getPendingRequests,
  respondToRequest,
  removeMember,
  searchUsers
} = require('../controllers/trustCircle.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/',                         getMyCircle);
router.post('/invite',                  sendInvite);
router.get('/requests',                 getPendingRequests);
router.put('/requests/:id',             respondToRequest);
router.delete('/:connectionId',         removeMember);
router.get('/search',                   searchUsers);

module.exports = router;

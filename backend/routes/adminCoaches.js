const router = require("express").Router();
const adminCoachesController = require("../controllers/adminCoaches");
const isAuth = require("../middlewares/isAuth");
const isCoach = require("../middlewares/isCoach");

router.post("/:userId", adminCoachesController.postAdminCoaches);
router.get("/", isAuth, isCoach, adminCoachesController.getAdminCoaches);
router.put("/", isAuth, isCoach, adminCoachesController.putAdminCoaches);

module.exports = router;

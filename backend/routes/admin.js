const router = require("express").Router();
const adminCoachesController = require("../controllers/admin");
const isAuth = require("../middlewares/isAuth");
const isCoach = require("../middlewares/isCoach");

router.get("/coaches/courses", isAuth, isCoach, adminCoachesController.getAdminCourses);
router.post("/coaches/courses", isAuth, isCoach, adminCoachesController.postAdminCourses);
router.get("/coaches/courses/:courseId", isAuth, adminCoachesController.getAdminCourse);
router.put("/coaches/courses/:courseId", isAuth, adminCoachesController.putAdminCourse);

router.get("/coaches", isAuth, isCoach, adminCoachesController.getAdminCoaches);
router.put("/coaches", isAuth, isCoach, adminCoachesController.putAdminCoaches);
router.get("/coaches/revenue", isAuth, isCoach, adminCoachesController.getAdminRevenue);
router.post("/coaches/:userId", adminCoachesController.postAdminCoaches);

module.exports = router;

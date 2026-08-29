const router = require("express").Router();
const coachController = require("../controllers/coach");

router.get("/skill", coachController.getSkills);
router.post("/skill", coachController.postSkill);
router.delete("/skill/:skillId", coachController.deleteSkill);

router.get("/", coachController.getCoaches);
router.get("/:coachId", coachController.getCoach);
router.get("/:coachId/courses", coachController.getCoachCourses);

module.exports = router;

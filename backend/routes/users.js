const router = require("express").Router();
const usersController = require("../controllers/users");
const isAuth = require("../middlewares/isAuth");

// 不需登入
router.post("/signup", usersController.signup);
router.post("/login", usersController.login);

// 需要登入 → 掛 isAuth
router.get("/profile", isAuth, usersController.getProfile);
router.put("/profile", isAuth, usersController.putProfile);
router.put("/password", isAuth, usersController.putPassword);

module.exports = router;

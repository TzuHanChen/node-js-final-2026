const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { dataSource } = require("../db/data-source");
const config = require("../config/index");
const appError = require("../utils/appError");
const { isValidString, isValidPassword } = require("../utils/validUtils");

const PW_ERR = "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字";

const usersController = {
  async signup(req, res, next) {
    const { name, email, password } = req.body;
    if (
      !isValidString(name) ||
      !isValidString(email) ||
      !isValidString(password)
    ) {
      return next(appError(400, "欄位未填寫正確"));
    }
    if (!isValidPassword(password)) {
      return next(appError(400, PW_ERR));
    }
    const userRepo = dataSource.getRepository("User");
    const existing = await userRepo.findOneBy({
      email: email.trim().toLowerCase(),
    });
    if (existing) {
      return next(appError(409, "Email 已被使用"));
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await userRepo.save({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashed,
      role: "USER",
    });
    res.status(201).json({
      status: "success",
      data: { user: { id: user.id, name: user.name } },
    });
  },
};

module.exports = usersController;

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

	async login(req, res, next) {
		const { email, password } = req.body;
		if (!isValidString(email) || !isValidString(password)) {
			return next(appError(400, "欄位未填寫正確"));
		}
		if (!isValidPassword(password)) {
			return next(appError(400, PW_ERR));
		}
		const userRepo = dataSource.getRepository("User");
		const user = await userRepo.findOneBy({
			email: email.trim().toLowerCase(),
		});
		if (!user) {
			return next(appError(400, "使用者不存在或密碼輸入錯誤"));
		}
		const match = await bcrypt.compare(password, user.password);
		if (!match) {
			return next(appError(400, "使用者不存在或密碼輸入錯誤"));
		}
		const token = jwt.sign(
			{ id: user.id, role: user.role },
			config.get("secret.jwtSecret"),
			{ expiresIn: config.get("secret.jwtExpiresDay") },
		);
		res.status(201).json({
			status: "success",
			data: { token, user: { name: user.name } },
		});
	},

	async getProfile(req, res, next) {
		// isAuth 已經把 user 掛到 req.user 了
		res.json({
			status: "success",
			data: { user: { name: req.user.name, email: req.user.email } },
		});
	},
};

module.exports = usersController;

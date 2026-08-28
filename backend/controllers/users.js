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

	async putProfile(req, res, next) {
		const { name } = req.body;
		if (!isValidString(name)) {
			return next(appError(400, "欄位未填寫正確"));
		}
		const userRepo = dataSource.getRepository("User");
		const existing = await userRepo.findOneBy({ email: req.user.email });
		if (existing.name === name) {
			return next(appError(400, "使用者名稱未變更"));
		}
		const result = await userRepo.update(
			{ email: req.user.email },
			{ name: name.trim() }
		);
		if (result.affected === 0) {
			return next(appError(400, "更新使用者資料失敗"));
		}
		const updatedUser = await userRepo.findOneBy({ email: req.user.email });
		res.json({ status: "success", data: { user: { name: updatedUser.name } } });
	},

	async putPassword(req, res, next) {
		const { password, new_password, confirm_new_password } = req.body;
		if (!isValidString(password) ||
			!isValidString(new_password) ||
			!isValidString(confirm_new_password)) {
			return next(appError(400, "欄位未填寫正確"));
		}
		if (!isValidPassword(password) ||
			!isValidPassword(new_password) ||
			!isValidPassword(confirm_new_password)) {
			return next(appError(400, PW_ERR));
		}
		if (password === new_password) {
			return next(appError(400, "新密碼不能與舊密碼相同"));
		}
		if (new_password !== confirm_new_password) {
			return next(appError(400, "新密碼與驗證新密碼不一致"));
		}
		const userRepo = dataSource.getRepository("User");
		const user = await userRepo.findOneBy({ email: req.user.email });
		const match = await bcrypt.compare(password, user.password);
		if (!match) {
			return next(appError(400, "使用者不存在或密碼輸入錯誤"));
		}
		const hashed = await bcrypt.hash(new_password, 10);
		const result = await userRepo.update(
			{ email: req.user.email },
			{ password: hashed }
		);
		if (result.affected === 0) {
			return next(appError(400, "更新使用者資料失敗"));
		}
		res.json({ status: "success", data: null });
	},

	async getCreditPackage(req, res, next) {
		const purchaseRepo = dataSource.getRepository("CreditPurchase");
		const purchases = await purchaseRepo.find({
			where: { user_id: req.user.id },
			relations: { credit_package: true },
			order: { purchase_at: "DESC" },
		});
		const data = purchases.map((p) => ({
			name: p.credit_package.name,
			purchased_credits: p.purchased_credits,
			price_paid: p.price_paid,
			purchase_at: p.purchase_at,
		}));
		res.json({ status: "success", data });
	},

	async getCourses(req, res, next) {
		const purchaseRepo = dataSource.getRepository("CreditPurchase");
		const bookingRepo = dataSource.getRepository("CourseBooking");

		const purchases = await purchaseRepo.find({
			where: { user_id: req.user.id },
		});
		const totalCredits = purchases.reduce(
			(sum, p) => sum + p.purchased_credits,
			0,
		);

		const allBookings = await bookingRepo.find({
			where: { user_id: req.user.id },
			relations: { course: { user: true } },
			order: { course: { start_at: "ASC" } },
		});
		const creditUsage = allBookings.filter((b) => !b.cancelled_at).length;
		const creditRemain = totalCredits - creditUsage;

		const courseBooking = allBookings.map((b) => ({
			course_id: b.course_id,
			name: b.course.name,
			start_at: b.course.start_at,
			end_at: b.course.end_at,
			meeting_url: b.course.meeting_url,
			coach_name: b.course.user.name,
			cancelled_at: b.cancelled_at,
		}));

		res.json({
			status: "success",
			data: {
				credit_remain: creditRemain,
				credit_usage: creditUsage,
				course_booking: courseBooking,
			},
		});
	},
};

module.exports = usersController;

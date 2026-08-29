const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { IsNull, MoreThan, LessThanOrEqual } = require("typeorm");

const coursesController = {
	async createBooking(req, res, next) {
		const { courseId } = req.params;
		const courseRepo = dataSource.getRepository("Course");
		const bookingRepo = dataSource.getRepository("CourseBooking");
		const purchaseRepo = dataSource.getRepository("CreditPurchase");

		// ① 查無課程
		const course = await courseRepo.findOneBy({ id: courseId });
		if (!course) return next(appError(400, "查無此課程"));

		// ② 已報名（含已取消）
		const existBooking = await bookingRepo.findOneBy({
			user_id: req.user.id,
			course_id: courseId,
		});
		if (existBooking) return next(appError(400, "已經報名過此課程"));

		// ③ 剩餘堂數
		const purchases = await purchaseRepo.find({ where: { user_id: req.user.id } });
		const totalCredits = purchases.reduce((sum, p) => sum + p.purchased_credits, 0);
		const usageCount = await bookingRepo.count({
			where: { user_id: req.user.id, cancelled_at: IsNull() },
		});
		if (totalCredits - usageCount <= 0) return next(appError(400, "已無可使用堂數"));

		// ④ 最大人數
		const participantCount = await bookingRepo.count({
			where: { course_id: courseId, cancelled_at: IsNull() },
		});
		if (participantCount >= course.max_participants)
			return next(appError(400, "已達最大參加人數，無法參加"));

		// 通過 → 報名
		await bookingRepo.save({ user_id: req.user.id, course_id: courseId });
		res.status(201).json({ status: "success", data: null });
	},

	async deleteBooking(req, res, next) {
		const bookingRepo = dataSource.getRepository("CourseBooking");
		const booking = await bookingRepo.findOneBy({
			user_id: req.user.id,
			course_id: req.params.courseId,
			cancelled_at: IsNull(),
		});
		if (!booking) return next(appError(400, "ID錯誤"));
		booking.cancelled_at = new Date();
		await bookingRepo.save(booking);
		res.json({ status: "success", data: null });
	},

	async getCourses(req, res, next) {
		const courseRepo = dataSource.getRepository("Course");
		const courses = await courseRepo.find({
			where: {
				start_at: LessThanOrEqual(new Date()),
				end_at: MoreThan(new Date()),
			},
			relations: { user: true, skill: true },
			order: { start_at: "ASC" },
		});
		const data = courses.map(course => {
			return {
				id: course.id,
				name: course.name,
				description: course.description,
				start_at: course.start_at,
				end_at: course.end_at,
				max_participants: course.max_participants,
				coach_name: course.user.name,
				skill_name: course.skill.name,
			}
		});
		res.json({ status: "success", data });
		return;
	},
};

module.exports = coursesController;

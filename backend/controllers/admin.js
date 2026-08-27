const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString, isInteger } = require("../utils/validUtils");

const adminCoachesController = {
	async postAdminCoaches(req, res, next) {
		const { experience_years, description, profile_image_url } = req.body;
		if (!isInteger(experience_years) || experience_years < 0) {
			return next(appError(400, "欄位未填寫正確"));
		}
		if (!isValidString(description)) {
			return next(appError(400, "欄位未填寫正確"));
		}
		if (profile_image_url) {
			if (!isValidString(profile_image_url) ||
				!profile_image_url.startsWith("https")) {
				return next(appError(400, "欄位未填寫正確"));
			}
		}
		const userRepo = dataSource.getRepository("User");
		const user = await userRepo.findOneBy({ id: req.params.userId });
		if (!user) {
			return next(appError(400, "使用者不存在"));
		}
		const coachRepo = dataSource.getRepository("Coach");
		const existing = await coachRepo.findOneBy({ user_id: req.params.userId });
		if (existing) {
			return next(appError(409, "使用者已經是教練"));
		}
		const result = await userRepo.update(
			{ id: req.params.userId },
			{ role: "COACH" }
		);
		if (result.affected === 0) {
			return next(appError(400, "更新使用者資料失敗"));
		}
		const coach = await coachRepo.save({
			user_id: req.params.userId,
			experience_years: experience_years,
			description: description,
			profile_image_url: profile_image_url
		});
		const updatedUser = await userRepo.findOneBy({ id: req.params.userId });
		res.json({
			status: "success", data: {
				user: { name: updatedUser.name, role: updatedUser.role },
				coach: coach
			}
		});
		return;
	},

	async getAdminCoaches(req, res, next) {
		const coachRepo = dataSource.getRepository("Coach");
		const coach = await coachRepo.find({
			select: { id: true, experience_years: true, description: true, profile_image_url: true },
			where: { user_id: req.user.id }
		});
		const coachLinkSkillRepo = dataSource.getRepository("CoachLinkSkill");
		const skill_ids = await coachLinkSkillRepo.find({
			select: { skill_id: true },
			where: { coach_id: req.user.id }
		})
		res.json({
			status: "success",
			data: { ...coach[0], skill_ids: skill_ids }
		});
		return;
	},

	async putAdminCoaches(req, res, next) {
		const { experience_years, description, profile_image_url, skill_ids } = req.body;
		if (!isInteger(experience_years) || experience_years < 0) {
			return next(appError(400, "欄位未填寫正確"));
		}
		if (!isValidString(description)) {
			return next(appError(400, "欄位未填寫正確"));
		}
		if (!profile_image_url ||
			!isValidString(profile_image_url) ||
			!profile_image_url.startsWith("https")) {
			return next(appError(400, "欄位未填寫正確"));
		}
		if (!skill_ids ||
			!Array.isArray(skill_ids) ||
			skill_ids.length === 0 ||
			skill_ids.find(id => typeof id !== "string")) {
			return next(appError(400, "欄位未填寫正確"));
		}
		const coachRepo = dataSource.getRepository("Coach");
		const coach = await coachRepo.findOne({
			select: { id: true },
			where: { user_id: req.user.id }
		});
		if (!coach) {
			return next(appError(401, "使用者尚未成為教練"));
		}
		const result = await coachRepo.update(coach.id, {
			experience_years: experience_years,
			description: description.trim(),
			profile_image_url: profile_image_url.trim()
		});
		if (result.affected === 0) {
			return next(appError(400, "更新使用者資料失敗"));
		}
		const coachLinkSkillRepo = dataSource.getRepository("CoachLinkSkill");
		await coachLinkSkillRepo.delete({ coach_id: coach.id });
		const newSkills = skill_ids.map((skill_id) => {
			return coachLinkSkillRepo.create({
				coach_id: coach.id,
				skill_id: skill_id,
			});
		});
		await coachLinkSkillRepo.save(newSkills);
		const coach_new = await coachRepo.findOne({
			select: { id: true, experience_years: true, description: true, profile_image_url: true },
			where: { user_id: req.user.id }
		});
		const skill_ids_new = await coachLinkSkillRepo.find({
			select: { skill_id: true },
			where: { coach_id: coach.id }
		});
		res.json({
			status: "success",
			data: { ...coach_new, skill_ids: skill_ids_new.map(skill => skill.skill_id) }
		});
		return;
	},

	async getAdminCourses(req, res, next) {
		const courses = await dataSource.query(`
		  SELECT c.id, c.name, c.start_at, c.end_at, c.max_participants, c.meeting_url,
		    COUNT(cb.id)::int AS participants
		  FROM "courses" c
			LEFT JOIN "course_bookings" cb
			ON c.id = cb.course_id AND cb.cancelled_at IS NULL
			WHERE c.user_id = $1
			GROUP BY c.id
			ORDER BY c.start_at DESC
		`, [req.user.id]);
		const now = new Date();
		const coursesWithStatus = courses.map(course => {
			let status = '';
			if (new Date(course.start_at) > now) status = "尚未開始";
			else if (new Date(course.end_at) <= now) status = "已結束";
			else status = "進行中";
			return { ...course, status }
		})
		res.json({ status: "success", data: coursesWithStatus });
		return;
	},

	async postAdminCourses(req, res, next) {
		const { skill_id, name, description, start_at, end_at, max_participants, meeting_url } = req.body;
		if (!isValidString(skill_id) ||
			!isValidString(name) ||
			!isValidString(description) ||
			!isValidString(start_at) ||
			!isValidString(end_at) ||
			!isInteger(max_participants) ||
			max_participants < 0 ||
			!isValidString(meeting_url) ||
			!meeting_url.startsWith("https")) {
			return next(appError(400, "欄位未填寫正確"));
		}
		const coachRepo = dataSource.getRepository("Course");
		const course = await coachRepo.save({
			user_id: req.user.id,
			skill_id: skill_id,
			name: name,
			description: description,
			start_at: start_at,
			end_at: end_at,
			max_participants: max_participants,
			meeting_url: meeting_url
		})
		res.json({ status: "success", data: { course } });
		return;
	},

	async getAdminCourse(req, res, next) {
		res.json({ status: "success", data: [] });
		return;
	},

	async putAdminCourse(req, res, next) {
		res.json({ status: "success", data: [] });
		return;
	},
};

module.exports = adminCoachesController;

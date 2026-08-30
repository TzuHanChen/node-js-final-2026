const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString, isInteger } = require("../utils/validUtils");
const { MoreThan } = require("typeorm");

const coachController = {
  async getSkills(req, res, next) {
    const skills = await dataSource.getRepository("Skill").find({
      select: { id: true, name: true },
      order: { created_at: "ASC" },
    });
    res.json({ status: "success", data: skills });
    return;
  },

  async postSkill(req, res, next) {
    const { name } = req.body;
    if (!isValidString(name)) {
      next(appError(400, "欄位未填寫正確"));
      return;
    }
    const skillRepo = dataSource.getRepository("Skill");
    const existing = await skillRepo.findOneBy({ name: name.trim() });
    if (existing) {
      next(appError(409, "資料重複"));
      return;
    }
    const skill = await skillRepo.save({ name: name.trim() });
    res.json({ status: "success", data: skill });
  },

  async deleteSkill(req, res, next) {
    try {
      const { skillId } = req.params;
      const result = await dataSource.getRepository("Skill").delete(skillId);
      if (result.affected === 0) {
        next(appError(400, "ID錯誤"));
        return;
      }
      res.json({ status: "success" });
    } catch (error) {
      console.error(error);
      next(error);
    }
  },

  async getCoaches(req, res, next) {
    const { per, page } = req.query;
    const perNum = Number.parseInt(per), pageNum = Number.parseInt(page);
    if (!isInteger(perNum) || perNum < 0 ||
      !isInteger(pageNum) || pageNum < 1) {
      return next(appError(400, "欄位未填寫正確"));
    }
    const offset = (pageNum - 1) * perNum;
    const coachRepo = dataSource.getRepository("Coach");
    const coaches = await coachRepo.find({
      relations: { user: true },
      order: { created_at: "ASC" },
      take: perNum,
      skip: offset,
    });
    const coachesData = coaches.map(coach => {
      return { id: coach.id, user_id: coach.user_id, name: coach.user.name }
    });
    res.json({ status: "success", data: coachesData });
    return;
  },

  async getCoach(req, res, next) {
    const coachRepo = dataSource.getRepository("Coach");
    const coach = await coachRepo.findOne({
      where: { id: req.params.coachId },
    });
    if (!coach) {
      return next(appError(400, "找不到該教練"));
    }
    const UserRepo = dataSource.getRepository('User');
    const user = await UserRepo.findOne({
      where: { id: coach.user_id }
    });
    if (!user) {
      return next(appError(400, "找不到該教練"));
    }
    const CoachLinkSkillRepo = dataSource.getRepository("CoachLinkSkill");
    const coachSkills = await CoachLinkSkillRepo.find({
      where: { coach_id: req.params.coachId },
      relations: { skill: true }
    });
    if (!coachSkills) {
      return next(appError(400, "找不到該教練技能"));
    }
    const data = {
      user: { name: user.name, role: user.role },
      coach: { ...coach, skills: coachSkills.map(skill => skill.name) }
    }
    res.json({ status: "success", data });
    return;
  },

  async getCoachCourses(req, res, next) {
    const coachRepo = dataSource.getRepository("Coach");
    const coach = await coachRepo.findOne({
      where: { id: req.params.coachId },
    });
    if (!coach) {
      return next(appError(400, "找不到該教練"));
    }
    const UserRepo = dataSource.getRepository('User');
    const user = await UserRepo.findOne({
      where: { id: coach.user_id }
    });
    if (!user) {
      return next(appError(400, "找不到該教練"));
    }
    const courseRepo = dataSource.getRepository("Course");
    const courses = await courseRepo.find({
      where: {
        user_id: coach.user_id,
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

module.exports = coachController;

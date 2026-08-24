const { EntitySchema } = require("typeorm");
module.exports = new EntitySchema({
	name: "CoachLinkSkill",
	tableName: "coach_link_skill",
	columns: {
		id: { type: "uuid", primary: true, generated: "uuid" },
		coach_id: { type: "uuid", nullable: false },
		skill_id: { type: "uuid", nullable: false },
		created_at: { type: "timestamp", createDate: true },
	},
	uniques: [
		{
			name: "coach_link_skill_unique",
			columns: ["coach_id", "skill_id"],
		},
	],
	relations: {
		coach: {
			type: "many-to-one",
			target: "Coach",
			joinColumn: { name: "coach_id" },
			onDelete: "CASCADE",
		},
		skill: {
			type: "many-to-one",
			target: "Skill",
			joinColumn: { name: "skill_id" },
			onDelete: "CASCADE",
		},
	},
});
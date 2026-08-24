const { EntitySchema } = require("typeorm");
module.exports = new EntitySchema({
	name: "CreditPackage",
	tableName: "credit_packages",
	columns: {
		id: { type: "uuid", primary: true, generated: "uuid" },
		name: { type: "varchar", length: 50, nullable: false, unique: true },
		credit_amount: { type: "int", nullable: false },
		price: { type: "numeric", precision: 10, scale: 2, nullable: false },
		created_at: { type: "timestamp", createDate: true },
	},
});

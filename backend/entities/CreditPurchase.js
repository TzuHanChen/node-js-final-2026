const { EntitySchema } = require("typeorm");
module.exports = new EntitySchema({
	name: "CreditPurchase",
	tableName: "credit_purchases",
	columns: {
		id: { type: "uuid", primary: true, generated: "uuid" },
		user_id: { type: "uuid", nullable: false },
		credit_package_id: { type: "uuid", nullable: false },
		purchased_credits: { type: "int", nullable: false },
		price_paid: { type: "numeric", precision: 10, scale: 2, nullable: false },
		purchase_at: { type: "timestamp", createDate: true },
		created_at: { type: "timestamp", createDate: true },
	},
	relations: {
		user: {
			type: "many-to-one",
			target: "User",
			joinColumn: { name: "user_id" },
		},
		credit_package: {
			type: "many-to-one",
			target: "CreditPackage",
			joinColumn: { name: "credit_package_id" },
		},
	},
});

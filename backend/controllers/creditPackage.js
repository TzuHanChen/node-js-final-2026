const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString, isInteger } = require("../utils/validUtils");

const creditPackageController = {
	async getCreditPackages(req, res, next) {
		const creditPackages = await dataSource.getRepository("CreditPackage").find({
			select: { id: true, name: true, credit_amount: true, price: true },
			order: { created_at: "ASC" },
		});
		res.json({ status: "success", data: creditPackages });
		return;
	},

	async postCreditPackage(req, res, next) {
		const { name, credit_amount, price } = req.body;
		if (
			!isValidString(name) ||
			!isInteger(credit_amount) || credit_amount < 0 ||
			!isInteger(price) || price < 0
		) {
			next(appError(400, "欄位未填寫正確"));
			return;
		}
		const creditPackageRepo = dataSource.getRepository("CreditPackage");
		const existing = await creditPackageRepo.findOneBy({ name: name.trim() });
		if (existing) {
			next(appError(409, "資料重複"));
			return;
		}
		const creditPackage = await creditPackageRepo.save({
			name: name.trim(),
			credit_amount: credit_amount,
			price: price
		});
		res.json({ status: "success", data: creditPackage });
	},

	async deleteCreditPackage(req, res, next) {
		try {
			const { creditPackageId } = req.params;
			const result = await dataSource.getRepository("CreditPackage").delete(creditPackageId);
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
};
module.exports = creditPackageController;

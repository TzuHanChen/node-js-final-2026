require('dotenv').config()
const { DataSource } = require('typeorm')

const dataSource = new DataSource({
	type: 'postgres',
	host: process.env.DB_HOST,
	port: Number(process.env.DB_PORT),
	username: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE,
	synchronize: process.env.DB_SYNCHRONIZE === 'true',
	ssl: process.env.DB_ENABLE_SSL === 'true',
	entities: [
		// 今天的 entities 會一個一個長出來
	],
})

module.exports = { dataSource }

require("dotenv").config();

module.exports = {
  development: {
    username: process.env.USERNAME,
    password: process.env.PASSWORD,
    database: process.env.DBNAME,
    host: process.env.HOST,
    port: process.env.DBPORT,
    dialect: "mysql",
  },
};
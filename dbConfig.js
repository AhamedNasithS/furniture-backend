const Sequelize = require("sequelize");

require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DBNAME,
  process.env.USERNAME,
  process.env.PASSWORD,
  {
    host: process.env.HOST,
    port: process.env.DBPORT,
    dialect: "mysql",

    dialectOptions: {
      charset: "utf8mb4",

      ...(process.env.DB_SSL === "true"
        ? {
          ssl: {
            minVersion: "TLSv1.2",
          },
        }
        : {}),
    },

    timezone: "+05:30",

    benchmark: false,

    logging: false,

    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
      evict: 10000,
    },
  }
);

sequelize
  .authenticate()
  .then(() => {
    console.log("Main Connection established");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

module.exports = sequelize;
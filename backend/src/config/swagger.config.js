const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Ask Innovation Backend API",
      version: "1.0.0",
      description: "API documentation"
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
      {
        url: "https://task.askinnovations.co.in/"
      }
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    }
  },

  // files to scan
  apis: [
    path.join(__dirname, "../routes/*.js")
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

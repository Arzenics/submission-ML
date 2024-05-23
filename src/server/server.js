require("dotenv").config();

const Hapi = require("@hapi/hapi");
const routes = require("./routes.js");
const loadModel = require("../services/loadModel.js");
const InputError = require("../exceptions/InputError.js");

const httpServer = async () => {
  console.log("Starting server setup...");

  const server = Hapi.server({
    port: 3000,
    host: "localhost",
    routes: {
      cors: {
        origin: ["*"],
      },
    },
  });

  console.log(`Server configuration complete. Attempting to load model...`);

  const model = await loadModel();
  server.app.model = model;
  console.log("Model loaded and assigned to server.app.model.");

  server.route(routes);

  console.log("Routes added to server.");

  server.ext("onPreResponse", (request, h) => {
    const { response } = request;

    if (response instanceof InputError) {
      console.log("InputError detected:");
      return h
        .response({
          status: "fail",
          message:
            response.message || "Terjadi kesalahan dalam melakukan prediksi",
        })
        .code(response.statusCode || 400);
    }

    if (response.isBoom && response.output.statusCode === 413) {
      console.log("Payload too large detected.");
      return h
        .response({
          status: "fail",
          message:
            "Payload content length greater than maximum allowed: 1000000",
        })
        .code(413);
    }

    return h.continue;
  });

  await server.start();
  console.log(`Server started at: ${server.info.uri}`);
};

httpServer();

const InputError = require("../exceptions/InputError.js");
const predictBinary = require("../services/inferenceService.js");
const storeData = require("../services/storeData.js");
const { Firestore } = require("@google-cloud/firestore");
const crypto = require("crypto");

const MAX_PAYLOAD_SIZE = 1000000;
const firestore = new Firestore();

const predictHandler = async (request, h) => {
  try {
    const { image } = request.payload;
    
    if (image.byteLength > MAX_PAYLOAD_SIZE) {
      throw new InputError("Payload content length greater than maximum allowed: 1000000");
    }

    const { model } = request.server.app;

    const { confidenceScore, label, suggestion } = await predictBinary(
      model,
      image
    );
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const data = {
      id,
      result: label,
      suggestion,
      createdAt,
    };

    await storeData(id, data);

    return h
      .response({
        status: "success",
        message:
          confidenceScore >= 100 || confidenceScore < 1
            ? "Model is predicted successfully"
            : "Model is predicted successfully",
        data,
      })
      .code(201);
  } catch (error) {
    console.error("Terjadi kesalahan dalam melakukan prediksi", error);
    if (error instanceof InputError) {
      return h
        .response({
          status: "fail",
          message: error.message,
        })
        .code(400);
    } else {
      return h
        .response({
          status: "fail",
          message: "Terjadi kesalahan dalam melakukan prediksi",
        })
        .code(400);
    }
  }
};

const getLoadHistoryHandler = async (request, h) => {
  try {
    const snapshot = await firestore.collection("predictions").get();
    if (snapshot.empty) {
      console.log("No matching documents.");
      return {
        status: "success",
        data: [],
      };
    } else {
      const histories = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          result: data.result,
          createdAt: data.createdAt,
          suggestion: data.suggestion,
        };
      });

      console.log("Histories retrieved: ", histories);
      return h
        .response({
          status: "success",
          data: histories,
        })
        .code(200);
    }
  } catch (error) {
    console.error("Error retrieving histories: ", error);
    return {
      status: "error",
      message: "Failed to retrieve histories",
      error: error.message,
    };
  }
};

const notFoundHandler = (request, h) =>
  h
    .response({
      status: "fail",
      message: "Halaman tidak ditemukan",
    })
    .code(404);

module.exports = {
  predictHandler,
  getLoadHistoryHandler,
  notFoundHandler,
};

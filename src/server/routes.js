const {
  predictHandler,
  getLoadHistoryHandler,
  notFoundHandler,
} = require("./handler.js");

const routes = [
  {
    method: "POST",
    path: "/predict",
    handler: predictHandler,
    options: {
      payload: {
        allow: "multipart/form-data",
        multipart: true,
        maxBytes: 1 * 1024 * 1024,
      },
    },
  },
  {
    method: "GET",
    path: "/predict/histories",
    handler: getLoadHistoryHandler,
  },
  {
    method: "*",
    path: "/{any*}",
    handler: notFoundHandler,
  },
];

module.exports = routes;

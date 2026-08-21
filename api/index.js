let appPromise;

module.exports = async (request, response) => {
  appPromise ??= import("../artifacts/api-server/dist/app.mjs").then(
    (module) => module.default,
  );
  const app = await appPromise;
  return app(request, response);
};
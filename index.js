const app = require("./app");

const port = process.env.PORT || 8080;

// Start server only when running as a standalone Node process (e.g. local dev)
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`App is working on port ${port}`);
  });
}

module.exports = app;

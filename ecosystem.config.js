module.exports = {
  apps: [
    {
      name: "api-app.name",
      script: "./dist/app.js",
      cwd: ".",
      interpreter: "./.nvm/versions/node/v22.23.1/bin/node",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT:4041,
      },
    },
    {
      name: "worker-api-app.name",
      script: "./dist/src/workers/index.js",
      cwd: "",
      interpreter: "./.nvm/versions/node/v22.23.1/bin/node",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
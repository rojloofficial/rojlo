module.exports = {
  apps: [
    {
      name: "rojlo",
      script: ".next/standalone/server.js",
      cwd: "./",
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || 3000,
      },
    },
  ],
};

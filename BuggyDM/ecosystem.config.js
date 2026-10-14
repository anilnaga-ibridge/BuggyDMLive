module.exports = {
  apps: [
    {
      name: "buggy-api",
      script: "npm",
      args: "run start",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    },
    {
      name: "buggy-dispatch-worker",
      script: "npx",
      args: "tsx src/scripts/worker-runner.ts",
      instances: 2,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        DISPATCH_WORKER_CONCURRENCY: "10"
      }
    }
  ]
};

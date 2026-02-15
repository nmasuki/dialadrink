module.exports = {
  apps: [{
    name: 'diala-nextjs',
    cwd: '/home/wwwdiala/apps/diala-dev/client',
    script: './node_modules/next/dist/bin/next',
    args: 'start -p 3000',
    interpreter: '/home/wwwdiala/.nvm/versions/node/v20.20.0/bin/node',
    env: {
      NODE_ENV: 'production',
      PATH: '/home/wwwdiala/.nvm/versions/node/v20.20.0/bin:' + process.env.PATH
    }
  }]
};

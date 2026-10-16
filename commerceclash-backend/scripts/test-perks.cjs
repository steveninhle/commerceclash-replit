const { execFileSync, spawnSync } = require('node:child_process');
const { resolve } = require('node:path');

process.chdir(resolve(__dirname, '..'));
const container = `commerce-perk-tests-${process.pid}`;
let started = false;
function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with ${result.status}`);
}

(async () => {
  try {
    execFileSync(
      'docker',
      [
        'run',
        '--detach',
        '--rm',
        '--name',
        container,
        '--env',
        'POSTGRES_PASSWORD=perk-test-only',
        '--env',
        'POSTGRES_DB=perk_tests',
        '--publish',
        '127.0.0.1::5432',
        'postgres:16-alpine',
      ],
      { stdio: 'pipe' },
    );
    started = true;
    let ready = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      if (
        spawnSync('docker', ['exec', container, 'pg_isready', '-U', 'postgres'], {
          stdio: 'ignore',
        }).status === 0
      ) {
        ready = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (!ready) throw new Error('The isolated PostgreSQL database did not become ready.');
    const address = execFileSync('docker', ['port', container, '5432'], {
      encoding: 'utf8',
    }).trim();
    const url = `postgresql://postgres:perk-test-only@${address}/perk_tests`;
    const env = { ...process.env, DATABASE_URL: url, DIRECT_URL: url, PERK_TEST_DATABASE_URL: url };
    run(process.execPath, [require.resolve('prisma/build/index.js'), 'db', 'push'], env);
    run(process.execPath, [require.resolve('jest/bin/jest'), '--runInBand'], env);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    if (started) {
      const result = spawnSync('docker', ['rm', '--force', container], { stdio: 'ignore' });
      if (result.status !== 0) {
        console.error(`Could not remove test container ${container}.`);
        process.exitCode = 1;
      }
    }
  }
})();

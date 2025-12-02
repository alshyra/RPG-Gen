import test from 'ava';
import { HealthController } from '../src/controllers/health.controller.js';

test('health controller returns ok status with pid and uptime', (t) => {
  const controller = new HealthController();
  const res = controller.getHealth() as any;
  t.is(res.status, 'ok');
  t.truthy(typeof res.pid === 'number');
  t.truthy(typeof res.uptime === 'number');
  t.truthy(typeof res.timestamp === 'number');
});

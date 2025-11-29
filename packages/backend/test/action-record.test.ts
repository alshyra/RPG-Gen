import test from 'ava';
import { ActionStatus } from '../src/combat/action-record.schema.js';

test('ActionStatus enum contains expected values', (t) => {
  t.truthy(ActionStatus.PENDING);
  t.truthy(ActionStatus.PROCESSING);
  t.truthy(ActionStatus.APPLIED);
  t.truthy(ActionStatus.FAILED);
});

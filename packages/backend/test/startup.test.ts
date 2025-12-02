import test from 'ava';

import { AppModule } from '../src/app.module.js';

// Lightweight smoke test: ensure the AppModule file can be imported and
// the symbol exists. This avoids pulling in `@nestjs/testing` in dev deps
// while still providing a basic check that the module file loads.
test('AppModule can be imported', (t) => {
  t.truthy(AppModule, 'AppModule should be exported');
});

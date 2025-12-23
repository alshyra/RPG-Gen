/**
 * HTTP tests for draft vs created character endpoints
 * Each test is independent and can run in parallel
 */

import test from "ava";
import request from "supertest";
import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { CharacterModule } from "../../src/modules/character.module.js";
import { createTestApp, closeTestApp } from "../helpers/test-app.js";
import { CharacterService } from "../../src/domain/character/character.service.js";
import { JwtAuthGuard } from "../../src/bounded-contexts/auth/domain/jwt-auth.guard.js";

@Injectable()
class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { _id: "507f1f77bcf86cd799439011" };
    return true;
  }
}

const TEST_USER_ID = "507f1f77bcf86cd799439011";

test("GET draft character without portrait (no error)", async t => {
  const ctx = await createTestApp([CharacterModule], [
    { provide: JwtAuthGuard, useClass: MockJwtAuthGuard },
  ]);

  const characterService = ctx.module.get(CharacterService);
  const created = await characterService.create(TEST_USER_ID);
  const characterId = created.characterId;

  await characterService.update(TEST_USER_ID, characterId, {
    name: "Draft Hero",
    className: "guerrier",
  });

  const response = await request(ctx.app).get("/characters/" + characterId);

  t.is(response.status, 200);
  t.is(response.body.state, "draft");
  t.is(response.body.name, "Draft Hero");

  await closeTestApp(ctx);
});

test("GET created character with portrait", async t => {
  const ctx = await createTestApp([CharacterModule], [
    { provide: JwtAuthGuard, useClass: MockJwtAuthGuard },
  ]);

  const characterService = ctx.module.get(CharacterService);
  const created = await characterService.create(TEST_USER_ID);
  const characterId = created.characterId;

  await characterService.update(TEST_USER_ID, characterId, {
    name: "Created Hero",
    className: "mage",
    raceId: "humain",
    portrait: "portrait-url.png",
    state: "created",
  });

  const response = await request(ctx.app).get("/characters/" + characterId);

  t.is(response.status, 200);
  t.is(response.body.state, "created");
  t.is(response.body.name, "Created Hero");
  t.is(response.body.portrait, "portrait-url.png");

  await closeTestApp(ctx);
});

test("GET drafts/list returns only draft characters", async t => {
  const ctx = await createTestApp([CharacterModule], [
    { provide: JwtAuthGuard, useClass: MockJwtAuthGuard },
  ]);

  const characterService = ctx.module.get(CharacterService);

  // Create 2 drafts + 1 finished
  const draft1 = await characterService.create(TEST_USER_ID);
  await characterService.update(TEST_USER_ID, draft1.characterId, {
    name: "Draft 1",
    className: "guerrier",
  });

  const draft2 = await characterService.create(TEST_USER_ID);
  await characterService.update(TEST_USER_ID, draft2.characterId, {
    name: "Draft 2",
    className: "rogue",
  });

  const finished = await characterService.create(TEST_USER_ID);
  await characterService.update(TEST_USER_ID, finished.characterId, {
    name: "Finished",
    className: "mage",
    raceId: "humain",
    portrait: "portrait-url.png",
    state: "created",
  });

  const response = await request(ctx.app).get("/characters/drafts/list");

  t.is(response.status, 200);
  t.true(Array.isArray(response.body));
  t.is(response.body.length, 2);
  t.true(response.body.every((c: any) => c.state === "draft"));

  await closeTestApp(ctx);
});

test("GET created/list returns only created characters", async t => {
  const ctx = await createTestApp([CharacterModule], [
    { provide: JwtAuthGuard, useClass: MockJwtAuthGuard },
  ]);

  const characterService = ctx.module.get(CharacterService);

  // Create 1 draft + 2 finished
  const draft = await characterService.create(TEST_USER_ID);
  await characterService.update(TEST_USER_ID, draft.characterId, {
    name: "Draft",
    className: "guerrier",
  });

  const finished1 = await characterService.create(TEST_USER_ID);
  await characterService.update(TEST_USER_ID, finished1.characterId, {
    name: "Finished 1",
    className: "mage",
    raceId: "humain",
    portrait: "portrait-url.png",
    state: "created",
  });

  const finished2 = await characterService.create(TEST_USER_ID);
  await characterService.update(TEST_USER_ID, finished2.characterId, {
    name: "Finished 2",
    className: "paladin",
    raceId: "humain",
    portrait: "portrait-url2.png",
    state: "created",
  });

  const response = await request(ctx.app).get("/characters/created/list");

  t.is(response.status, 200);
  t.true(Array.isArray(response.body));
  t.is(response.body.length, 2);
  t.true(response.body.every((c: any) => c.state === "created"));

  await closeTestApp(ctx);
});

test("PUT partial update keeps draft state", async t => {
  const ctx = await createTestApp([CharacterModule], [
    { provide: JwtAuthGuard, useClass: MockJwtAuthGuard },
  ]);

  const characterService = ctx.module.get(CharacterService);
  const created = await characterService.create(TEST_USER_ID);
  const characterId = created.characterId;

  const response = await request(ctx.app)
    .put("/characters/" + characterId)
    .send({
      name: "Updated Draft",
      className: "guerrier",
    });

  t.is(response.status, 200);
  t.is(response.body.state, "draft");
  t.is(response.body.name, "Updated Draft");

  await closeTestApp(ctx);
});

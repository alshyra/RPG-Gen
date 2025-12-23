/**
 * Integration test for character creation finalization without portrait
 * Reproduces bug: "CharacterResponseDto initialized without portrait"
 */
import test from "ava";
import request from "supertest";
import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { CharacterModule } from "../../src/modules/character.module.js";
import { createTestApp, closeTestApp } from "../helpers/test-app.js";
import { CharacterService } from "../../src/domain/character/character.service.js";
import { JwtAuthGuard } from "../../src/bounded-contexts/auth/domain/jwt-auth.guard.js";

@Injectable()
class MockJwt implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    context.switchToHttp().getRequest().user = { _id: "507f1f77bcf86cd799439011", email: "test@example.com" };
    return true;
  }
}

test("Character update to created state without portrait should succeed", async t => {
  const ctx = await createTestApp([CharacterModule], [
    { provide: JwtAuthGuard, useClass: MockJwt },
  ]);
  
  const svc = ctx.module.get(CharacterService);
  
  // Create a draft character
  const char = await svc.create("507f1f77bcf86cd799439011");
  
  // Set up character with class, race, and other required fields
  await svc.update("507f1f77bcf86cd799439011", char.characterId, {
    name: "Test Hero",
    className: "guerrier",
    raceId: "humain",
    gender: "male",
  });

  // Finalize character creation by changing state to created WITHOUT setting a portrait
  // This should NOT throw an error - portrait should be optional
  const response = await request(ctx.app.getHttpServer())
    .put(`/characters/${char.characterId}`)
    .send({
      state: "created",
    })
    .expect(200);

  t.is(response.body.state, "created");
  t.is(response.body.characterId, char.characterId);
  t.is(response.body.name, "Test Hero");
  // Portrait can be undefined/null - this is acceptable
  t.pass();
  
  await closeTestApp(ctx);
});

test("Character with portrait should include it in response", async t => {
  const ctx = await createTestApp([CharacterModule], [
    { provide: JwtAuthGuard, useClass: MockJwt },
  ]);
  
  const svc = ctx.module.get(CharacterService);
  
  // Create a draft character
  const char = await svc.create("507f1f77bcf86cd799439011");
  
  // Set up character with portrait
  await svc.update("507f1f77bcf86cd799439011", char.characterId, {
    name: "Test Hero",
    className: "guerrier",
    raceId: "humain",
    gender: "male",
    portrait: "https://example.com/avatar.jpg",
  });

  // Finalize character
  const response = await request(ctx.app.getHttpServer())
    .put(`/characters/${char.characterId}`)
    .send({
      state: "created",
    })
    .expect(200);

  t.is(response.body.state, "created");
  t.is(response.body.portrait, "https://example.com/avatar.jpg");
  
  await closeTestApp(ctx);
});

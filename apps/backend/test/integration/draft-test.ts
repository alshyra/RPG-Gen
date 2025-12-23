/**
 * Minimal test: Draft character GET endpoint
 */
import test from "ava";
import request from "supertest";
import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { CharacterModule } from "../../src/modules/character.module.js";
import { createTestApp, closeTestApp } from "../helpers/test-app.js";
import { CharacterService } from "../../src/domain/character/character.service.js";
import { JwtAuthGuard } from "../../src/bounded-contexts/auth/infrastructure/auth/guards/JwtAuthGuard.js";

@Injectable()
class MockJwt implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    context.switchToHttp().getRequest().user = { _id: "507f1f77bcf86cd799439011" };
    return true;
  }
}

test("Draft character endpoint works", async t => {
  const ctx = await createTestApp([CharacterModule], [
    { provide: JwtAuthGuard, useClass: MockJwt },
  ]);
  
  const svc = ctx.module.get(CharacterService);
  const char = await svc.create("507f1f77bcf86cd799439011");
  
  await svc.update("507f1f77bcf86cd799439011", char.characterId, {
    name: "Test",
    className: "guerrier",
  });

  const res = await request(ctx.app).get("/characters/" + char.characterId);

  t.is(res.status, 200);
  t.is(res.body.state, "draft");
  
  await closeTestApp(ctx);
});

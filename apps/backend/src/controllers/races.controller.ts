import { Controller, Get, Logger, Param } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { RaceService } from "../domain/race/race.service.js";

@ApiTags("races")
@Controller("races")
export class RacesController {
  private readonly logger = new Logger(RacesController.name);

  constructor(private raceService: RaceService) {}

  @Get()
  @ApiOperation({ summary: "Get all available races" })
  @ApiResponse({
    status: 200,
    description: "List of all races with bonuses and traits",
  })
  async getAllRaces() {
    return this.raceService.getAllRaces();
  }

  @Get(":raceId")
  @ApiOperation({ summary: "Get a race by ID" })
  @ApiParam({
    name: "raceId",
    description: "Race identifier (humain, nain, elfe, orc)",
  })
  @ApiResponse({
    status: 200,
    description: "Race details",
  })
  async getRace(@Param("raceId") raceId: string) {
    return this.raceService.getRaceById(raceId);
  }
}

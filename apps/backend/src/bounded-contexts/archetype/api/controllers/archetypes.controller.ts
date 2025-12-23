import { Controller, Get, Logger, Param } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ArchetypeAppService } from "../../application/services/ArchetypeAppService.js";
import { ClassDefinitionResponseDto, TalentTreeDto } from "../dto/index.js";

@ApiTags("archetypes")
@Controller("archetypes")
export class ArchetypesController {
  private readonly logger = new Logger(ArchetypesController.name);

  constructor(private readonly archetypeService: ArchetypeAppService) {}

  @Get()
  @ApiOperation({ summary: "Get all available archetypes" })
  @ApiResponse({
    status: 200,
    description: "List of all archetypes",
    type: [ClassDefinitionResponseDto],
  })
  async getAllArchetypes() {
    return this.archetypeService.getAllArchetypesDto();
  }

  @Get(":archetypeName")
  @ApiOperation({ summary: "Get an archetype by name" })
  @ApiParam({
    name: "archetypeName",
    description: "Name of the archetype (e.g., guerrier, rogue, mage)",
  })
  @ApiResponse({
    status: 200,
    description: "Archetype details",
    type: ClassDefinitionResponseDto,
  })
  async getArchetype(@Param("archetypeName") archetypeName: string) {
    return this.archetypeService.getArchetypeDto(archetypeName);
  }

  @Get(":archetypeName/talent-trees")
  @ApiOperation({ summary: "Get talent trees (voies) for an archetype" })
  @ApiParam({
    name: "archetypeName",
    description: "Name of the archetype",
  })
  @ApiResponse({
    status: 200,
    description: "List of talent trees with their ranks",
    type: [TalentTreeDto],
  })
  async getTalentTrees(@Param("archetypeName") archetypeName: string) {
    return this.archetypeService.getTalentTreesDto(archetypeName);
  }

  @Get(":archetypeName/starting-aptitudes")
  @ApiOperation({ summary: "Get starting aptitudes for an archetype" })
  @ApiParam({
    name: "archetypeName",
    description: "Name of the archetype",
  })
  @ApiResponse({
    status: 200,
    description: "List of starting aptitude IDs",
    type: [String],
  })
  async getStartingAptitudes(@Param("archetypeName") archetypeName: string) {
    return this.archetypeService.getStartingAptitudes(archetypeName);
  }
}

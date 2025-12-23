import { Controller, Get, Logger, Param } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ArchetypeService } from "../../application/archetype.service.js";
import { ClassDefinitionResponseDto, TalentTreeDto } from "../dto/index.js";

@ApiTags("classes")
@Controller("classes")
export class ClassesController {
  private readonly logger = new Logger(ClassesController.name);

  constructor(private classesService: ArchetypeService) {}

  @Get()
  @ApiOperation({ summary: "Get all available classes" })
  @ApiResponse({
    status: 200,
    description: "List of all classes",
    type: [ClassDefinitionResponseDto],
  })
  async getAllClasses() {
    return this.classesService.getAllClasses();
  }

  @Get(":className")
  @ApiOperation({ summary: "Get a class by name" })
  @ApiParam({
    name: "className",
    description: "Name of the class (e.g., guerrier, rogue, mage)",
  })
  @ApiResponse({
    status: 200,
    description: "Class details",
    type: ClassDefinitionResponseDto,
  })
  async getClass(@Param("className") className: string) {
    return this.classesService.getClassByName(className);
  }

  @Get(":className/voies")
  @ApiOperation({ summary: "Get talent trees (voies) for a class" })
  @ApiParam({
    name: "className",
    description: "Name of the class",
  })
  @ApiResponse({
    status: 200,
    description: "List of talent trees with their ranks",
    type: [TalentTreeDto],
  })
  async getTalentTrees(@Param("className") className: string) {
    return this.classesService.getTalentTrees(className);
  }

  @Get(":className/starting-aptitudes")
  @ApiOperation({ summary: "Get starting aptitudes for a class" })
  @ApiParam({
    name: "className",
    description: "Name of the class",
  })
  @ApiResponse({
    status: 200,
    description: "List of starting aptitude IDs",
    type: [String],
  })
  async getStartingAptitudes(@Param("className") className: string) {
    return this.classesService.getStartingAptitudes(className);
  }
}

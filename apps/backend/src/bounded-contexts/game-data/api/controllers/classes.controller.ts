import { Controller, Get, Logger, Param, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClassDataService } from '../../application/services/ClassDataService.js';
import { ClassResponseDto, TalentTreeResponseDto } from '../dto/index.js';
import { ClassResponseMapper } from '../dto/ClassResponseMapper.js';

@ApiTags('classes')
@Controller('classes')
export class ClassesController {
  private readonly logger = new Logger(ClassesController.name);

  constructor(private readonly classService: ClassDataService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available character classes' })
  @ApiResponse({
    status: 200,
    description: 'List of all classes with stats and talent trees',
    type: [ClassResponseDto],
  })
  async getAllClasses(): Promise<ClassResponseDto[]> {
    const classes = await this.classService.findAll();
    return classes.map(cls => ClassResponseMapper.toDto(cls));
  }

  @Get(':className')
  @ApiOperation({ summary: 'Get a class by name' })
  @ApiParam({
    name: 'className',
    description: 'Class name (e.g., guerrier, rogue, mage)',
  })
  @ApiResponse({
    status: 200,
    description: 'Class details',
    type: ClassResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Class not found' })
  async getClass(@Param('className') className: string): Promise<ClassResponseDto> {
    const cls = await this.classService.findByName(className);
    if (!cls) {
      throw new NotFoundException(`Class '${className}' not found`);
    }
    return ClassResponseMapper.toDto(cls);
  }

  @Get(':className/talent-trees')
  @ApiOperation({ summary: 'Get talent trees (voies) for a class' })
  @ApiParam({
    name: 'className',
    description: 'Class name',
  })
  @ApiResponse({
    status: 200,
    description: 'List of talent trees with their ranks',
    type: [TalentTreeResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Class not found' })
  async getTalentTrees(@Param('className') className: string): Promise<TalentTreeResponseDto[]> {
    const cls = await this.classService.findByName(className);
    if (!cls) {
      throw new NotFoundException(`Class '${className}' not found`);
    }
    const dto = ClassResponseMapper.toDto(cls);
    return dto.talentTrees;
  }

  @Get(':className/starting-aptitudes')
  @ApiOperation({ summary: 'Get starting aptitudes for a class' })
  @ApiParam({
    name: 'className',
    description: 'Class name',
  })
  @ApiResponse({
    status: 200,
    description: 'List of starting aptitude IDs',
    type: [String],
  })
  @ApiResponse({ status: 404, description: 'Class not found' })
  async getStartingAptitudes(@Param('className') className: string): Promise<string[]> {
    const cls = await this.classService.findByName(className);
    if (!cls) {
      throw new NotFoundException(`Class '${className}' not found`);
    }
    return [...cls.startingAptitudes];
  }
}

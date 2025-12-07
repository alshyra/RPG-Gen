import {
  Controller, Get, Logger, Param, ParseIntPipe,
} from '@nestjs/common';
import {
  ApiOperation, ApiParam, ApiResponse, ApiTags,
} from '@nestjs/swagger';
import { ClassesService } from '../domain/classes/classes.service.js';
import { LevelUpOptionsDto } from '../domain/character/dto/LevelUpOptionsDto.js';

@ApiTags('classes')
@Controller('classes')
export class ClassesController {
  private readonly logger = new Logger(ClassesController.name);

  constructor(private classesService: ClassesService) {}

  @Get(':className/levels/:level')
  @ApiOperation({ summary: 'Get class-level options for a specific level' })
  @ApiParam({
    name: 'className',
    description: 'Name of the class (e.g., Bard, Cleric)',
  })
  @ApiParam({
    name: 'level',
    description: 'Level number (1-20)',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Class-level options',
    type: LevelUpOptionsDto,
  })
  async getLevelOptions(
    @Param('className') className: string,
    @Param('level', ParseIntPipe) level: number,
  ): Promise<LevelUpOptionsDto> {
    return this.classesService.getOptionsForLevel(className, level);
  }
}

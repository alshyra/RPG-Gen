import { Controller, Get, Logger, Param, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RaceDataService } from '../../application/services/RaceDataService.js';
import { RaceResponseDto } from '../dto/index.js';
import { RaceResponseMapper } from '../dto/RaceResponseMapper.js';

@ApiTags('races')
@Controller('game-data/races')
export class RacesController {
  private readonly logger = new Logger(RacesController.name);

  constructor(private readonly raceService: RaceDataService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available races' })
  @ApiResponse({
    status: 200,
    description: 'List of all races with bonuses and traits',
    type: [RaceResponseDto],
  })
  async getAllRaces(): Promise<RaceResponseDto[]> {
    const races = await this.raceService.findAll();
    return races.map(race => RaceResponseMapper.toDto(race));
  }

  @Get(':raceId')
  @ApiOperation({ summary: 'Get a race by ID' })
  @ApiParam({
    name: 'raceId',
    description: 'Race identifier (humain, nain, elfe, orc)',
  })
  @ApiResponse({
    status: 200,
    description: 'Race details',
    type: RaceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Race not found' })
  async getRace(@Param('raceId') raceId: string): Promise<RaceResponseDto> {
    const race = await this.raceService.findById(raceId);
    if (!race) {
      throw new NotFoundException(`Race '${raceId}' not found`);
    }
    return RaceResponseMapper.toDto(race);
  }
}

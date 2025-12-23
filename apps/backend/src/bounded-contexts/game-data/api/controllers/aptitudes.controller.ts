import { Controller, Get, Logger, Param, NotFoundException, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AptitudeDataService } from '../../application/services/AptitudeDataService.js';
import { AptitudeResponseDto } from '../dto/index.js';
import { AptitudeResponseMapper } from '../dto/AptitudeResponseMapper.js';

@ApiTags('aptitudes')
@Controller('aptitudes')
export class AptitudesController {
  private readonly logger = new Logger(AptitudesController.name);

  constructor(private readonly aptitudeService: AptitudeDataService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available aptitudes' })
  @ApiResponse({
    status: 200,
    description: 'List of all aptitudes',
    type: [AptitudeResponseDto],
  })
  async getAllAptitudes(): Promise<AptitudeResponseDto[]> {
    const aptitudes = await this.aptitudeService.findAll();
    return aptitudes.map(apt => AptitudeResponseMapper.toDto(apt));
  }

  @Get('by-ids')
  @ApiOperation({ summary: 'Get multiple aptitudes by IDs' })
  @ApiQuery({
    name: 'ids',
    description: 'Comma-separated aptitude IDs',
    example: 'frappe_simple,posture_defensive',
  })
  @ApiResponse({
    status: 200,
    description: 'List of matching aptitudes',
    type: [AptitudeResponseDto],
  })
  async getByIds(@Query('ids') ids: string): Promise<AptitudeResponseDto[]> {
    const idList = ids.split(',').map(id => id.trim()).filter(Boolean);
    const aptitudes = await this.aptitudeService.findByIds(idList);
    return aptitudes.map(apt => AptitudeResponseMapper.toDto(apt));
  }

  @Get(':aptitudeId')
  @ApiOperation({ summary: 'Get an aptitude by ID' })
  @ApiParam({
    name: 'aptitudeId',
    description: 'Aptitude identifier',
  })
  @ApiResponse({
    status: 200,
    description: 'Aptitude details',
    type: AptitudeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Aptitude not found' })
  async getAptitude(@Param('aptitudeId') aptitudeId: string): Promise<AptitudeResponseDto> {
    const aptitude = await this.aptitudeService.findById(aptitudeId);
    if (!aptitude) {
      throw new NotFoundException(`Aptitude '${aptitudeId}' not found`);
    }
    return AptitudeResponseMapper.toDto(aptitude);
  }
}

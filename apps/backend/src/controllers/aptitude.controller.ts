import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AptitudeService } from "../domain/aptitude/aptitude.service.js";
import { AptitudeResponseDto } from "../domain/character/dto/AptitudeResponseDto.js";

@ApiTags("aptitudes")
@Controller("aptitudes")
export class AptitudeController {
  constructor(private readonly aptitudeService: AptitudeService) {}

  @Get()
  @ApiOperation({ summary: "Get all aptitudes definitions" })
  @ApiResponse({ status: 200, description: "List of all aptitudes", type: [AptitudeResponseDto] })
  async getAll(): Promise<AptitudeResponseDto[]> {
    const aptitudes = await this.aptitudeService.findAll();
    return aptitudes.map((apt) => new AptitudeResponseDto(apt));
  }
}

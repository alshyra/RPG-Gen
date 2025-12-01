import {
  Controller, Get, Param,
} from '@nestjs/common';
import { ItemDefinitionService } from './item-definition.service.js';
import { ApiResponse } from '@nestjs/swagger';
import { ItemDefinitionDto } from './item-definition.dto.js';

@Controller('items')
export class ItemDefinitionController {
  constructor(private readonly service: ItemDefinitionService) {}

  @Get()
  async list() {
    return this.service.findAll();
  }

  @Get(':definitionId')
  @ApiResponse({
    type: ItemDefinitionDto,
    status: 200,
  })
  async get(@Param('definitionId') definitionId: string) {
    return this.service.findByDefinitionId(definitionId);
  }
}

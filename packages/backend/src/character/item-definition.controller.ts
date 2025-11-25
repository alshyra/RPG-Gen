import { Controller, Get, Param } from '@nestjs/common';
import { ItemDefinitionService } from './item-definition.service.js';

@Controller('items')
export class ItemDefinitionController {
  constructor(private readonly service: ItemDefinitionService) {}

  @Get()
  async list() {
    return this.service.findAll();
  }

  @Get(':definitionId')
  async get(@Param('definitionId') definitionId: string) {
    return this.service.findByDefinitionId(definitionId);
  }
}

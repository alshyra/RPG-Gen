import {
  Body,
  Controller,
  Delete,
  Logger,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../../auth/infrastructure/auth/guards/JwtAuthGuard.js";
import type { RPGRequest } from "../../../../global.types.js";
import { CharacterAppService } from "../../application/services/CharacterAppService.js";
import { CharacterDtoMapper } from "../dto/mappers/CharacterDtoMapper.js";
import {
  CreateInventoryItemDto,
  EquipInventoryDto,
  RemoveInventoryBodyDto,
} from "../dto/request/index.js";
import { CharacterResponseDto } from "../dto/response/index.js";

@ApiTags("character-inventory")
@Controller("characters/:characterId/inventory")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CharacterInventoryController {
  private readonly logger = new Logger(CharacterInventoryController.name);

  constructor(
    private characterAppService: CharacterAppService,
    private dtoMapper: CharacterDtoMapper,
  ) {}

  @Post()
  @ApiOperation({ summary: "Add an item to character's inventory" })
  @ApiResponse({
    status: 201,
    description: "Item added to inventory",
    type: CharacterResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Character not found",
  })
  async addItem(
    @Req() req: RPGRequest,
    @Param("characterId") characterId: string,
    @Body() item: CreateInventoryItemDto,
  ) {
    const { user } = req;
    const userId = user.id;

    const character = await this.characterAppService.addInventoryItem(userId, characterId, item);
    return this.dtoMapper.toEnrichedDto(character);
  }

  @Post("equip")
  @ApiOperation({ summary: "Equip an item by definitionId (weapon only)" })
  @ApiBody({ type: EquipInventoryDto })
  @ApiResponse({
    status: 200,
    description: "Character updated with equipped item",
    type: CharacterResponseDto,
  })
  async equipItem(
    @Req() req: RPGRequest,
    @Param("characterId") characterId: string,
    @Body() body: { definitionId: string },
  ) {
    const { user } = req;
    const userId = user.id;
    const character = await this.characterAppService.equipItem(
      userId,
      characterId,
      body.definitionId,
    );
    return this.dtoMapper.toEnrichedDto(character);
  }

  @Patch(":itemId")
  @ApiOperation({ summary: "Update an item in character's inventory" })
  @ApiResponse({
    status: 200,
    description: "Inventory item updated",
    type: CharacterResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Character or item not found",
  })
  @ApiBody({ type: CreateInventoryItemDto })
  async updateItem(
    @Req() req: RPGRequest,
    @Param("characterId") characterId: string,
    @Param("itemId") itemId: string,
    @Body() updates: CreateInventoryItemDto,
  ) {
    const { user } = req;
    const userId = user.id;

    const character = await this.characterAppService.updateInventoryItem(
      userId,
      characterId,
      itemId,
      updates,
    );
    return this.dtoMapper.toEnrichedDto(character);
  }

  @Delete(":itemId")
  @ApiOperation({ summary: "Remove an item from character's inventory" })
  @ApiBody({ type: RemoveInventoryBodyDto })
  @ApiResponse({
    status: 200,
    description: "Item removed from inventory",
    type: CharacterResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Character or item not found",
  })
  async removeItem(
    @Req() req: RPGRequest,
    @Param("characterId") characterId: string,
    @Param("itemId") itemId: string,
    @Body() body: RemoveInventoryBodyDto,
  ) {
    const { user } = req;
    const userId = user.id;

    const character = await this.characterAppService.removeInventoryItem(
      userId,
      characterId,
      itemId,
      body.qty,
    );
    return this.dtoMapper.toEnrichedDto(character);
  }
}

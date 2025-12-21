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
import { JwtAuthGuard } from "../../domain/auth/jwt-auth.guard.js";
import type { RPGRequest } from "../../global.types.js";
import { CharacterService } from "../../domain/character/character.service.js";
import { CreateInventoryItemDto } from "../../domain/character/dto/CreateInventoryItemDto.js";
import { EquipInventoryDto } from "../../domain/character/dto/EquipInventoryDto.js";
import {
  CharacterResponseDto,
  RemoveInventoryBodyDto,
} from "../../domain/character/dto/index.js";

@ApiTags("character-inventory")
@Controller("characters/:characterId/inventory")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CharacterInventoryController {
  private readonly logger = new Logger(CharacterInventoryController.name);

  constructor(
    private characterService: CharacterService,
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
    const userId = user._id.toString();

    const character = await this.characterService.addInventoryItem(userId, characterId, item);
    return new CharacterResponseDto(character);
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
    const userId = user._id.toString();
    const character = await this.characterService.equipInventoryItem(
      userId,
      characterId,
      body.definitionId,
    );
    return new CharacterResponseDto(character);
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
    const userId = user._id.toString();

    const character = await this.characterService.updateInventoryItem(
      userId,
      characterId,
      itemId,
      updates,
    );
    return new CharacterResponseDto(character);
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
    const userId = user._id.toString();

    const character = await this.characterService.removeInventoryItem(
      userId,
      characterId,
      itemId,
      body.qty,
    );
    return new CharacterResponseDto(character);
  }
}

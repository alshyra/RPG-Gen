import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import * as Joi from 'joi';

const schema = Joi.object({ token: Joi.string().allow('').optional(), prompt: Joi.string().required(), model: Joi.string().optional() });

@ApiTags('image')
@Controller('image')
export class ImageController {
  @Post()
  @ApiOperation({ summary: 'Generate image from prompt' })
  @ApiBody({ schema: { type: 'object' } })
  async generate(@Body() body: any) {
    const { error, value } = schema.validate(body);
    if (error) throw new BadRequestException(error.message);
    // Image generation not implemented yet
    throw new BadRequestException('Image generation is not yet implemented');
  }
}


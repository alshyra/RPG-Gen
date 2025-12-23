import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Aptitude, AptitudeSchema } from "./infrastructure/persistence/mongo/schemas/Aptitude.js";
import { AptitudeService } from "./application/services/AptitudeService.js";
import { AptitudeController } from "./api/controllers/AptitudeController.js";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Aptitude.name,
        schema: AptitudeSchema,
      },
    ]),
  ],
  controllers: [AptitudeController],
  providers: [AptitudeService],
  exports: [AptitudeService],
})
export class AptitudeModule {}

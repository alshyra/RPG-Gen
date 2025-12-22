import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Aptitude, AptitudeSchema } from "../../infra/mongo/aptitude/Aptitude.js";
import { AptitudeService } from "./aptitude.service.js";
import { AptitudeController } from "../../controllers/aptitude.controller.js";

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

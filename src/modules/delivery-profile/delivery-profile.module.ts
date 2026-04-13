import { Module } from "@nestjs/common";
import { DeliveryProfile } from "./entity/delivery-profile.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DeliveryProfileService } from "./delivery-profile.service";
import { DeliveryProfileResolver } from "./delivery-profile.resolver";


@Module({
    imports : [TypeOrmModule.forFeature([DeliveryProfile])],
    providers : [DeliveryProfileService , DeliveryProfileResolver]
})

export class DeliveryProfileModule {}
import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeliveryProfile } from "./entity/delivery-profile.entity";
import { Repository } from "typeorm";
import { CreateDeliveryProfileInput } from "./dto/create-delivery-profile.input";
import { UpdateDeliveryProfileInput } from "./dto/update-delivery-profile.input";

@Injectable()
export class DeliveryProfileService {
constructor(
@InjectRepository(DeliveryProfile)
private readonly deliveryProfileRepo : Repository<DeliveryProfile>) {}

async create(input : CreateDeliveryProfileInput , user : any) {
  const profile = this.deliveryProfileRepo.create({
    ...input,
    user : { id : user.userId}
  })
  const savedProfile = await this.deliveryProfileRepo.save(profile);
  return this.deliveryProfileRepo.findOne({
    where: { id: savedProfile.id },
    relations: ['user']
  });
}

findAll(user : any){
  return this.deliveryProfileRepo.find({
    where : { user : {id : user.userId}},
    relations: ['user']
  })
}
async findOne(id: string, user: any) {
    const profile = await this.deliveryProfileRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!profile) throw new NotFoundException('Profile not found');

    if (profile.user.id !== user.userId) {
      throw new ForbiddenException('Access denied');
    }

    return profile;
  }

  // UPDATE
  async update(input: UpdateDeliveryProfileInput, user: any) {
    const profile = await this.findOne(input.id, user);

    Object.assign(profile, input);
    return this.deliveryProfileRepo.save(profile);
  }

}
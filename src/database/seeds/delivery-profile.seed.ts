import { DataSource } from 'typeorm';
import { DeliveryProfile } from '../../modules/delivery-profile/entity/delivery-profile.entity';
import { User } from '../../modules/users/entity/users.entity';
import { Role } from '../../modules/roles/entity/roles.entity';
import dataSource from '../../config/data-source';
import * as bcrypt from 'bcrypt';

export class DeliveryProfileSeed {
  private dataSource: DataSource;

  constructor() {
    this.dataSource = dataSource;
  }

  async run() {
    try {
      await this.dataSource.initialize();
      const deliveryProfileRepo = this.dataSource.getRepository(DeliveryProfile);
      const userRepo = this.dataSource.getRepository(User);
      const roleRepo = this.dataSource.getRepository(Role);

      // Get delivery role
      const deliveryRole = await roleRepo.findOne({
        where: { name: 'delivery' },
      });

      if (!deliveryRole) {
        await this.dataSource.destroy();
        return;
      }

      // Get all delivery users
      const deliveryUsers = await userRepo.find({
        where: { role: { id: deliveryRole.id } },
      });

      if (deliveryUsers.length === 0) {
        await this.dataSource.destroy();
        return;
      }


      // Create delivery profiles with different locations for testing distance-based assignment
      const deliveryProfiles = [
        {
          userId: deliveryUsers[0].id,
          vehicleType: 'BIKE',
          vehicleName: 'Honda Shine',
          rcBookPhoto: 'https://example.com/rc-book-1.jpg',
          licensePhoto: 'https://example.com/license-1.jpg',
          addressLine1: '123 Main Street',
          addressLine2: 'Apt 4B',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          location: 'Bandra West',
          latitude: 19.0760,
          longitude: 72.8777,
          isAvailable: true,
        },
        {
          userId: deliveryUsers[0].id,
          vehicleType: 'SCOOTER',
          vehicleName: 'Honda Activa',
          rcBookPhoto: 'https://example.com/rc-book-2.jpg',
          licensePhoto: 'https://example.com/license-2.jpg',
          addressLine1: '456 Park Avenue',
          addressLine2: 'Flat 8C',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400050',
          location: 'Andheri East',
          latitude: 19.1196,
          longitude: 72.8459,
          isAvailable: true,
        },
        {
          userId: deliveryUsers[1].id,
          vehicleType: 'BIKE',
          vehicleName: 'Royal Enfield Classic',
          rcBookPhoto: 'https://example.com/rc-book-3.jpg',
          licensePhoto: 'https://example.com/license-3.jpg',
          addressLine1: '789 Marine Drive',
          addressLine2: 'Building 2',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400020',
          location: 'Nariman Point',
          latitude: 18.9284,
          longitude: 72.8258,
          isAvailable: true,
        },
        {
          userId: deliveryUsers[1].id,
          vehicleType: 'SCOOTER',
          vehicleName: 'TVS Jupiter',
          rcBookPhoto: 'https://example.com/rc-book-4.jpg',
          licensePhoto: 'https://example.com/license-4.jpg',
          addressLine1: '321 Link Road',
          addressLine2: 'Shop 5',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400058',
          location: 'Borivali West',
          latitude: 19.2307,
          longitude: 72.8567,
          isAvailable: true,
        },
      ];

      // Create additional delivery users and profiles to reach 20
      const additionalDeliveryUsers = [
        { firstName: 'frank', lastName: 'rider', email: 'frank@yopmail.com', mobile: '9876543217' },
        { firstName: 'grace', lastName: 'driver', email: 'grace@yopmail.com', mobile: '9876543218' },
        { firstName: 'henry', lastName: 'courier', email: 'henry@yopmail.com', mobile: '9876543219' },
        { firstName: 'iris', lastName: 'deliver', email: 'iris@yopmail.com', mobile: '9876543220' },
        { firstName: 'jack', lastName: 'express', email: 'jack@yopmail.com', mobile: '9876543221' },
        { firstName: 'kate', lastName: 'swift', email: 'kate@yopmail.com', mobile: '9876543222' },
        { firstName: 'leo', lastName: 'speed', email: 'leo@yopmail.com', mobile: '9876543223' },
        { firstName: 'mia', lastName: 'quick', email: 'mia@yopmail.com', mobile: '9876543224' },
        { firstName: 'noah', lastName: 'fast', email: 'noah@yopmail.com', mobile: '9876543225' },
        { firstName: 'olivia', lastName: 'rush', email: 'olivia@yopmail.com', mobile: '9876543226' },
        { firstName: 'peter', lastName: 'dash', email: 'peter@yopmail.com', mobile: '9876543227' },
        { firstName: 'quinn', lastName: 'zoom', email: 'quinn@yopmail.com', mobile: '9876543228' },
        { firstName: 'ryan', lastName: 'bolt', email: 'ryan@yopmail.com', mobile: '9876543229' },
        { firstName: 'sara', lastName: 'race', email: 'sara@yopmail.com', mobile: '9876543230' },
        { firstName: 'tom', lastName: 'fly', email: 'tom@yopmail.com', mobile: '9876543231' },
        { firstName: 'uma', lastName: 'go', email: 'uma@yopmail.com', mobile: '9876543232' },
        { firstName: 'victor', lastName: 'move', email: 'victor@yopmail.com', mobile: '9876543233' },
        { firstName: 'wendy', lastName: 'run', email: 'wendy@yopmail.com', mobile: '9876543234' },
      ];

      const vehicleTypes = ['BIKE', 'SCOOTER', 'BICYCLE'];
      const vehicleNames = [
        'Honda Shine',
        'Honda Activa',
        'Royal Enfield Classic',
        'TVS Jupiter',
        'Bajaj Pulsar',
        'Suzuki Access',
        'Hero Splendor',
        'Yamaha Fascino',
      ];
      const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune'];
      const locations = [
        'Bandra West', 'Andheri East', 'Nariman Point', 'Borivali West', 'Dadar',
        'Connaught Place', 'Karol Bagh', 'Indiranagar', 'Koramangala', 'T Nagar',
        'Koregaon Park', 'Shivaji Nagar', 'Powai', 'Thane', 'Navi Mumbai',
      ];

      // Create additional delivery users
      for (let i = 0; i < additionalDeliveryUsers.length; i++) {
        const userData = additionalDeliveryUsers[i];
        const existingUser = await userRepo.findOne({
          where: { email: userData.email },
        });

        let user;
        if (!existingUser) {
          user = userRepo.create({
            ...userData,
            password: await bcrypt.hash('Delivery@123', 10),
            isVerified: true,
            adminApproved: true,
            role: deliveryRole,
          });
          user = await userRepo.save(user);
        } else {
          user = existingUser;
        }

        // Create 1-2 profiles per user to reach ~20 profiles
        const profilesPerUser = i < 4 ? 2 : 1;
        for (let j = 0; j < profilesPerUser; j++) {
          const baseLat = 18.5 + Math.random() * 2;
          const baseLon = 72.5 + Math.random() * 2;

          const addressLine2 = j % 2 === 0 ? `Flat ${Math.floor(Math.random() * 20) + 1}` : undefined;

          const profile = deliveryProfileRepo.create({
            user,
            vehicleType: vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)],
            vehicleName: vehicleNames[Math.floor(Math.random() * vehicleNames.length)],
            rcBookPhoto: `https://example.com/rc-book-${i}-${j}.jpg`,
            licensePhoto: `https://example.com/license-${i}-${j}.jpg`,
            addressLine1: `${Math.floor(Math.random() * 1000) + 1} Street Name`,
            addressLine2: addressLine2,
            city: cities[Math.floor(Math.random() * cities.length)],
            state: 'Maharashtra',
            pincode: `${Math.floor(Math.random() * 900000) + 100000}`,
            location: locations[Math.floor(Math.random() * locations.length)],
            latitude: parseFloat(baseLat.toFixed(4)),
            longitude: parseFloat(baseLon.toFixed(4)),
            isAvailable: Math.random() > 0.3, // 70% chance of being available
          });

          await deliveryProfileRepo.save(profile);
        }
      }

      // Create initial profiles for existing delivery users
      for (const profileData of deliveryProfiles) {
        const existingProfile = await deliveryProfileRepo.findOne({
          where: { user: { id: profileData.userId } },
          relations: ['user'],
        });

        if (!existingProfile) {
          const user = await userRepo.findOne({
            where: { id: profileData.userId },
          });

          if (user) {
            const profile = deliveryProfileRepo.create({
              ...profileData,
              user,
              addressLine2: profileData.addressLine2 || undefined,
            });
            await deliveryProfileRepo.save(profile);
          }
        }
      }

      const totalProfiles = await deliveryProfileRepo.count();

      await this.dataSource.destroy();
    } catch (error) {
      console.error('Error in delivery profile seed:', error);
      await this.dataSource.destroy();
      throw error;
    }
  }
}

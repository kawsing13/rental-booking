'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Seeds a demo admin account and a starter catalog so the app is usable
// immediately after `npm run migrate && npm run seed`.
module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    const adminId = uuidv4();
    const customerId = uuidv4();
    const passwordHash = await bcrypt.hash('Password123!', 10);

    await queryInterface.bulkInsert('users', [
      {
        id: adminId,
        name: 'Admin User',
        email: 'admin@rentalapp.test',
        phone: '09170000000',
        password_hash: passwordHash,
        role: 'admin',
        address: 'Main Warehouse, Manila',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: customerId,
        name: 'Demo Customer',
        email: 'customer@rentalapp.test',
        phone: '09171111111',
        password_hash: passwordHash,
        role: 'customer',
        address: '123 Sample St, Quezon City',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);

    await queryInterface.bulkInsert('items', [
      {
        id: uuidv4(),
        name: 'Monoblock Chair (White)',
        category: 'chair',
        description: 'Sturdy stackable monoblock chair, seats 1.',
        rental_price: 15.0,
        quantity_total: 300,
        images: JSON.stringify([]),
        rental_terms: 'Minimum order 20 pcs. Damage fee applies for cracked chairs.',
        status: 'available',
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        name: 'Round Table (10-seater)',
        category: 'table',
        description: '60-inch round table, seats up to 10 guests.',
        rental_price: 150.0,
        quantity_total: 40,
        images: JSON.stringify([]),
        rental_terms: 'Comes with plastic cover. Free delivery within 5km.',
        status: 'available',
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        name: 'Rectangular Table (6ft)',
        category: 'table',
        description: 'Foldable rectangular table, seats up to 8 guests.',
        rental_price: 120.0,
        quantity_total: 30,
        images: JSON.stringify([]),
        rental_terms: 'Comes with plastic cover.',
        status: 'available',
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        name: 'Karaoke Set (Standard)',
        category: 'karaoke',
        description: '2 wireless mics, amplifier, speaker, 10,000+ songs.',
        rental_price: 1500.0,
        quantity_total: 5,
        images: JSON.stringify([]),
        rental_terms: 'Requires refundable damage deposit of PHP 2,000.',
        status: 'available',
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        name: 'Karaoke Set (Premium with Lights)',
        category: 'karaoke',
        description: '4 wireless mics, subwoofer, DJ lights, fog machine.',
        rental_price: 3000.0,
        quantity_total: 2,
        images: JSON.stringify([]),
        rental_terms: 'Requires refundable damage deposit of PHP 5,000. Technician included.',
        status: 'available',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('items', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};

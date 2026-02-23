/**
 * Seed mock data for Customer module testing
 * Run with: npx tsx scripts/seed-mock-data.ts
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pool from '../src/config/db.js';

async function seed() {
    const client = await pool.connect();
    try {
        console.log('Starting seed process...');
        await client.query('BEGIN');

        // 1. Get Roles
        const { rows: roles } = await client.query("SELECT id_role, code FROM roles WHERE code IN ('AREA_OWNER')");
        const ownerRoleId = roles.find(r => r.code === 'AREA_OWNER')?.id_role;

        if (!ownerRoleId) {
            throw new Error('AREA_OWNER role not found. Please run schema.sql first.');
        }

        // 2. Get/Create a default Area (Da Nang) if not exists
        let { rows: areas } = await client.query("SELECT id_area FROM area LIMIT 1");
        let areaId = areas[0]?.id_area;

        if (!areaId) {
            // Find a city first
            let { rows: cities } = await client.query("SELECT id_city FROM cities LIMIT 1");
            let cityId = cities[0]?.id_city;

            if (!cityId) {
                throw new Error('No cities found. Please run geography crawl scripts first.');
            }

            const { rows: newArea } = await client.query(
                "INSERT INTO area (id_city, name, status) VALUES ($1, 'Đà Nẵng Center', 'active') RETURNING id_area",
                [cityId]
            );
            areaId = newArea[0].id_area;
        }

        const passwordHash = await bcrypt.hash('Travel123!', 10);

        // --- 1. WonderTours (TOUR) ---
        console.log('Creating WonderTours...');
        const owner1Email = 'wondertours@example.com';
        const { rows: owner1Rows } = await client.query(
            `INSERT INTO users (email, phone, full_name, password_hash, status, email_verified_at)
       VALUES ($1, '0911222333', 'Wonder Tours Manager', $2, 'active', NOW())
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING id_user`,
            [owner1Email, passwordHash]
        );
        const owner1Id = owner1Rows[0].id_user;
        await client.query('INSERT INTO role_detail (id_role, id_user) VALUES ($1, $2) ON CONFLICT DO NOTHING', [ownerRoleId, owner1Id]);

        const { rows: provider1Rows } = await client.query(
            `INSERT INTO provider (name, id_area, id_user, phone, status)
       VALUES ('WonderTours Vietnam', $1, $2, '0911222333', 'active')
       RETURNING id_provider`,
            [areaId, owner1Id]
        );
        const provider1Id = provider1Rows[0].id_provider;

        const { rows: item1Rows } = await client.query(
            `INSERT INTO bookable_items (id_provider, id_area, item_type, title, price, description)
       VALUES ($1, $2, 'tour', 'Hạ Long Bay Luxury Cruise 2D1N', 3500000, 'Trải nghiệm du thuyền 5 sao trên vịnh Hạ Long với những hoạt động thú vị.')
       RETURNING id_item`,
            [provider1Id, areaId]
        );
        const item1Id = item1Rows[0].id_item;

        await client.query(
            `INSERT INTO tours (id_item, guide_language, start_at, end_at, max_slots, attribute)
       VALUES ($1, 'Vietnamese, English', NOW() + interval '7 days', NOW() + interval '9 days', 20, $2)`,
            [item1Id, JSON.stringify({
                tour_type: 'Luxury',
                duration_days: 2,
                itinerary: [
                    { day: 1, title: 'Hà Nội - Hạ Long', activities: ['Đón khách tại Hà Nội', 'Ăn trưa trên tàu', 'Chèo thuyền Kayak', 'Tiệc trà chiều'] },
                    { day: 2, title: 'Hang Sửng Sốt - Hà Nội', activities: ['Tập Thái Cực Quyền', 'Thăm Hang Sửng Sốt', 'Ăn trưa buffet', 'Về lại Hà Nội'] }
                ],
                tour_highlights: ['Du thuyền 5 sao', 'Kayak trên vịnh', 'Buffet hải sản']
            })]
        );

        // --- 2. GrandPlaza (ACCOMMODATION) ---
        console.log('Creating GrandPlaza...');
        const owner2Email = 'grandplaza@example.com';
        const { rows: owner2Rows } = await client.query(
            `INSERT INTO users (email, phone, full_name, password_hash, status, email_verified_at)
       VALUES ($1, '0922333444', 'Grand Plaza Owner', $2, 'active', NOW())
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING id_user`,
            [owner2Email, passwordHash]
        );
        const owner2Id = owner2Rows[0].id_user;
        await client.query('INSERT INTO role_detail (id_role, id_user) VALUES ($1, $2) ON CONFLICT DO NOTHING', [ownerRoleId, owner2Id]);

        const { rows: provider2Rows } = await client.query(
            `INSERT INTO provider (name, id_area, id_user, phone, status)
       VALUES ('Grand Plaza Resort', $1, $2, '0922333444', 'active')
       RETURNING id_provider`,
            [areaId, owner2Id]
        );
        const provider2Id = provider2Rows[0].id_provider;

        const { rows: item2Rows } = await client.query(
            `INSERT INTO bookable_items (id_provider, id_area, item_type, title, price, description, attribute)
       VALUES ($1, $2, 'accommodation', 'Grand Plaza Resort & Spa', 2500000, 'Khu nghỉ dưỡng sang trọng bậc nhất bên bờ biển.', $3)
       RETURNING id_item`,
            [provider2Id, areaId, JSON.stringify({
                stars: 5,
                amenities: ['Wifi', 'Hồ bơi', 'Spa', 'GYM', 'Nhà hàng'],
                description: 'Tận hưởng kỳ nghỉ thiên đường với dịch vụ đẳng cấp quốc tế.'
            })]
        );
        const item2Id = item2Rows[0].id_item;

        await client.query(
            `INSERT INTO accommodations (id_item, address) VALUES ($1, '123 Võ Nguyên Giáp, Đà Nẵng')`,
            [item2Id]
        );

        await client.query(
            `INSERT INTO accommodations_rooms (id_item, name_room, max_guest, price, attribute)
       VALUES ($1, 'Deluxe Ocean View', 2, 2500000, $2),
              ($1, 'Family Suite', 4, 4500000, $3)`,
            [item2Id, JSON.stringify({ view: 'Ocean', bed: 'King' }), JSON.stringify({ view: 'Garden', bed: '2 Queen' })]
        );

        // --- 3. FastMove (VEHICLE) ---
        console.log('Creating FastMove...');
        const owner3Email = 'fastmove@example.com';
        const { rows: owner3Rows } = await client.query(
            `INSERT INTO users (email, phone, full_name, password_hash, status, email_verified_at)
       VALUES ($1, '0933444555', 'FastMove Transport', $2, 'active', NOW())
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING id_user`,
            [owner3Email, passwordHash]
        );
        const owner3Id = owner3Rows[0].id_user;
        await client.query('INSERT INTO role_detail (id_role, id_user) VALUES ($1, $2) ON CONFLICT DO NOTHING', [ownerRoleId, owner3Id]);

        const { rows: provider3Rows } = await client.query(
            `INSERT INTO provider (name, id_area, id_user, phone, status)
       VALUES ('FastMove Trans', $1, $2, '0933444555', 'active')
       RETURNING id_provider`,
            [areaId, owner3Id]
        );
        const provider3Id = provider3Rows[0].id_provider;

        const { rows: item3Rows } = await client.query(
            `INSERT INTO bookable_items (id_provider, id_area, item_type, title, price, description)
       VALUES ($1, $2, 'vehicle', 'VIP Limousine Transfer', 500000, 'Dịch vụ xe Limousine đời mới, đón tận nơi.')
       RETURNING id_item`,
            [provider3Id, areaId]
        );
        const item3Id = item3Rows[0].id_item;

        const { rows: vehicleRows } = await client.query(
            `INSERT INTO vehicle (id_item, code_vehicle, max_guest, attribute)
       VALUES ($1, 'VIP-999', 9, $2)
       RETURNING id_vehicle`,
            [item3Id, JSON.stringify({ type: 'Limousine', year: 2024 })]
        );
        const vehicleId = vehicleRows[0].id_vehicle;

        // Add some positions (seats)
        for (let i = 1; i <= 9; i++) {
            await client.query(
                `INSERT INTO positions (id_vehicle, code_position, price) VALUES ($1, $2, $3)`,
                [vehicleId, `S${i}`, 500000]
            );
        }

        // Add some media for all
        console.log('Adding mock images...');
        const images = [
            { id: item1Id, url: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800' },
            { id: item2Id, url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800' },
            { id: item3Id, url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800' }
        ];

        for (const img of images) {
            await client.query(`INSERT INTO item_media (id_item, url, type) VALUES ($1, $2, 'image')`, [img.id, img.url]);
        }

        await client.query('COMMIT');
        console.log('Seeding completed successfully!');
        console.log('Accounts created:');
        console.log(`- WonderTours: ${owner1Email} / Travel123!`);
        console.log(`- GrandPlaza: ${owner2Email} / Travel123!`);
        console.log(`- FastMove: ${owner3Email} / Travel123!`);
        process.exit(0);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Seed error:', err);
        process.exit(1);
    } finally {
        client.release();
    }
}

seed();

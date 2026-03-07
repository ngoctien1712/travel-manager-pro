
import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
    connectionString: "postgresql://postgres:17122004@localhost:5432/travel_manager"
});

async function update() {
    await client.connect();
    console.log("Connected to DB");

    try {
        // 1. Drop old PK
        await client.query('ALTER TABLE order_pos_vehicle_detail DROP CONSTRAINT IF EXISTS order_pos_vehicle_detail_pkey');
        console.log("Dropped old PK");

        // 2. Add new PK (id_order, id_position)
        await client.query('ALTER TABLE order_pos_vehicle_detail ADD PRIMARY KEY (id_order, id_position)');
        console.log("Added new PK (id_order, id_position)");

        // 3. Make id_trip nullable
        await client.query('ALTER TABLE order_pos_vehicle_detail ALTER COLUMN id_trip DROP NOT NULL');
        console.log("Made id_trip nullable");

    } catch (err) {
        console.error("Error updating table:", err.message);
    } finally {
        await client.end();
    }
}

update();

/**
 * Seed areas with attribute (JSONB) from static data or future crawl.
 * Run after crawl-cities. Run: npx tsx scripts/crawl-areas.ts
 * For real crawl: replace staticAreas with data from Wikipedia/WikiVoyage/OSM.
 */
import 'dotenv/config';
import pool from '../src/config/db.js';
import type { AreaAttribute } from '../src/types/geography.js';

interface AreaSeed {
  cityName: string;
  countryCode: string;
  name: string;
  attribute: AreaAttribute;
}

const staticAreas: AreaSeed[] = [
  {
    cityName: 'Ho Chi Minh City',
    countryCode: 'VN',
    name: 'District 1',
    attribute: {
      climate_type: 'tropical',
      average_temperature: { min: 22, max: 35, unit: 'celsius' },
      rainy_season: { from_month: 5, to_month: 11 },
      best_travel_months: [12, 1, 2, 3],
      weather_notes: ['Dry season best for sightseeing', 'Rainy season afternoon showers'],
    },
  },
  {
    cityName: 'Hanoi',
    countryCode: 'VN',
    name: 'Hoan Kiem District',
    attribute: {
      climate_type: 'subtropical',
      average_temperature: { min: 15, max: 33, unit: 'celsius' },
      rainy_season: { from_month: 5, to_month: 9 },
      best_travel_months: [10, 11, 3, 4],
      weather_notes: ['Winter can be chilly', 'Spring and autumn ideal'],
    },
  },
  {
    cityName: 'Da Nang',
    countryCode: 'VN',
    name: 'My Khe',
    attribute: {
      climate_type: 'tropical',
      average_temperature: { min: 20, max: 34, unit: 'celsius' },
      rainy_season: { from_month: 9, to_month: 12 },
      best_travel_months: [2, 3, 4, 5, 6],
      weather_notes: ['Beach season Feb–Jul', 'Typhoon risk Sep–Dec'],
    },
  },
];

async function crawlAreas() {
  try {
    const { rows: countryRows } = await pool.query('SELECT id_country, code FROM countries');
    const byCode = new Map(countryRows.map((r: { id_country: string; code: string }) => [r.code, r.id_country]));

    let inserted = 0;
    for (const a of staticAreas) {
      const idCountry = byCode.get(a.countryCode);
      if (!idCountry) continue;

      const { rows: cityRows } = await pool.query(
        'SELECT id_city FROM cities WHERE id_country = $1 AND name = $2 LIMIT 1',
        [idCountry, a.cityName]
      );
      const idCity = cityRows[0]?.id_city;
      if (!idCity) continue;

      const { rows: existing } = await pool.query(
        'SELECT id_area FROM area WHERE id_city = $1 AND name = $2 LIMIT 1',
        [idCity, a.name]
      );
      if (existing.length > 0) continue;

      await pool.query(
        'INSERT INTO area (id_city, name, attribute, status) VALUES ($1, $2, $3, $4)',
        [idCity, a.name, JSON.stringify(a.attribute), 'active']
      );
      inserted++;
    }

    console.log('Areas seed done. Inserted:', inserted);
    process.exit(0);
  } catch (err) {
    console.error('Areas seed failed:', err);
    process.exit(1);
  }
}

crawlAreas();

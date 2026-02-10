/**
 * Seed point_of_interest with poi_type (JSONB) from static data or future crawl.
 * Run after crawl-areas. Run: npx tsx scripts/crawl-poi.ts
 * For real crawl: use OSM/Google Places and map to PoiType structure.
 */
import 'dotenv/config';
import pool from '../src/config/db.js';
import type { PoiType } from '../src/types/geography.js';

interface PoiSeed {
  areaName: string;
  cityName: string;
  countryCode: string;
  name: string;
  poi_type: PoiType;
}

const staticPois: PoiSeed[] = [
  {
    areaName: 'District 1',
    cityName: 'Ho Chi Minh City',
    countryCode: 'VN',
    name: 'Ben Thanh Market',
    poi_type: {
      poi_category: 'attraction',
      poi_sub_type: 'market',
      rating: { score: 4.2, reviews_count: 15200 },
      price_range: { level: '$', min: 10000, max: 100000, currency: 'VND' },
      activities: ['eat', 'sightseeing', 'shopping'],
      recommended_time: { time_of_day: ['morning', 'evening'], avg_duration_minutes: 120 },
      crowd_level: { weekday: 'high', weekend: 'high' },
      suitability: { solo: true, couple: true, family: true, group: true },
      tags: ['local_food', 'popular', 'souvenirs'],
    },
  },
  {
    areaName: 'Hoan Kiem District',
    cityName: 'Hanoi',
    countryCode: 'VN',
    name: 'Hoan Kiem Lake',
    poi_type: {
      poi_category: 'attraction',
      poi_sub_type: 'landmark',
      rating: { score: 4.6, reviews_count: 22000 },
      activities: ['sightseeing', 'relax'],
      recommended_time: { time_of_day: ['morning', 'evening'], avg_duration_minutes: 60 },
      crowd_level: { weekday: 'medium', weekend: 'high' },
      suitability: { solo: true, couple: true, family: true, group: true },
      tags: ['historic', 'view_beautiful'],
    },
  },
  {
    areaName: 'My Khe',
    cityName: 'Da Nang',
    countryCode: 'VN',
    name: 'My Khe Beach',
    poi_type: {
      poi_category: 'attraction',
      poi_sub_type: 'beach',
      rating: { score: 4.5, reviews_count: 8400 },
      activities: ['relax', 'sightseeing'],
      recommended_time: { time_of_day: ['morning', 'afternoon'], avg_duration_minutes: 180 },
      crowd_level: { weekday: 'medium', weekend: 'high' },
      suitability: { solo: true, couple: true, family: true, group: true },
      tags: ['beach', 'popular'],
    },
  },
];

async function crawlPoi() {
  try {
    const { rows: countryRows } = await pool.query('SELECT id_country, code FROM countries');
    const byCode = new Map(countryRows.map((r: { id_country: string; code: string }) => [r.code, r.id_country]));

    let inserted = 0;
    for (const p of staticPois) {
      const idCountry = byCode.get(p.countryCode);
      if (!idCountry) continue;

      const { rows: cityRows } = await pool.query(
        'SELECT id_city FROM cities WHERE id_country = $1 AND name = $2 LIMIT 1',
        [idCountry, p.cityName]
      );
      const idCity = cityRows[0]?.id_city;
      if (!idCity) continue;

      const { rows: areaRows } = await pool.query(
        'SELECT id_area FROM area WHERE id_city = $1 AND name = $2 LIMIT 1',
        [idCity, p.areaName]
      );
      const idArea = areaRows[0]?.id_area;
      if (!idArea) continue;

      const { rows: existing } = await pool.query(
        'SELECT id_poi FROM point_of_interest WHERE id_area = $1 AND name = $2 LIMIT 1',
        [idArea, p.name]
      );
      if (existing.length > 0) continue;

      await pool.query(
        'INSERT INTO point_of_interest (id_area, name, poi_type) VALUES ($1, $2, $3)',
        [idArea, p.name, JSON.stringify(p.poi_type)]
      );
      inserted++;
    }

    console.log('POI seed done. Inserted:', inserted);
    process.exit(0);
  } catch (err) {
    console.error('POI seed failed:', err);
    process.exit(1);
  }
}

crawlPoi();

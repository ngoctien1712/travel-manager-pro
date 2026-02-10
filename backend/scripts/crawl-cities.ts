/**
 * Crawl cities from Countries Now API and insert into DB.
 * Requires countries to exist (run crawl-countries.ts first).
 * Run: npx tsx scripts/crawl-cities.ts
 */
import 'dotenv/config';
import pool from '../src/config/db.js';

const COUNTRIES_NOW_URL = 'https://countriesnow.space/api/v0.1/countries';

interface CountryCityItem {
  iso2: string;
  iso3: string;
  country: string;
  cities: string[];
}

async function crawlCities() {
  try {
    const res = await fetch(COUNTRIES_NOW_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as { data?: CountryCityItem[] };
    const data = body.data ?? [];

    const { rows: countryRows } = await pool.query('SELECT id_country, code FROM countries');
    const byCode = new Map(countryRows.map((r: { id_country: string; code: string }) => [r.code, r.id_country]));

    let inserted = 0;
    for (const item of data) {
      const idCountry = byCode.get(item.iso2) ?? byCode.get(item.iso3);
      if (!idCountry) continue;

      for (const cityName of item.cities || []) {
        if (!cityName?.trim()) continue;
        const name = cityName.trim().slice(0, 255);
        const r = await pool.query(
          `INSERT INTO cities (id_country, name)
           SELECT $1, $2
           WHERE NOT EXISTS (SELECT 1 FROM cities WHERE id_country = $1 AND name = $2)
           RETURNING id_city`,
          [idCountry, name]
        );
        if (r.rowCount) inserted++;
      }
    }

    console.log('Cities crawl done. Rows processed:', inserted);
    process.exit(0);
  } catch (err) {
    console.error('Crawl failed:', err);
    process.exit(1);
  }
}

crawlCities();

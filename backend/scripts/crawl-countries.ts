/**
 * Crawl countries from REST Countries API and insert into DB.
 * Run: npx tsx scripts/crawl-countries.ts
 */
import 'dotenv/config';
import pool from '../src/config/db.js';

const REST_COUNTRIES_URL = 'https://restcountries.com/v3.1/all?fields=name,cca2,cca3';

interface RestCountry {
  name: { common: string; official?: string };
  cca2: string;
  cca3: string;
}

async function crawlCountries() {
  try {
    const res = await fetch(REST_COUNTRIES_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as RestCountry[];

    let processed = 0;
    for (const c of data) {
      const code = c.cca2 || c.cca3 || '';
      const name = c.name?.common ?? '';
      if (!code) continue;

      await pool.query(
        `INSERT INTO countries (code, name)
         VALUES ($1, $2)
         ON CONFLICT (code) DO UPDATE SET name = COALESCE(EXCLUDED.name, countries.name)`,
        [code, name || null]
      );
      processed++;
    }

    console.log('Countries crawl done. Processed:', processed);
    process.exit(0);
  } catch (err) {
    console.error('Crawl failed:', err);
    process.exit(1);
  }
}

crawlCountries();

/**
 * Crawl dữ liệu địa lý chỉ cho Việt Nam: thành phố (63 tỉnh thành), khu vực, POI.
 * Chạy sau crawl-countries. Run: npx tsx scripts/crawl-vietnam.ts
 */
import 'dotenv/config';
import pool from '../src/config/db.js';
import type { AreaAttribute, PoiType } from '../src/types/geography.js';

const VN_COUNTRY_CODE = 'VN';

// 63 tỉnh thành Việt Nam (tên tiếng Anh chuẩn, một số trùng tên thường dùng)
const VIETNAM_CITIES = [
  'Hanoi',
  'Ho Chi Minh City',
  'Da Nang',
  'Haiphong',
  'Can Tho',
  'Bien Hoa',
  'Nha Trang',
  'Hue',
  'Vung Tau',
  'Buon Ma Thuot',
  'Dalat',
  'Quy Nhon',
  'Rach Gia',
  'Thanh Hoa',
  'Nam Dinh',
  'Vinh',
  'My Tho',
  'Pleiku',
  'Long Xuyen',
  'Thai Nguyen',
  'Ha Long',
  'Viet Tri',
  'Bac Ninh',
  'Bac Giang',
  'Hai Duong',
  'Hung Yen',
  'Ninh Binh',
  'Phan Thiet',
  'Cam Ranh',
  'Kon Tum',
  'Dien Bien Phu',
  'Cao Bang',
  'Lao Cai',
  'Lang Son',
  'Son La',
  'Hoa Binh',
  'Bac Kan',
  'Tuyen Quang',
  'Yen Bai',
  'Thai Binh',
  'Ha Nam',
  'Nghe An',
  'Ha Tinh',
  'Quang Binh',
  'Quang Tri',
  'Quang Ngai',
  'Binh Dinh',
  'Phu Yen',
  'Khanh Hoa',
  'Dak Lak',
  'Dak Nong',
  'Lam Dong',
  'Binh Phuoc',
  'Tay Ninh',
  'Binh Duong',
  'Dong Nai',
  'Ba Ria - Vung Tau',
  'Long An',
  'Tien Giang',
  'Ben Tre',
  'Tra Vinh',
  'Vinh Long',
  'Dong Thap',
  'An Giang',
  'Kien Giang',
  'Ca Mau',
  'Soc Trang',
  'Hau Giang',
];

// Khu vực (quận/huyện/điểm) theo từng thành phố – name phải khớp với VIETNAM_CITIES
interface AreaSeed {
  cityName: string;
  name: string;
  attribute: AreaAttribute;
}

const VIETNAM_AREAS: AreaSeed[] = [
  { cityName: 'Ho Chi Minh City', name: 'District 1', attribute: { climate_type: 'tropical', average_temperature: { min: 22, max: 35, unit: 'celsius' }, rainy_season: { from_month: 5, to_month: 11 }, best_travel_months: [12, 1, 2, 3], weather_notes: ['Dry season best for sightseeing', 'Rainy season afternoon showers'] } },
  { cityName: 'Ho Chi Minh City', name: 'District 3', attribute: { climate_type: 'tropical', average_temperature: { min: 22, max: 35, unit: 'celsius' }, best_travel_months: [12, 1, 2, 3], weather_notes: ['Central area, many cafes and shops'] } },
  { cityName: 'Ho Chi Minh City', name: 'Phu Nhuan', attribute: { climate_type: 'tropical', average_temperature: { min: 22, max: 35, unit: 'celsius' }, best_travel_months: [12, 1, 2, 3] } },
  { cityName: 'Hanoi', name: 'Hoan Kiem District', attribute: { climate_type: 'subtropical', average_temperature: { min: 15, max: 33, unit: 'celsius' }, rainy_season: { from_month: 5, to_month: 9 }, best_travel_months: [10, 11, 3, 4], weather_notes: ['Winter can be chilly', 'Spring and autumn ideal'] } },
  { cityName: 'Hanoi', name: 'Ba Dinh District', attribute: { climate_type: 'subtropical', average_temperature: { min: 15, max: 33, unit: 'celsius' }, best_travel_months: [10, 11, 3, 4] } },
  { cityName: 'Hanoi', name: 'Tay Ho District', attribute: { climate_type: 'subtropical', average_temperature: { min: 15, max: 33, unit: 'celsius' }, best_travel_months: [10, 11, 3, 4], weather_notes: ['West Lake area'] } },
  { cityName: 'Da Nang', name: 'My Khe', attribute: { climate_type: 'tropical', average_temperature: { min: 20, max: 34, unit: 'celsius' }, rainy_season: { from_month: 9, to_month: 12 }, best_travel_months: [2, 3, 4, 5, 6], weather_notes: ['Beach season Feb–Jul', 'Typhoon risk Sep–Dec'] } },
  { cityName: 'Da Nang', name: 'Hai Chau', attribute: { climate_type: 'tropical', average_temperature: { min: 20, max: 34, unit: 'celsius' }, best_travel_months: [2, 3, 4, 5, 6] } },
  { cityName: 'Nha Trang', name: 'Tran Phu', attribute: { climate_type: 'tropical', average_temperature: { min: 22, max: 33, unit: 'celsius' }, best_travel_months: [1, 2, 3, 4], weather_notes: ['Beach city'] } },
  { cityName: 'Hue', name: 'Phu Hoi', attribute: { climate_type: 'tropical', average_temperature: { min: 18, max: 35, unit: 'celsius' }, rainy_season: { from_month: 9, to_month: 12 }, best_travel_months: [1, 2, 3, 4] } },
  { cityName: 'Dalat', name: 'Ward 3', attribute: { climate_type: 'subtropical', average_temperature: { min: 15, max: 24, unit: 'celsius' }, best_travel_months: [11, 12, 1, 2, 3], weather_notes: ['Cool climate, flowers'] } },
  { cityName: 'Ha Long', name: 'Bai Chay', attribute: { climate_type: 'tropical', average_temperature: { min: 18, max: 32, unit: 'celsius' }, best_travel_months: [10, 11, 3, 4], weather_notes: ['Ha Long Bay area'] } },
  { cityName: 'Can Tho', name: 'Ninh Kieu', attribute: { climate_type: 'tropical', average_temperature: { min: 23, max: 34, unit: 'celsius' }, best_travel_months: [12, 1, 2], weather_notes: ['Mekong Delta'] } },
];

// POI – areaName + cityName phải khớp với VIETNAM_AREAS và VIETNAM_CITIES
interface PoiSeed {
  cityName: string;
  areaName: string;
  name: string;
  poi_type: PoiType;
}

const VIETNAM_POIS: PoiSeed[] = [
  { cityName: 'Ho Chi Minh City', areaName: 'District 1', name: 'Ben Thanh Market', poi_type: { poi_category: 'attraction', poi_sub_type: 'market', rating: { score: 4.2, reviews_count: 15200 }, price_range: { level: '$', min: 10000, max: 100000, currency: 'VND' }, activities: ['eat', 'sightseeing', 'shopping'], recommended_time: { time_of_day: ['morning', 'evening'], avg_duration_minutes: 120 }, crowd_level: { weekday: 'high', weekend: 'high' }, suitability: { solo: true, couple: true, family: true, group: true }, tags: ['local_food', 'popular', 'souvenirs'] } },
  { cityName: 'Ho Chi Minh City', areaName: 'District 1', name: 'Notre-Dame Cathedral', poi_type: { poi_category: 'attraction', poi_sub_type: 'landmark', rating: { score: 4.5, reviews_count: 18000 }, activities: ['sightseeing'], recommended_time: { time_of_day: ['morning', 'afternoon'], avg_duration_minutes: 45 }, suitability: { solo: true, couple: true, family: true, group: true }, tags: ['historic', 'photo'] } },
  { cityName: 'Hanoi', areaName: 'Hoan Kiem District', name: 'Hoan Kiem Lake', poi_type: { poi_category: 'attraction', poi_sub_type: 'landmark', rating: { score: 4.6, reviews_count: 22000 }, activities: ['sightseeing', 'relax'], recommended_time: { time_of_day: ['morning', 'evening'], avg_duration_minutes: 60 }, crowd_level: { weekday: 'medium', weekend: 'high' }, suitability: { solo: true, couple: true, family: true, group: true }, tags: ['historic', 'view_beautiful'] } },
  { cityName: 'Hanoi', areaName: 'Hoan Kiem District', name: 'Old Quarter', poi_type: { poi_category: 'attraction', poi_sub_type: 'district', rating: { score: 4.7, reviews_count: 25000 }, activities: ['eat', 'sightseeing', 'shopping'], recommended_time: { time_of_day: ['evening'], avg_duration_minutes: 180 }, crowd_level: { weekday: 'high', weekend: 'high' }, suitability: { solo: true, couple: true, family: true, group: true }, tags: ['local_food', 'popular'] } },
  { cityName: 'Da Nang', areaName: 'My Khe', name: 'My Khe Beach', poi_type: { poi_category: 'attraction', poi_sub_type: 'beach', rating: { score: 4.5, reviews_count: 8400 }, activities: ['relax', 'sightseeing'], recommended_time: { time_of_day: ['morning', 'afternoon'], avg_duration_minutes: 180 }, crowd_level: { weekday: 'medium', weekend: 'high' }, suitability: { solo: true, couple: true, family: true, group: true }, tags: ['beach', 'popular'] } },
  { cityName: 'Nha Trang', areaName: 'Tran Phu', name: 'Nha Trang Beach', poi_type: { poi_category: 'attraction', poi_sub_type: 'beach', rating: { score: 4.4, reviews_count: 12000 }, activities: ['relax', 'sightseeing'], recommended_time: { time_of_day: ['morning', 'afternoon'], avg_duration_minutes: 120 }, tags: ['beach'] } },
  { cityName: 'Hue', areaName: 'Phu Hoi', name: 'Imperial City', poi_type: { poi_category: 'attraction', poi_sub_type: 'landmark', rating: { score: 4.6, reviews_count: 15000 }, activities: ['sightseeing'], recommended_time: { time_of_day: ['morning', 'afternoon'], avg_duration_minutes: 180 }, tags: ['historic', 'unesco'] } },
  { cityName: 'Dalat', areaName: 'Ward 3', name: 'Xuan Huong Lake', poi_type: { poi_category: 'attraction', poi_sub_type: 'landmark', rating: { score: 4.5, reviews_count: 9000 }, activities: ['sightseeing', 'relax'], recommended_time: { time_of_day: ['morning', 'evening'], avg_duration_minutes: 60 }, tags: ['view_beautiful'] } },
  { cityName: 'Ha Long', areaName: 'Bai Chay', name: 'Ha Long Bay', poi_type: { poi_category: 'attraction', poi_sub_type: 'natural', rating: { score: 4.8, reviews_count: 30000 }, activities: ['sightseeing'], recommended_time: { time_of_day: ['morning'], avg_duration_minutes: 480 }, tags: ['unesco', 'popular'] } },
  { cityName: 'Can Tho', areaName: 'Ninh Kieu', name: 'Cai Rang Floating Market', poi_type: { poi_category: 'attraction', poi_sub_type: 'market', rating: { score: 4.4, reviews_count: 8000 }, activities: ['eat', 'sightseeing'], recommended_time: { time_of_day: ['morning'], avg_duration_minutes: 120 }, tags: ['local_food', 'floating_market'] } },
];

async function main() {
  const client = await pool.connect();
  try {
    const { rows: countryRows } = await client.query(
      'SELECT id_country FROM countries WHERE code = $1 LIMIT 1',
      [VN_COUNTRY_CODE]
    );
    if (countryRows.length === 0) {
      console.error('Chưa tìm thấy quốc gia Vietnam (code VN). Chạy npm run crawl:countries trước.');
      process.exit(1);
    }
    const idCountry = countryRows[0].id_country;
    console.log('Đã tìm thấy Vietnam, id_country:', idCountry);

    // 1. Thành phố
    let cityInserted = 0;
    for (const name of VIETNAM_CITIES) {
      const n = name.trim().slice(0, 255);
      const r = await client.query(
        `INSERT INTO cities (id_country, name)
         SELECT $1::uuid, $2::varchar
         WHERE NOT EXISTS (SELECT 1 FROM cities WHERE id_country = $1::uuid AND name = $2::varchar)
         RETURNING id_city`,
        [idCountry, n]
      );
      if (r.rowCount) cityInserted++;
    }
    console.log('Thành phố: đã xử lý', VIETNAM_CITIES.length, ', thêm mới', cityInserted);

    // 2. Khu vực
    let areaInserted = 0;
    for (const a of VIETNAM_AREAS) {
      const { rows: cityRows } = await client.query(
        'SELECT id_city FROM cities WHERE id_country = $1::uuid AND name = $2::varchar LIMIT 1',
        [idCountry, a.cityName]
      );
      const idCity = cityRows[0]?.id_city;
      if (!idCity) {
        console.warn('Bỏ qua khu vực (không tìm thấy thành phố):', a.cityName, '-', a.name);
        continue;
      }
      const { rows: ex } = await client.query(
        'SELECT id_area FROM area WHERE id_city = $1::uuid AND name = $2::varchar LIMIT 1',
        [idCity, a.name]
      );
      if (ex.length > 0) continue;
      await client.query(
        'INSERT INTO area (id_city, name, attribute, status) VALUES ($1::uuid, $2::varchar, $3::jsonb, $4::varchar)',
        [idCity, a.name, JSON.stringify(a.attribute), 'active']
      );
      areaInserted++;
    }
    console.log('Khu vực: đã thêm', areaInserted);

    // 3. POI
    let poiInserted = 0;
    for (const p of VIETNAM_POIS) {
      const { rows: cityRows } = await client.query(
        'SELECT id_city FROM cities WHERE id_country = $1::uuid AND name = $2::varchar LIMIT 1',
        [idCountry, p.cityName]
      );
      const idCity = cityRows[0]?.id_city;
      if (!idCity) continue;
      const { rows: areaRows } = await client.query(
        'SELECT id_area FROM area WHERE id_city = $1::uuid AND name = $2::varchar LIMIT 1',
        [idCity, p.areaName]
      );
      const idArea = areaRows[0]?.id_area;
      if (!idArea) continue;
      const { rows: ex } = await client.query(
        'SELECT id_poi FROM point_of_interest WHERE id_area = $1::uuid AND name = $2::varchar LIMIT 1',
        [idArea, p.name]
      );
      if (ex.length > 0) continue;
      await client.query(
        'INSERT INTO point_of_interest (id_area, name, poi_type) VALUES ($1::uuid, $2::varchar, $3::jsonb)',
        [idArea, p.name, JSON.stringify(p.poi_type)]
      );
      poiInserted++;
    }
    console.log('POI: đã thêm', poiInserted);
    console.log('Crawl Vietnam xong.');
  } catch (err) {
    console.error('Lỗi:', err);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

main();

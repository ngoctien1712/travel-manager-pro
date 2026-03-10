import { Request, Response } from 'express';
import pool from '../config/db.js';
import { generateChatCompletion } from '../services/openai.service.js';
import { orsService } from '../services/ors.service.js';

/**
 * Thuật toán 2 điểm: Tìm POI trong bán kính 10km
 * Sử dụng công thức Haversine đơn giản trong SQL
 */
const POI_RADIUS_SQL = `
  SELECT *, 
    (6371 * acos(cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2)) + sin(radians($1)) * sin(radians(latitude)))) AS distance
  FROM point_of_interest
  WHERE (6371 * acos(cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2)) + sin(radians($1)) * sin(radians(latitude)))) <= 10
  ORDER BY distance ASC
  LIMIT 200
`;

export const generateItinerary = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { startDate, endDate, destination, coordinates } = req.body;

    if (!startDate || !endDate || !destination) {
      return res.status(400).json({ message: 'Thiếu thông tin ngày đi, ngày đến hoặc điểm đến' });
    }

    let currentCoords = coordinates;

    // Nếu không có tọa độ từ frontend, dùng ORS Geocode để lấy tọa độ từ tên điểm đến
    if (!currentCoords || !currentCoords.lat || !currentCoords.lng) {
      const geo = await orsService.geocode(destination);
      if (geo) {
        currentCoords = { lat: geo.lat, lng: geo.lng };
      }
    }

    // 1. Kiểm tra lịch sử đặt chỗ (Trường hợp 1)
    // Tìm các đơn hàng đã thanh toán hoặc đã đăng ký của người dùng này
    // mà có liên quan đến địa điểm (destination) trong khoảng thời gian này.
    const orderMatchSql = `
      SELECT o.id_order, o.status, bi.title as service_name, bi.id_area, c.name as city_name, c.id_city
      FROM "order" o
      LEFT JOIN (
        SELECT id_order, id_item, booking_date as s_date, booking_date as e_date, NULL::text as arrival_point FROM order_tour_detail
        UNION ALL
        SELECT id_order, id_item, visit_date as s_date, visit_date as e_date, NULL::text as arrival_point FROM order_ticket_detail
        UNION ALL
        SELECT id_order, r.id_item, d.start_date as s_date, d.end_date as e_date, NULL::text as arrival_point FROM order_accommodations_detail d JOIN accommodations_rooms r ON r.id_room = d.id_room
        UNION ALL
        SELECT id_order, v.id_item, '2000-01-01'::date as s_date, '2099-12-31'::date as e_date, v.arrival_point FROM order_pos_vehicle_detail d JOIN positions p ON p.id_position = d.id_position JOIN vehicle v ON v.id_vehicle = p.id_vehicle
      ) od ON o.id_order = od.id_order
      LEFT JOIN bookable_items bi ON bi.id_item = od.id_item
      LEFT JOIN area a ON a.id_area = bi.id_area
      LEFT JOIN cities c ON c.id_city = a.id_city
      WHERE o.id_user = $1 
        AND o.status IN ('paid', 'registered', 'success', 'pending')
        AND (
            c.name ILIKE $2 OR c.name_vi ILIKE $2 OR a.name ILIKE $2 OR bi.title ILIKE $2 
            OR od.arrival_point ILIKE $2
        )
        AND (
          (od.s_date <= $3 AND od.e_date >= $3) OR 
          (od.s_date <= $4 AND od.e_date >= $4) OR
          (od.s_date >= $3 AND od.e_date <= $4)
        )
      LIMIT 1
    `;

    const { rows: matchedOrders } = await pool.query(orderMatchSql, [userId, `%${destination}%`, startDate, endDate]);

    let poiList = [];
    let caseType = '';

    if (matchedOrders.length > 0) {
      // TRƯỜNG HỢP 1: Có lịch sử đặt chỗ trùng ngày và điểm đến
      caseType = 'Case 1: Historical Match Found';
      const cityId = matchedOrders[0].id_city;

      if (cityId) {
        const { rows: pois } = await pool.query(
          `SELECT p.name, p.poi_type, p.latitude, p.longitude
           FROM point_of_interest p
           JOIN area a ON a.id_area = p.id_area
           WHERE a.id_city = $1 
           LIMIT 200`,
          [cityId]
        );
        poiList = pois;
      }
    } else {
      // TRƯỜNG HỢP 2: Không có lịch sử hoặc không khớp
      caseType = 'Case 2: Proximity Search (10km)';
      if (currentCoords && currentCoords.lat && currentCoords.lng) {
        // CHẠY SONG SONG: Lấy POI từ Database và ORS để tối ưu tốc độ
        const [dbResult, orsPois] = await Promise.all([
          pool.query(POI_RADIUS_SQL, [currentCoords.lat, currentCoords.lng]),
          orsService.findPoisInRange(currentCoords.lat, currentCoords.lng, 10000)
        ]);

        poiList = [...dbResult.rows];

        // Bổ sung dữ liệu từ ORS
        if (orsPois && orsPois.length > 0) {
          const existingNames = new Set(poiList.map((p: any) => p.name.toLowerCase()));
          orsPois.forEach((p: any) => {
            if (!existingNames.has(p.name.toLowerCase())) {
              poiList.push({
                name: p.name,
                poi_type: p.poi_type,
                latitude: p.latitude,
                longitude: p.longitude,
                source: 'OpenRouteService'
              });
            }
          });
        }
      }
    }

    // Fallback nếu vẫn chưa có POI
    if (poiList.length === 0) {
      const { rows: pois } = await pool.query(
        `SELECT p.name, p.poi_type, p.latitude, p.longitude
         FROM point_of_interest p
         JOIN area a ON a.id_area = p.id_area
         JOIN cities c ON c.id_city = a.id_city
         WHERE c.name ILIKE $1 OR c.name_vi ILIKE $1 OR a.name ILIKE $1
         LIMIT 200`,
        [`%${destination}%`]
      );
      poiList = pois;
    }

    if (poiList.length === 0) {
      poiList = [];
    }

    // 2. Sử dụng LLM để tạo lịch trình
    const prompt = `
      You are a smart and sophisticated travel planning expert.
      Create an EXTRA DETAILED travel itinerary for:
      - Destination: ${destination}
      - From: ${startDate}
      - To: ${endDate}
      
      Here is a LIST OF ACTUAL PLACES (POIs) from the system (Please prioritize using these names for a realistic itinerary):
      ${JSON.stringify(poiList.slice(0, 30).map((p: any) => ({ name: p.name, category: p.poi_type?.poi_category || p.poi_type?.category })))}

      CONTENT REQUIREMENTS:
      1. The itinerary should be divided by day (Day 1, Day 2...).
      2. Each day must have at least 5-6 specific time slots (e.g., "08:00 - 09:30", "12:00 - 13:30"). Do not use generic terms like "Morning/Noon/Afternoon".
      3. Each activity must have a concise title and a compelling description of the experience.
      4. Include suggestions for local specialty foods during meal times.
      5. Ensure a reasonable travel flow and include rest periods.

      LANGUAGE REQUIREMENT:
      - ALL content within the JSON values (titles, descriptions, locations, tips, etc.) MUST BE WRITTEN IN VIVID, PROFESSIONAL, AND INSPIRING VIETNAMESE.

      RETURN FORMAT (MANDATORY JSON):
      {
        "title": "An inspiring trip title in Vietnamese",
        "destination": "${destination}",
        "duration": "Duration in Vietnamese (e.g., 3 ngày 2 đêm)",
        "itinerary": [
          {
            "day": 1,
            "date": "Day/Month/Year",
            "activities": [
              {
                "time": "08:00 - 09:00",
                "title": "Activity title in Vietnamese",
                "location": "Location name in Vietnamese",
                "description": "Experience description in Vietnamese..."
              }
            ]
          }
        ],
        "tips": ["Clothing tip in Vietnamese", "Weather tip in Vietnamese", "Transportation tip in Vietnamese"]
      }

      ONLY RETURN THE JSON OBJECT.
    `;

    const itinerary = await generateChatCompletion(prompt);

    res.json({
      success: true,
      case: caseType,
      data: itinerary,
      coordinates: currentCoords,
      poiMarkers: poiList.filter((p: any) => p.latitude && p.longitude)
    });

  } catch (error) {
    console.error('Planning Error:', error);
    res.status(500).json({ message: 'Lỗi khi lập kế hoạch du lịch' });
  }
};

export const getSuggestions = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const suggestions = await orsService.autocomplete(q as string);
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy gợi ý địa danh' });
  }
};

import { Request, Response } from 'express';
import { query } from '../config/db.js';

const toIso = (d: Date | string | null) => (d ? new Date(d).toISOString() : null);

export const listServices = async (req: Request, res: Response) => {
  try {
    const {
      area, type, minPrice, maxPrice, q, city, provinceId, districtId, wardId, arrivalProvinceId,
      date, checkIn, checkOut, departureDate, returnDate
    } = req.query as Record<string, string>;
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    // ... (existing conditions for area, type, minPrice, maxPrice, q, city) ...
    if (area) { conditions.push(`bi.id_area = $${idx++}`); params.push(area); }
    if (type) { conditions.push(`bi.item_type = $${idx++}`); params.push(type); }
    if (minPrice) { conditions.push(`bi.price >= $${idx++}`); params.push(minPrice); }
    if (maxPrice) { conditions.push(`bi.price <= $${idx++}`); params.push(maxPrice); }
    if (q) {
      conditions.push(`(bi.title ILIKE $${idx++} OR bi.attribute::text ILIKE $${idx - 1} OR bi.description ILIKE $${idx - 1})`);
      params.push(`%${q}%`);
    }
    if (city) {
      conditions.push(`(c.name ILIKE $${idx} OR c.name_vi ILIKE $${idx})`);
      params.push(`%${city}%`);
      idx++;
    }

    // New Date Filters
    if (date) {
      // For tours, check if date is within range
      conditions.push(`(
        (bi.item_type = 'tour' AND EXISTS (SELECT 1 FROM tours t WHERE t.id_item = bi.id_item AND t.start_at <= $${idx} AND t.end_at >= $${idx}))
        OR bi.item_type != 'tour'
      )`);
      params.push(date);
      idx++;
    }

    if (departureDate && type === 'vehicle') {
      conditions.push(`v.departure_time::date = $${idx++}`);
      params.push(departureDate);
    }

    if (provinceId) {
      if (type === 'accommodation') {
        conditions.push(`acc.province_id = $${idx}`);
      } else if (type === 'vehicle') {
        conditions.push(`v.departure_province_id = $${idx}`);
      } else {
        conditions.push(`(acc.province_id = $${idx} OR v.departure_province_id = $${idx} OR v.arrival_province_id = $${idx})`);
      }
      params.push(provinceId);
      idx++;
    }
    if (districtId) {
      if (type === 'accommodation') {
        conditions.push(`acc.district_id = $${idx}`);
      } else if (type === 'vehicle') {
        conditions.push(`v.departure_district_id = $${idx}`);
      } else {
        conditions.push(`(acc.district_id = $${idx} OR v.departure_district_id = $${idx} OR v.arrival_district_id = $${idx})`);
      }
      params.push(districtId);
      idx++;
    }
    if (wardId) {
      if (type === 'accommodation') {
        conditions.push(`acc.ward_id = $${idx}`);
      } else if (type === 'vehicle') {
        conditions.push(`v.departure_ward_id = $${idx}`);
      } else {
        conditions.push(`(acc.ward_id = $${idx} OR v.departure_ward_id = $${idx} OR v.arrival_ward_id = $${idx})`);
      }
      params.push(wardId);
      idx++;
    }
    if (arrivalProvinceId) {
      conditions.push(`(v.arrival_province_id = $${idx})`);
      params.push(arrivalProvinceId);
      idx++;
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT
        bi.id_item,
        bi.id_provider,
        bi.id_area,
        bi.item_type,
        bi.title,
        bi.attribute,
        bi.price,
        a.name AS area_name,
        c.id_city,
        c.name AS city_name,
        acc.hotel_type,
        acc.star_rating,
        v.max_guest,
        v.departure_time,
        v.arrival_time,
        (
          SELECT url
          FROM item_media im
          WHERE im.id_item = bi.id_item
          ORDER BY im.id_media ASC
          LIMIT 1
        ) AS thumbnail
      FROM bookable_items bi
      LEFT JOIN area a ON bi.id_area = a.id_area
      LEFT JOIN cities c ON a.id_city = c.id_city
      LEFT JOIN accommodations acc ON acc.id_item = bi.id_item
      LEFT JOIN vehicle v ON v.id_item = bi.id_item
      ${where}
      ORDER BY bi.created_at DESC NULLS LAST, bi.title
      LIMIT 200
    `;
    const result = await query(sql, params);
    res.json(result.rows.map((r: any) => ({ ...r })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách dịch vụ' });
  }
};

// -------- Home data for customer --------

export const getHomeData = async (_req: Request, res: Response) => {
  try {
    // Categories by item_type
    const catSql = `
      SELECT item_type, COUNT(*)::int AS count
      FROM bookable_items
      GROUP BY item_type
    `;
    const catRes = await query(catSql, []);
    const typeMeta: Record<
      string,
      { name: string; icon: string }
    > = {
      tour: { name: 'Tour du lịch', icon: 'Map' },
      accommodation: { name: 'Chỗ ở', icon: 'Building2' },
      hotel: { name: 'Khách sạn', icon: 'Building2' },
      ticket: { name: 'Vé tham quan', icon: 'Ticket' },
      vehicle: { name: 'Phương tiện', icon: 'Sparkles' },
    };
    const categories = catRes.rows.map((r: any) => {
      const meta = typeMeta[r.item_type] || {
        name: r.item_type,
        icon: 'Sparkles',
      };
      return {
        id: r.item_type,
        name: meta.name,
        icon: meta.icon,
        count: Number(r.count) || 0,
      };
    });

    // Top services by type, limited and sorted by rating
    const getTopServices = async (type: string, limit: number = 10) => {
      // Check if star_rating column exists to avoid crash if migration not run
      const checkCol = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='bookable_items' AND column_name='star_rating'
      `, []);
      const hasStarRating = checkCol.rows.length > 0;
      const orderBy = hasStarRating ? 'bi.star_rating DESC, bi.created_at DESC' : 'bi.created_at DESC';
      const selectRating = hasStarRating ? 'bi.star_rating' : '0 AS star_rating';

      const sql = `
        SELECT
          bi.id_item,
          bi.title,
          bi.price,
          bi.item_type,
          ${selectRating},
          a.name AS area_name,
          c.name AS city_name,
          (
            SELECT url
            FROM item_media im
            WHERE im.id_item = bi.id_item
            ORDER BY im.id_media ASC
            LIMIT 1
          ) AS thumbnail
        FROM bookable_items bi
        LEFT JOIN area a ON bi.id_area = a.id_area
        LEFT JOIN cities c ON a.id_city = c.id_city
        WHERE bi.item_type = $1 AND bi.status = 'active'
        ORDER BY ${orderBy}
        LIMIT $2
      `;
      const res = await query(sql, [type, limit]);
      return res.rows.map((r: any) => ({
        id: r.id_item,
        name: r.title,
        price: Number(r.price) || 0,
        city: r.city_name || r.area_name || '',
        thumbnail: r.thumbnail || 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
        rating: Number(r.star_rating) || 0,
        type: r.item_type,
      }));
    };

    const [topTours, topAccommodations, topVehicles, topTickets] = await Promise.all([
      getTopServices('tour'),
      getTopServices('accommodation'),
      getTopServices('vehicle'),
      getTopServices('ticket')
    ]);

    // Popular destinations
    const destSql = `
      SELECT
        c.id_city,
        c.name,
        COUNT(bi.id_item)::int AS service_count,
        MAX(im.url) AS image
      FROM bookable_items bi
      LEFT JOIN area a ON bi.id_area = a.id_area
      LEFT JOIN cities c ON a.id_city = c.id_city
      LEFT JOIN item_media im ON im.id_item = bi.id_item
      WHERE c.id_city IS NOT NULL AND bi.status = 'active'
      GROUP BY c.id_city, c.name
      ORDER BY service_count DESC
      LIMIT 12
    `;
    const destRes = await query(destSql, []);
    const popularDestinations = destRes.rows.map((r: any) => ({
      id: r.id_city,
      name: r.name,
      serviceCount: Number(r.service_count) || 0,
      image: r.image || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800',
    }));

    res.json({ categories, topTours, topAccommodations, topVehicles, topTickets, popularDestinations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu trang chủ' });
  }
};

export const getService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 1. Fetch base item with provider and location info
    const sql = `
      SELECT 
        bi.*, 
        p.name AS provider_name, 
        p.phone AS provider_phone,
        p.image AS provider_image,
        a.name AS area_name, 
        a.attribute AS area_attribute,
        c.name AS city_name,
        co.name AS country_name
      FROM bookable_items bi
      JOIN provider p ON p.id_provider = bi.id_provider
      LEFT JOIN area a ON a.id_area = bi.id_area
      LEFT JOIN cities c ON c.id_city = a.id_city
      LEFT JOIN countries co ON co.id_country = c.id_country
      WHERE bi.id_item = $1
    `;
    const { rows } = await query(sql, [id]);
    if (!rows[0]) return res.status(404).json({ message: 'Không tìm thấy dịch vụ' });

    const item = rows[0];
    const itemType = item.item_type;
    const areaId = item.id_area;

    // 2. Fetch type-specific details
    let details: any = {};
    if (itemType === 'tour') {
      const { rows: tourRows } = await query(
        'SELECT guide_language, start_at, end_at, max_slots, attribute as tour_attribute FROM tours WHERE id_item = $1',
        [id]
      );
      details = tourRows[0] || {};
    } else if (itemType === 'accommodation') {
      const { rows: accDetails } = await query(
        'SELECT address, hotel_type, star_rating, checkin_time, checkout_time, policies FROM accommodations WHERE id_item = $1',
        [id]
      );
      details = accDetails[0] || {};
      details.acc_attribute = item.attribute; // Map base attribute to acc_attribute for consistency

      // Fetch rooms
      const { rows: rooms } = await query(
        'SELECT id_room, name_room, max_guest, price, attribute FROM accommodations_rooms WHERE id_item = $1 ORDER BY price ASC',
        [id]
      );
      details.rooms = rooms;
    } else if (itemType === 'vehicle') {
      const { rows: vehRows } = await query(
        `SELECT 
          id_vehicle, code_vehicle, max_guest, 
          departure_time as "departureTime", 
          departure_point as "departurePoint", 
          arrival_time as "arrivalTime", 
          arrival_point as "arrivalPoint", 
          estimated_duration as "estimatedDuration", 
          attribute as vehicle_attribute 
         FROM vehicle WHERE id_item = $1`,
        [id]
      );
      details = vehRows[0] || {};

      if (details.id_vehicle) {
        const { rows: positions } = await query(
          `SELECT p.*, 
            (SELECT COUNT(*) FROM order_pos_vehicle_detail opvd WHERE opvd.id_position = p.id_position) as is_booked
           FROM positions p WHERE p.id_vehicle = $1 ORDER BY p.code_position`,
          [details.id_vehicle]
        );
        details.positions = positions.map((p: any) => ({
          ...p,
          is_booked: Number(p.is_booked) > 0
        }));
      }
    } else if (itemType === 'ticket') {
      const { rows: tickRows } = await query(
        'SELECT ticket_kind FROM tickets WHERE id_item = $1',
        [id]
      );
      details = tickRows[0] || {};

      // Also fetch POI for this area if it's a ticket
      if (areaId) {
        const { rows: poiRows } = await query(
          'SELECT name as poi_name, poi_type FROM point_of_interest WHERE id_area = $1 LIMIT 1',
          [areaId]
        );
        if (poiRows[0]) {
          details.poi_name = poiRows[0].poi_name;
          details.poi_type = poiRows[0].poi_type;
        }
      }
    }

    // 3. Fetch media
    const media = await query(
      `SELECT id_media, type, url FROM item_media WHERE id_item = $1 ORDER BY id_media ASC`,
      [id]
    );

    // 4. Fetch tags
    const tags = await query(
      `SELECT tag FROM item_tag WHERE id_item = $1`,
      [id]
    );

    res.json({
      ...item,
      ...details,
      media: media.rows,
      tags: tags.rows.map((t: any) => t.tag)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi lấy chi tiết dịch vụ' });
  }
};

export const addToCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Chưa đăng nhập' });
    const { id_item, quantity, price, attribute } = req.body;
    // ensure cart
    const cartRes = await query(`SELECT id_cart FROM cart WHERE id_user = $1 LIMIT 1`, [userId]);
    let idCart = cartRes.rows[0]?.id_cart;
    if (!idCart) {
      const insert = await query(`INSERT INTO cart (id_user) VALUES ($1) RETURNING id_cart`, [userId]);
      idCart = insert.rows[0].id_cart;
    }
    const insertItem = await query(`INSERT INTO cart_item (id_cart, id_item, quantity, price, attribute) VALUES ($1,$2,$3,$4,$5) RETURNING *`, [idCart, id_item, quantity || 1, price || null, attribute || null]);
    res.json(insertItem.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi thêm vào giỏ' });
  }
};

export const getCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Chưa đăng nhập' });
    const cartRes = await query(`SELECT id_cart FROM cart WHERE id_user = $1 LIMIT 1`, [userId]);
    const idCart = cartRes.rows[0]?.id_cart;
    if (!idCart) return res.json({ items: [] });
    const items = await query(`SELECT ci.*, bi.title, bi.price as base_price FROM cart_item ci LEFT JOIN bookable_items bi ON bi.id_item = ci.id_item WHERE ci.id_cart = $1`, [idCart]);
    res.json({ items: items.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi lấy giỏ hàng' });
  }
};

export const removeCartItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // cart_item id
    await query(`DELETE FROM cart_item WHERE id_cart_item = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi xóa item khỏi giỏ' });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Chưa đăng nhập' });
    const { payment_method } = req.body;
    // get cart
    const cartRes = await query(`SELECT id_cart FROM cart WHERE id_user = $1 LIMIT 1`, [userId]);
    const idCart = cartRes.rows[0]?.id_cart;
    if (!idCart) return res.status(400).json({ message: 'Giỏ hàng trống' });
    const itemsRes = await query(`SELECT ci.*, bi.title FROM cart_item ci LEFT JOIN bookable_items bi ON bi.id_item = ci.id_item WHERE ci.id_cart = $1`, [idCart]);
    const items = itemsRes.rows;
    const total = items.reduce((s: number, it: any) => s + (Number(it.price || it.base_price || 0) * (it.quantity || 1)), 0);
    const orderInsert = await query(
      `INSERT INTO "order" (status, order_code, total_amount, currency, order_type, id_user) VALUES ($1, concat('ORD-', substring(uuid_generate_v4()::text,1,8)), $2, $3, $4, $5) RETURNING id_order`,
      ['pending', total, 'VND', 'service', userId]
    );
    const idOrder = orderInsert.rows[0].id_order;
    // insert order items
    for (const it of items) {
      await query(`INSERT INTO order_tour_detail (id_item, id_order, quantity, price) VALUES ($1,$2,$3,$4)`, [it.id_item, idOrder, it.quantity || 1, it.price || it.base_price || 0]);
    }
    // create payment record (pending)
    const pay = await query(`INSERT INTO payments (id_order, status, amount, method) VALUES ($1,$2,$3,$4) RETURNING id_pay`, [idOrder, 'pending', total, payment_method || 'unknown']);
    // clear cart
    await query(`DELETE FROM cart_item WHERE id_cart = $1`, [idCart]);
    res.json({ id_order: idOrder, id_pay: pay.rows[0].id_pay, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi tạo đơn hàng' });
  }
};

export const listOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Chưa đăng nhập' });
    const orders = await query(`SELECT * FROM "order" WHERE id_user = $1 ORDER BY create_at DESC LIMIT 200`, [userId]);
    res.json(orders.rows.map((o: any) => ({ ...o, create_at: toIso(o.create_at) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách đơn' });
  }
};

export const getOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await query(`SELECT * FROM "order" WHERE id_order = $1 LIMIT 1`, [id]);
    if (!order.rows[0]) return res.status(404).json({ message: 'Không tìm thấy đơn' });
    const items = await query(`SELECT * FROM order_tour_detail WHERE id_order = $1`, [id]);
    const payments = await query(`SELECT * FROM payments WHERE id_order = $1`, [id]);
    res.json({ order: order.rows[0], items: items.rows, payments: payments.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi lấy chi tiết đơn' });
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await query(`UPDATE "order" SET status = $1 WHERE id_order = $2`, ['cancelled', id]);
    await query(`INSERT INTO order_status_history (id_order, from_status, to_status) VALUES ($1,$2,$3)`, [id, 'unknown', 'cancelled']);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi hủy đơn' });
  }
};

export const requestRefund = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params; // order id
    const { amount, reason } = req.body;
    const insert = await query(`INSERT INTO refund_requests (id_order, id_user, amount, reason) VALUES ($1,$2,$3,$4) RETURNING *`, [id, userId, amount, reason]);
    res.json(insert.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi yêu cầu hoàn tiền' });
  }
};

export const createPayment = async (req: Request, res: Response) => {
  try {
    const { id_order, method } = req.body;
    // simulate payment success
    const order = await query(`SELECT total_amount FROM "order" WHERE id_order = $1`, [id_order]);
    if (!order.rows[0]) return res.status(404).json({ message: 'Không tìm thấy đơn' });
    const amount = order.rows[0].total_amount;
    const pay = await query(`INSERT INTO payments (id_order, status, amount, method, paid_at) VALUES ($1,$2,$3,$4,NOW()) RETURNING *`, [id_order, 'paid', amount, method || 'manual']);
    await query(`UPDATE "order" SET status = $1 WHERE id_order = $2`, ['confirmed', id_order]);
    res.json(pay.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi thực hiện thanh toán' });
  }
};

// -------- Trip plans --------

export const createTripPlan = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Chưa đăng nhập' });

    const { destination, startDate, endDate, budget } = req.body;
    if (!destination || !startDate || !endDate) {
      return res.status(400).json({ message: 'Thiếu thông tin chuyến đi' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysCount =
      Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

    const days = Array.from({ length: daysCount }, (_, i) => ({
      dayNumber: i + 1,
      activities: [
        {
          time: '08:00',
          title: 'Ăn sáng',
          description: 'Thưởng thức đặc sản địa phương',
        },
        {
          time: '10:00',
          title: 'Tham quan',
          description: 'Khám phá địa điểm nổi tiếng trong khu vực',
        },
        {
          time: '12:00',
          title: 'Ăn trưa',
          description: 'Nghỉ ngơi và thưởng thức ẩm thực',
        },
        {
          time: '15:00',
          title: 'Hoạt động tự do',
          description: 'Mua sắm hoặc thư giãn theo sở thích',
        },
        {
          time: '19:00',
          title: 'Ăn tối',
          description: 'Trải nghiệm ẩm thực đêm',
        },
      ],
    }));

    const insert = await query(
      `INSERT INTO trip_plans (id_user, destination, start_date, end_date, budget, plan)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id_trip_plan`,
      [userId, destination, startDate, endDate, budget || null, JSON.stringify({ days })]
    );

    res.json({
      id_trip_plan: insert.rows[0].id_trip_plan,
      destination,
      startDate,
      endDate,
      budget,
      days,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi tạo kế hoạch chuyến đi' });
  }
};

export const listTripPlans = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Chưa đăng nhập' });

    const { rows } = await query(
      `SELECT id_trip_plan, destination, start_date, end_date, budget, plan
       FROM trip_plans
       WHERE id_user = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    const plans = rows.map((r: any) => ({
      id_trip_plan: r.id_trip_plan,
      destination: r.destination,
      startDate: r.start_date,
      endDate: r.end_date,
      budget: r.budget,
      days: r.plan?.days || [],
    }));

    res.json(plans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách kế hoạch chuyến đi' });
  }
};

export default {
  listServices,
  getService,
  addToCart,
  getCart,
  removeCartItem,
  createOrder,
  listOrders,
  getOrder,
  cancelOrder,
  requestRefund,
  createPayment,
  getHomeData,
  createTripPlan,
  listTripPlans,
};

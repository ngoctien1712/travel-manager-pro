import { Request, Response } from 'express';
import pool from '../config/db.js';

function toCamel(o: Record<string, unknown>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  for (const k of Object.keys(o)) {
    const v = o[k];
    const key = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    r[key] = v;
  }
  if ('idItem' in r) r.id = r.idItem;
  return r;
}

/** List all bookable items for current owner across all their providers */
export async function getMyBookableItems(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { rows } = await pool.query(
      `SELECT bi.id_item, bi.id_provider, bi.id_area, bi.item_type, bi.title, bi.attribute, bi.price, bi.created_at,
              p.name AS provider_name, a.name AS area_name
       FROM bookable_items bi
       JOIN provider p ON p.id_provider = bi.id_provider
       LEFT JOIN area a ON a.id_area = bi.id_area
       WHERE p.id_user = $1
       ORDER BY bi.created_at DESC`,
      [userId]
    );
    res.json({
      data: rows.map((r: Record<string, unknown>) => toCamel(r as Record<string, unknown>)),
    });
  } catch (err) {
    console.error('Get my bookable items error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

/** List areas used by current owner's providers */
export async function getMyAreaOwnerships(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { rows } = await pool.query(
      `SELECT DISTINCT a.id_area,
              a.name AS area_name, a.status AS area_status,
              c.id_city, c.name AS city_name,
              co.id_country, co.code AS country_code, co.name AS country_name
       FROM provider p
       JOIN area a ON a.id_area = p.id_area
       JOIN cities c ON c.id_city = a.id_city
       JOIN countries co ON co.id_country = c.id_country
       WHERE p.id_user = $1
       ORDER BY a.name`,
      [userId]
    );
    res.json({
      data: rows.map((r: Record<string, unknown>) => ({
        id: r.id_area, // Use areaId as ID since area_owners is gone
        areaId: r.id_area,
        status: 'active', // Placeholder for simplicity
        areaName: r.area_name,
        areaStatus: r.area_status,
        cityId: r.id_city,
        cityName: r.city_name,
        countryId: r.id_country,
        countryCode: r.country_code,
        countryName: r.country_name,
      })),
    });
  } catch (err) {
    console.error('Get my area ownerships error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

/** Legacy - no longer needed with direct provider-area link */
export async function requestAreaOwnership(_req: Request, res: Response) {
  res.status(410).json({ message: 'Endpoint này không còn được sử dụng. Hãy tạo nhà cung cấp trực tiếp với khu vực.' });
}

/** List providers for current user */
export async function getMyProviders(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { rows } = await pool.query(
      `SELECT p.id_provider, p.name, p.id_area, p.id_user, p.phone, p.image, p.status,
              a.name AS area_name, c.name AS city_name, co.name AS country_name
       FROM provider p
       LEFT JOIN area a ON a.id_area = p.id_area
       LEFT JOIN cities c ON c.id_city = a.id_city
       LEFT JOIN countries co ON co.id_country = c.id_country
       WHERE p.id_user = $1
       ORDER BY p.name`,
      [userId]
    );
    res.json({
      data: rows.map((r: Record<string, unknown>) => ({
        id: r.id_provider,
        name: r.name,
        areaId: r.id_area,
        areaName: r.area_name,
        cityName: r.city_name,
        countryName: r.country_name,
        phone: r.phone,
        image: r.image,
        status: r.status,
      })),
    });
  } catch (err) {
    console.error('Get my providers error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

/** List bookable items for a specific provider */
export async function getProviderBookableItems(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { providerId } = req.params;

    // Security check: provider must belong to user
    const providerCheck = await pool.query(
      'SELECT id_provider FROM provider WHERE id_provider = $1 AND id_user = $2',
      [providerId, userId]
    );

    if (providerCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền xem dịch vụ của nhà cung cấp này' });
    }

    const { rows } = await pool.query(
      `SELECT id_item, id_provider, id_area, item_type, title, attribute, price, created_at
       FROM bookable_items
       WHERE id_provider = $1
       ORDER BY created_at DESC`,
      [providerId]
    );

    res.json({
      data: rows.map((r: Record<string, unknown>) => toCamel(r as Record<string, unknown>)),
    });
  } catch (err) {
    console.error('Get provider bookable items error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

/** Get detailed info for a bookable item (owner view) */
export async function getServiceDetail(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { idItem } = req.params;

    // Fetch base item and check ownership
    const { rows: itemRows } = await pool.query(
      `SELECT bi.*, p.name AS provider_name, a.name AS area_name
       FROM bookable_items bi
       JOIN provider p ON p.id_provider = bi.id_provider
       LEFT JOIN area a ON a.id_area = bi.id_area
       WHERE bi.id_item = $1 AND p.id_user = $2`,
      [idItem, userId]
    );

    if (itemRows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy dịch vụ hoặc bạn không có quyền truy cập' });
    }

    const item = toCamel(itemRows[0] as Record<string, unknown>);
    const itemType = item.itemType as string;

    // Fetch type-specific details
    let details: any = {};
    if (itemType === 'tour') {
      const { rows } = await pool.query('SELECT guide_language, start_at, end_at, max_slots, attribute, tour_type FROM tours WHERE id_item = $1', [idItem]);
      details = rows[0] ? toCamel(rows[0] as Record<string, unknown>) : {};
    } else if (itemType === 'accommodation') {
      const { rows } = await pool.query(
        `SELECT id_item, address, hotel_type, star_rating, checkin_time, checkout_time, policies, attribute,
                phone_number, province_id, district_id, ward_id, specific_address
         FROM accommodations WHERE id_item = $1`,
        [idItem]
      );
      details = rows[0] ? toCamel(rows[0] as Record<string, unknown>) : {};
      // Also fetch rooms for accommodation
      const { rows: rooms } = await pool.query('SELECT id_room, name_room, max_guest, price, attribute, media, description FROM accommodations_rooms WHERE id_item = $1 ORDER BY price ASC', [idItem]);
      details.rooms = rooms.map(r => toCamel(r as Record<string, unknown>));
    } else if (itemType === 'vehicle') {
      const { rows } = await pool.query(
        `SELECT id_vehicle, id_item, code_vehicle, max_guest, departure_time, departure_point, arrival_time, 
                arrival_point, estimated_duration, attribute, phone_number,
                departure_province_id, departure_district_id, departure_ward_id,
                arrival_province_id, arrival_district_id, arrival_ward_id
         FROM vehicle WHERE id_item = $1`,
        [idItem]
      );
      details = rows[0] ? toCamel(rows[0] as Record<string, unknown>) : {};

      if (details.idVehicle) {
        const { rows: positions } = await pool.query(
          `SELECT p.*, (SELECT COUNT(*) FROM order_pos_vehicle_detail opvd WHERE opvd.id_position = p.id_position) as is_booked
           FROM positions p WHERE p.id_vehicle = $1 ORDER BY p.code_position`,
          [details.idVehicle]
        );
        details.positions = positions.map(p => ({
          ...toCamel(p as Record<string, unknown>),
          isBooked: Number(p.is_booked) > 0
        }));

        // Fetch trips
        const { rows: trips } = await pool.query('SELECT * FROM vehicle_trips WHERE id_vehicle = $1 ORDER BY departure_time ASC', [details.idVehicle]);
        details.trips = trips.map(t => toCamel(t as Record<string, unknown>));
      }
    } else if (itemType === 'ticket') {
      const { rows } = await pool.query('SELECT ticket_kind FROM tickets WHERE id_item = $1', [idItem]);
      details = rows[0] ? toCamel(rows[0] as Record<string, unknown>) : {};
    }

    // Fetch media
    const { rows: media } = await pool.query('SELECT id_media, url, type FROM item_media WHERE id_item = $1', [idItem]);
    item.media = media.map(m => toCamel(m as Record<string, unknown>));

    // Intelligently merge attributes: prioritize specific item type's attribute if it's not null, 
    // otherwise fallback to base item's attribute.
    const finalAttribute = details.attribute || item.attribute || {};

    res.json({ data: { ...item, ...details, attribute: finalAttribute } });
  } catch (err) {
    console.error('Get service detail error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

/** Update bookable item and its type-specific details */
export async function updateServiceDetail(req: Request, res: Response) {
  const client = await pool.connect();
  try {
    const userId = req.user!.userId;
    const { idItem } = req.params;
    const { title, price, attribute, extraData } = req.body;

    // Check ownership
    const { rows: itemRows } = await client.query(
      `SELECT bi.id_item, bi.item_type FROM bookable_items bi
       JOIN provider p ON p.id_provider = bi.id_provider
       WHERE bi.id_item = $1 AND p.id_user = $2`,
      [idItem, userId]
    );

    if (itemRows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy dịch vụ hoặc bạn không có quyền' });
    }

    const itemType = itemRows[0].item_type;

    await client.query('BEGIN');

    // Update base item
    await client.query(
      `UPDATE bookable_items 
       SET title = $1, price = $2, attribute = $3, description = $4, star_rating = $5 
       WHERE id_item = $6`,
      [
        title,
        price,
        attribute ? JSON.stringify(attribute) : null,
        req.body.description || null,
        extraData?.starRating || 0,
        idItem
      ]
    );

    // Update type-specific details
    if (itemType === 'tour' && extraData) {
      const startAt = extraData.startAt && extraData.startAt !== '' ? extraData.startAt : null;
      const endAt = extraData.endAt && extraData.endAt !== '' ? extraData.endAt : null;

      await client.query(
        `INSERT INTO tours (id_item, guide_language, start_at, end_at, max_slots, attribute, tour_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id_item) DO UPDATE 
         SET guide_language = EXCLUDED.guide_language, 
             start_at = EXCLUDED.start_at, 
             end_at = EXCLUDED.end_at, 
             max_slots = EXCLUDED.max_slots,
             attribute = EXCLUDED.attribute,
             tour_type = EXCLUDED.tour_type`,
        [idItem, extraData.guideLanguage || '', startAt, endAt, Number(extraData.maxSlots) || 0, attribute ? JSON.stringify(attribute) : null, extraData.tourType || 'group']
      );
    } else if (itemType === 'accommodation' && extraData) {
      await client.query(
        `INSERT INTO accommodations (
          id_item, address, hotel_type, star_rating, checkin_time, checkout_time, policies, 
          attribute, phone_number, province_id, district_id, ward_id, specific_address
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id_item) DO UPDATE 
         SET address = EXCLUDED.address,
             hotel_type = EXCLUDED.hotel_type,
             star_rating = EXCLUDED.star_rating,
             checkin_time = EXCLUDED.checkin_time,
             checkout_time = EXCLUDED.checkout_time,
             policies = EXCLUDED.policies,
             attribute = EXCLUDED.attribute,
             phone_number = EXCLUDED.phone_number,
             province_id = EXCLUDED.province_id,
             district_id = EXCLUDED.district_id,
             ward_id = EXCLUDED.ward_id,
             specific_address = EXCLUDED.specific_address`,
        [
          idItem,
          extraData.address || '',
          extraData.hotelType || 'Khách sạn',
          Number(extraData.starRating) || 3,
          extraData.checkinTime || '14:00',
          extraData.checkoutTime || '12:00',
          extraData.policies ? JSON.stringify(extraData.policies) : JSON.stringify({ cancellation: 'Linh hoạt', children: 'Cho phép', pets: 'Không cho phép' }),
          attribute ? JSON.stringify(attribute) : null,
          extraData.phoneNumber || null,
          extraData.provinceId || null,
          extraData.districtId || null,
          extraData.wardId || null,
          extraData.specificAddress || null
        ]
      );
    } else if (itemType === 'ticket' && extraData) {
      await client.query(
        `INSERT INTO tickets (id_item, ticket_kind)
         VALUES ($1, $2)
         ON CONFLICT (id_item) DO UPDATE SET ticket_kind = EXCLUDED.ticket_kind`,
        [idItem, extraData.ticketKind]
      );
    } else if (itemType === 'vehicle' && extraData) {
      await client.query(
        `INSERT INTO vehicle (
          id_item, code_vehicle, max_guest, departure_time, departure_point, arrival_time, 
          arrival_point, estimated_duration, attribute, phone_number,
          departure_province_id, departure_district_id, departure_ward_id,
          arrival_province_id, arrival_district_id, arrival_ward_id
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         ON CONFLICT (id_item) DO UPDATE 
         SET code_vehicle = EXCLUDED.code_vehicle, 
             max_guest = EXCLUDED.max_guest,
             departure_time = EXCLUDED.departure_time,
             departure_point = EXCLUDED.departure_point,
             arrival_time = EXCLUDED.arrival_time,
             arrival_point = EXCLUDED.arrival_point,
             estimated_duration = EXCLUDED.estimated_duration,
             attribute = EXCLUDED.attribute,
             phone_number = EXCLUDED.phone_number,
             departure_province_id = EXCLUDED.departure_province_id,
             departure_district_id = EXCLUDED.departure_district_id,
             departure_ward_id = EXCLUDED.departure_ward_id,
             arrival_province_id = EXCLUDED.arrival_province_id,
             arrival_district_id = EXCLUDED.arrival_district_id,
             arrival_ward_id = EXCLUDED.arrival_ward_id`,
        [
          idItem,
          extraData.codeVehicle || '',
          Number(extraData.maxGuest) || 45,
          attribute?.departureTime || null,
          attribute?.departurePoint || null,
          attribute?.arrivalTime || null,
          attribute?.arrivalPoint || null,
          attribute?.estimatedDuration || null,
          attribute ? JSON.stringify(attribute) : null,
          extraData.phoneNumber || null,
          extraData.departureProvinceId || null,
          extraData.departureDistrictId || null,
          extraData.departureWardId || null,
          extraData.arrivalProvinceId || null,
          extraData.arrivalDistrictId || null,
          extraData.arrivalWardId || null
        ]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update service detail error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  } finally {
    client.release();
  }
}

/** Update service status (active/inactive/pending) */
export async function updateServiceStatus(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { idItem } = req.params;
    const { status } = req.body;

    // Check ownership
    const check = await pool.query(
      `SELECT bi.id_item FROM bookable_items bi
       JOIN provider p ON p.id_provider = bi.id_provider
       WHERE bi.id_item = $1 AND p.id_user = $2`,
      [idItem, userId]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền thay đổi trạng thái dịch vụ này' });
    }

    await pool.query('UPDATE bookable_items SET status = $1 WHERE id_item = $2', [status, idItem]);
    res.json({ success: true, status });
  } catch (err) {
    console.error('Update service status error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

/** Delete service */
export async function deleteService(req: Request, res: Response) {
  const client = await pool.connect();
  try {
    const userId = req.user!.userId;
    const { idItem } = req.params;

    // Check ownership
    const check = await client.query(
      `SELECT bi.id_item FROM bookable_items bi
         JOIN provider p ON p.id_provider = bi.id_provider
         WHERE bi.id_item = $1 AND p.id_user = $2`,
      [idItem, userId]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa dịch vụ này' });
    }

    await client.query('BEGIN');

    // Delete from child tables first (tours, accommodations, etc.)
    // Note: If you have ON DELETE CASCADE in DB, this might be simpler.
    // Assuming we need to clean up manually for safety or lack of CASCADE.
    await client.query('DELETE FROM tours WHERE id_item = $1', [idItem]);
    await client.query('DELETE FROM accommodations_rooms WHERE id_item = $1', [idItem]);
    await client.query('DELETE FROM accommodations WHERE id_item = $1', [idItem]);
    await client.query('DELETE FROM vehicle WHERE id_item = $1', [idItem]);
    await client.query('DELETE FROM tickets WHERE id_item = $1', [idItem]);
    await client.query('DELETE FROM item_media WHERE id_item = $1', [idItem]);
    await client.query('DELETE FROM bookable_items WHERE id_item = $1', [idItem]);

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Delete service error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  } finally {
    client.release();
  }
}

/** Add position to vehicle */
export async function addVehiclePosition(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { idItem } = req.params;
    const { codePosition, price } = req.body;

    // 1. Check ownership and item type
    const { rows: itemRows } = await pool.query(
      `SELECT bi.id_item, bi.item_type FROM bookable_items bi
       JOIN provider p ON p.id_provider = bi.id_provider
       WHERE bi.id_item = $1 AND p.id_user = $2`,
      [idItem, userId]
    );

    if (itemRows.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền quản lý dịch vụ này' });
    }

    if (itemRows[0].item_type !== 'vehicle') {
      return res.status(400).json({ message: 'Dịch vụ này không phải là phương tiện' });
    }

    // 2. Ensure vehicle record exists
    const { rows: vRows } = await pool.query(
      `INSERT INTO vehicle (id_item, code_vehicle, max_guest)
       VALUES ($1, '', 0)
       ON CONFLICT (id_item) DO UPDATE SET id_item = EXCLUDED.id_item
       RETURNING id_vehicle`,
      [idItem]
    );

    const idVehicle = vRows[0].id_vehicle;

    // 3. Insert position
    const { rows } = await pool.query(
      `INSERT INTO positions (id_vehicle, code_position, price) VALUES ($1, $2, $3)
       RETURNING id_position, code_position, price`,
      [idVehicle, codePosition, price]
    );

    res.status(201).json({ data: toCamel(rows[0] as Record<string, unknown>) });
  } catch (err) {
    console.error('Add vehicle position error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

/** Delete position from vehicle */
export async function deleteVehiclePosition(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { idPosition } = req.params;

    // Check ownership via hierarchy
    const check = await pool.query(
      `SELECT pos.id_position FROM positions pos
       JOIN vehicle v ON v.id_vehicle = pos.id_vehicle
       JOIN bookable_items bi ON bi.id_item = v.id_item
       JOIN provider p ON p.id_provider = bi.id_provider
       WHERE pos.id_position = $1 AND p.id_user = $2`,
      [idPosition, userId]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa vị trí này' });
    }

    await pool.query('DELETE FROM positions WHERE id_position = $1', [idPosition]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete vehicle position error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

/** Create provider: name + id_area */
export async function createProvider(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { name, areaId, phone } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const { rows } = await pool.query(
      `INSERT INTO provider (name, id_area, id_user, phone, image, status) VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id_provider, name, id_area, id_user, phone, image, status`,
      [name, areaId, userId, phone, imageUrl]
    );
    res.status(201).json(toCamel(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('Create provider error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

/** Add multiple media for bookable item */
export async function addItemMedia(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { idItem } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'Vui lòng upload ít nhất một hình ảnh' });
    }

    // Check if item belongs to user via provider
    const itemCheck = await pool.query(
      `SELECT bi.id_item FROM bookable_items bi
       JOIN provider p ON p.id_provider = bi.id_provider
       WHERE bi.id_item = $1 AND p.id_user = $2`,
      [idItem, userId]
    );

    if (itemCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền thêm ảnh cho dịch vụ này' });
    }

    const insertedMedia = [];
    for (const file of files) {
      const imageUrl = `/uploads/${file.filename}`;
      const { rows } = await pool.query(
        `INSERT INTO item_media (id_item, url, type) VALUES ($1, $2, 'image')
         RETURNING id_media, id_item, url, type`,
        [idItem, imageUrl]
      );
      insertedMedia.push(toCamel(rows[0] as Record<string, unknown>));
    }

    res.status(201).json({ data: insertedMedia });
  } catch (err) {
    console.error('Add item media error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

/** Delete media from bookable item */
export async function deleteItemMedia(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { idMedia } = req.params;

    // Check ownership via item and provider
    const check = await pool.query(
      `SELECT im.id_media FROM item_media im
       JOIN bookable_items bi ON bi.id_item = im.id_item
       JOIN provider p ON p.id_provider = bi.id_provider
       WHERE im.id_media = $1 AND p.id_user = $2`,
      [idMedia, userId]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa hình ảnh này' });
    }

    await pool.query('DELETE FROM item_media WHERE id_media = $1', [idMedia]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete item media error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

/** Add room to accommodation */
export async function addAccommodationRoom(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { idItem } = req.params;
    const { nameRoom, maxGuest, attribute, price, media, description } = req.body;

    // Check if accommodation belongs to user
    const check = await pool.query(
      `SELECT a.id_item FROM accommodations a
       JOIN bookable_items bi ON bi.id_item = a.id_item
       JOIN provider p ON p.id_provider = bi.id_provider
       WHERE a.id_item = $1 AND p.id_user = $2`,
      [idItem, userId]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền quản lý dịch vụ này' });
    }

    const { rows } = await pool.query(
      `INSERT INTO accommodations_rooms (id_item, name_room, max_guest, attribute, price, media, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id_room, id_item, name_room, max_guest, attribute, price, media, description`,
      [idItem, nameRoom, maxGuest, attribute ? JSON.stringify(attribute) : null, price, media ? JSON.stringify(media) : '[]', description]
    );

    res.status(201).json(toCamel(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('Add accommodation room error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

/** Update room in accommodation */
export async function updateAccommodationRoom(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { idRoom } = req.params;
    const { nameRoom, maxGuest, attribute, price, media, description } = req.body;

    const check = await pool.query(
      `SELECT r.id_room FROM accommodations_rooms r
       JOIN bookable_items bi ON bi.id_item = r.id_item
       JOIN provider p ON p.id_provider = bi.id_provider
       WHERE r.id_room = $1 AND p.id_user = $2`,
      [idRoom, userId]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa phòng này' });
    }

    const { rows } = await pool.query(
      `UPDATE accommodations_rooms 
       SET name_room = $1, max_guest = $2, attribute = $3, price = $4, media = $5, description = $6
       WHERE id_room = $7
       RETURNING *`,
      [nameRoom, maxGuest, attribute ? JSON.stringify(attribute) : null, price, media ? JSON.stringify(media) : '[]', description, idRoom]
    );

    res.json(toCamel(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('Update room error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

/** Delete room from accommodation */
export async function deleteAccommodationRoom(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { idRoom } = req.params;

    const check = await pool.query(
      `SELECT r.id_room FROM accommodations_rooms r
       JOIN bookable_items bi ON bi.id_item = r.id_item
       JOIN provider p ON p.id_provider = bi.id_provider
       WHERE r.id_room = $1 AND p.id_user = $2`,
      [idRoom, userId]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa phòng này' });
    }

    await pool.query('DELETE FROM accommodations_rooms WHERE id_room = $1', [idRoom]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete room error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

/** Update position in vehicle */
export async function updateVehiclePosition(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { idPosition } = req.params;
    const { codePosition, price } = req.body;

    const check = await pool.query(
      `SELECT pos.id_position FROM positions pos
       JOIN vehicle v ON v.id_vehicle = pos.id_vehicle
       JOIN bookable_items bi ON bi.id_item = v.id_item
       JOIN provider p ON p.id_provider = bi.id_provider
       WHERE pos.id_position = $1 AND p.id_user = $2`,
      [idPosition, userId]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa vị trí này' });
    }

    const { rows } = await pool.query(
      `UPDATE positions SET code_position = $1, price = $2
       WHERE id_position = $3
       RETURNING *`,
      [codePosition, price, idPosition]
    );

    res.json(toCamel(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('Update position error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

/** Manage vehicle info */
export async function manageVehicle(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { idItem } = req.params;
    const { codeVehicle, maxGuest, attribute } = req.body;

    const check = await pool.query(
      `SELECT bi.id_item FROM bookable_items bi
       JOIN provider p ON p.id_provider = bi.id_provider
       WHERE bi.id_item = $1 AND p.id_user = $2`,
      [idItem, userId]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền quản lý dịch vụ này' });
    }

    const { rows } = await pool.query(
      `INSERT INTO vehicle (id_item, code_vehicle, max_guest, attribute)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id_item) DO UPDATE 
       SET code_vehicle = EXCLUDED.code_vehicle, max_guest = EXCLUDED.max_guest, attribute = EXCLUDED.attribute
       RETURNING id_vehicle, id_item, code_vehicle, max_guest, attribute`,
      [idItem, codeVehicle, maxGuest, attribute ? JSON.stringify(attribute) : null]
    );

    res.status(200).json(toCamel(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('Manage vehicle error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

/** Create bookable item (service): provider must belong to current user */
export async function createBookableItem(req: Request, res: Response) {
  const client = await pool.connect();
  try {
    const userId = req.user!.userId;
    const { providerId, areaId, itemType, title, attribute, price, extraData } = req.body;

    const providerCheck = await client.query(
      "SELECT id_provider, id_area, status FROM provider WHERE id_provider = $1 AND id_user = $2",
      [providerId, userId]
    );

    if (providerCheck.rows.length === 0) {
      return res.status(400).json({ message: "Nhà cung cấp không thuộc về bạn" });
    }

    if (providerCheck.rows[0].status !== 'active') {
      return res.status(403).json({ message: "Nhà cung cấp chưa được duyệt. Bạn chưa thể tạo dịch vụ." });
    }

    const areaIdToUse = areaId ?? providerCheck.rows[0].id_area;

    await client.query('BEGIN');

    const { rows: itemRows } = await client.query(
      `INSERT INTO bookable_items (id_provider, id_area, item_type, title, attribute, price)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id_item, id_provider, id_area, item_type, title, attribute, price`,
      [providerId, areaIdToUse, itemType, title, attribute ? JSON.stringify(attribute) : null, price ?? null]
    );

    const itemId = itemRows[0].id_item;

    if (itemType === 'tour') {
      const startAt = extraData?.startAt && extraData.startAt !== '' ? extraData.startAt : null;
      const endAt = extraData?.endAt && extraData.endAt !== '' ? extraData.endAt : null;

      await client.query(
        `INSERT INTO tours (id_item, guide_language, attribute, start_at, end_at, price)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [itemId, extraData?.guideLanguage, attribute ? JSON.stringify(attribute) : null, startAt, endAt, price]
      );
    } else if (itemType === 'accommodation') {
      await client.query(
        `INSERT INTO accommodations (
          id_item, address, hotel_type, star_rating, checkin_time, checkout_time, policies, attribute,
          phone_number, province_id, district_id, ward_id, specific_address
        ) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          itemId,
          extraData?.address || '',
          extraData?.hotelType || 'Khách sạn',
          Number(extraData?.starRating || extraData?.stars) || 3,
          extraData?.checkinTime || '14:00',
          extraData?.checkoutTime || '12:00',
          extraData?.policies ? JSON.stringify(extraData.policies) : JSON.stringify({ cancellation: 'Linh hoạt', children: 'Cho phép', pets: 'Không cho phép' }),
          attribute ? JSON.stringify(attribute) : null,
          extraData?.phoneNumber || null,
          extraData?.provinceId || null,
          extraData?.districtId || null,
          extraData?.wardId || null,
          extraData?.specificAddress || null
        ]
      );
    } else if (itemType === 'ticket') {
      await client.query(
        `INSERT INTO tickets (id_item, ticket_kind) VALUES ($1, $2)`,
        [itemId, extraData?.ticketKind]
      );
    } else if (itemType === 'vehicle') {
      await client.query(
        `INSERT INTO vehicle (
          id_item, code_vehicle, max_guest, departure_time, departure_point, arrival_time, arrival_point, 
          estimated_duration, attribute, phone_number,
          departure_province_id, departure_district_id, departure_ward_id,
          arrival_province_id, arrival_district_id, arrival_ward_id
        ) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          itemId,
          extraData?.codeVehicle || '',
          Number(extraData?.maxGuest) || 45,
          attribute?.departureTime || null,
          attribute?.departurePoint || null,
          attribute?.arrivalTime || null,
          attribute?.arrivalPoint || null,
          attribute?.estimatedDuration || null,
          attribute ? JSON.stringify(attribute) : null,
          extraData?.phoneNumber || null,
          extraData?.departureProvinceId || null,
          extraData?.departureDistrictId || null,
          extraData?.departureWardId || null,
          extraData?.arrivalProvinceId || null,
          extraData?.arrivalDistrictId || null,
          extraData?.arrivalWardId || null
        ]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(toCamel(itemRows[0] as Record<string, unknown>));
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create bookable item error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  } finally {
    client.release();
  }
}

/** Manage vehicle trips */
export async function addVehicleTrip(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { idVehicle } = req.params;
    const { departureTime, arrivalTime, priceOverride } = req.body;

    // Ownership check
    const check = await pool.query(
      `SELECT v.id_vehicle FROM vehicle v
       JOIN bookable_items bi ON bi.id_item = v.id_item
       JOIN provider p ON p.id_provider = bi.id_provider
       WHERE v.id_vehicle = $1 AND p.id_user = $2`,
      [idVehicle, userId]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền quản lý phương tiện này' });
    }

    const { rows } = await pool.query(
      `INSERT INTO vehicle_trips (id_vehicle, departure_time, arrival_time, price_override)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [idVehicle, departureTime, arrivalTime || null, priceOverride || null]
    );

    res.status(201).json(toCamel(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('Add vehicle trip error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function deleteVehicleTrip(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { idTrip } = req.params;

    const check = await pool.query(
      `SELECT vt.id_trip FROM vehicle_trips vt
       JOIN vehicle v ON v.id_vehicle = vt.id_vehicle
       JOIN bookable_items bi ON bi.id_item = v.id_item
       JOIN provider p ON p.id_provider = bi.id_provider
       WHERE vt.id_trip = $1 AND p.id_user = $2`,
      [idTrip, userId]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa chuyến đi này' });
    }

    await pool.query('DELETE FROM vehicle_trips WHERE id_trip = $1', [idTrip]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete vehicle trip error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

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
      `SELECT DISTINCT ON (COALESCE(bi.attribute->>'group_id', bi.id_item::text)) 
               bi.id_item, bi.id_provider, bi.id_area, bi.item_type, bi.title, bi.attribute, bi.price, bi.created_at,
               p.name AS provider_name, a.name AS area_name
       FROM bookable_items bi
       JOIN provider p ON p.id_provider = bi.id_provider
       LEFT JOIN area a ON a.id_area = bi.id_area
       WHERE (p.id_user = $1 OR $2 = 'admin') AND bi.status != 'deleted'
       ORDER BY (COALESCE(bi.attribute->>'group_id', bi.id_item::text)), bi.created_at DESC`,
      [userId, req.user!.role]
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
       WHERE (p.id_user = $1 OR $2 = 'admin')
       ORDER BY a.name`,
      [userId, req.user!.role]
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
      `SELECT p.id_provider, p.name, p.id_area, p.id_user, p.phone, p.email, p.fanpage, p.service_type, p.legal_documents, p.status,
              p.bank_name, p.bank_account_number, p.bank_account_name,
              a.name AS area_name, c.name AS city_name, co.name AS country_name
       FROM provider p
       LEFT JOIN area a ON a.id_area = p.id_area
       LEFT JOIN cities c ON c.id_city = a.id_city
       LEFT JOIN countries co ON co.id_country = c.id_country
       WHERE (p.id_user = $1 OR $2 = 'admin')
       ORDER BY p.name`,
      [userId, req.user!.role]
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
        email: r.email,
        fanpage: r.fanpage,
        serviceType: r.service_type,
        bankName: r.bank_name,
        bankAccountNumber: r.bank_account_number,
        bankAccountName: r.bank_account_name,
        legalDocuments: r.legal_documents,
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
      'SELECT id_provider FROM provider WHERE id_provider = $1 AND (id_user = $2 OR $3 = \'admin\')',
      [providerId, userId, req.user!.role]
    );

    if (providerCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền xem dịch vụ của nhà cung cấp này' });
    }

    const { rows } = await pool.query(
      `SELECT id_item, id_provider, id_area, item_type, title, attribute, price, created_at
       FROM bookable_items
       WHERE id_provider = $1 AND status != 'deleted'
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
       WHERE bi.id_item = $1 AND (p.id_user = $2 OR $3 = 'admin') AND bi.status != 'deleted'`,
      [idItem, userId, req.user!.role]
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
                phone_number, province_id, district_id, ward_id, specific_address, total_rooms
         FROM accommodations WHERE id_item = $1`,
        [idItem]
      );
      details = rows[0] ? toCamel(rows[0] as Record<string, unknown>) : {};
      // Also fetch rooms for accommodation
      const { rows: rooms } = await pool.query('SELECT id_room, name_room, max_guest, price, attribute, media, description, quantity FROM accommodations_rooms WHERE id_item = $1 ORDER BY price ASC', [idItem]);
      details.rooms = rooms.map(r => toCamel(r as Record<string, unknown>));
    } else if (itemType === 'vehicle') {
      const { rows } = await pool.query(
        `SELECT id_vehicle, id_item, code_vehicle, max_guest, 
                departure_time::text, departure_point, arrival_time::text, 
                arrival_point, estimated_duration, attribute, phone_number,
                departure_province_id, departure_district_id, departure_ward_id,
                arrival_province_id, arrival_district_id, arrival_ward_id,
                departure_date::text, arrival_date::text
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

    // Handle Daily Tour Grouping for Owner Edit
    const itemAttr = item.attribute as any;
    const groupId = itemAttr?.group_id;
    if (itemType === 'tour' && groupId) {
      const { rows: groupRows } = await pool.query(
        `SELECT MIN(t.start_at) as min_start, MAX(t.end_at) as max_end, ARRAY_AGG(bi.id_item) as item_ids
         FROM bookable_items bi
         JOIN tours t ON t.id_item = bi.id_item
         WHERE bi.attribute->>'group_id' = $1`,
        [groupId]
      );
      if (groupRows.length > 0 && groupRows[0].min_start) {
        details.startAt = groupRows[0].min_start;
        details.endAt = groupRows[0].max_end;
        item.groupIds = groupRows[0].item_ids;
      }
    }

    // Intelligently merge attributes: prioritize specific item type's attribute if it's not null, 
    // otherwise fallback to base item's attribute.
    const finalAttribute = { ...(details.attribute || itemAttr || {}) };
    
    // Clean for UI
    if (finalAttribute.group_id) {
        finalAttribute['Dạng tour'] = 'Tour nhóm hằng ngày';
        // Keep group_id for later if needed, but the user asked to not let it be detected like a technical field
        // But we might need it for logic. Let's keep it in the base item but maybe rename it in finalAttribute display.
    }

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
      `SELECT bi.id_item, bi.item_type, bi.attribute FROM bookable_items bi
       JOIN provider p ON p.id_provider = bi.id_provider
       WHERE bi.id_item = $1 AND (p.id_user = $2 OR $3 = 'admin') AND bi.status != 'deleted'`,
      [idItem, userId, req.user!.role]
    );

    if (itemRows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy dịch vụ hoặc bạn không có quyền' });
    }

    const itemType = itemRows[0].item_type;
    const existingAttr = itemRows[0].attribute || {};
    const groupId = existingAttr.group_id;

    await client.query('BEGIN');

    // Update base item
    if (groupId) {
      // Fetch all instances in the group ordered by their current start date
      const { rows: instances } = await client.query(
        `SELECT bi.id_item, bi.attribute, t.start_at, t.end_at 
         FROM bookable_items bi
         LEFT JOIN tours t ON t.id_item = bi.id_item
         WHERE bi.attribute->>'group_id' = $1
         ORDER BY t.start_at ASC`,
        [groupId]
      );

      const targetStartAt = extraData?.startAt ? new Date(extraData.startAt) : null;
      // Note: we don't necessarily update endAt for every day to be the MAX, 
      // instead each day is 1 day.

      for (let i = 0; i < instances.length; i++) {
        const inst = instances[i];
        // Prepare attribute: merge group-level changes but keep instance-specific ones.
        const cleanedAttribute = { ...(attribute || {}) };
        
        // Remove individual date-specific attributes that shouldn't be bulk-updated
        const dateKeys = ['departureDate', 'arrivalDate', 'startAt', 'endAt', 'bookingDate', 'startDate', 'endDate'];
        dateKeys.forEach(key => delete cleanedAttribute[key]);

        const updatedAttr = { 
          ...(inst.attribute || {}), 
          ...cleanedAttribute,
          group_id: groupId
        };

        await client.query(
          `UPDATE bookable_items 
           SET title = $1, price = $2, attribute = $3, description = $4, star_rating = $5 
           WHERE id_item = $6`,
          [
            title,
            price,
            JSON.stringify(updatedAttr),
            req.body.description || null,
            extraData?.starRating || 0,
            inst.id_item
          ]
        );

        // Update type-specific details if it's a tour
        if (itemType === 'tour' && extraData) {
          // If a new range start was provided, shift each day accordingly
          let instStart = inst.start_at;
          let instEnd = inst.end_at;

          if (targetStartAt) {
            const newDayStart = new Date(targetStartAt);
            newDayStart.setDate(newDayStart.getDate() + i);
            const newDayEnd = new Date(newDayStart);
            newDayEnd.setHours(23, 59, 59, 999);
            
            instStart = newDayStart;
            instEnd = newDayEnd;
          }

          await client.query(
            `INSERT INTO tours (id_item, guide_language, max_slots, tour_type, start_at, end_at, attribute)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id_item) DO UPDATE 
             SET guide_language = EXCLUDED.guide_language, 
                 max_slots = EXCLUDED.max_slots, 
                 tour_type = EXCLUDED.tour_type,
                 attribute = EXCLUDED.attribute,
                 start_at = EXCLUDED.start_at,
                 end_at = EXCLUDED.end_at`,
            [
              inst.id_item, 
              extraData.guideLanguage || '', 
              Number(extraData.maxSlots) || 0, 
              extraData.tourType || 'group',
              instStart,
              instEnd,
              JSON.stringify(updatedAttr)
            ]
          );
        }

        // Sync media from the primary item (the one being edited) to all others
        if (inst.id_item !== idItem) {
          await client.query('DELETE FROM item_media WHERE id_item = $1', [inst.id_item]);
          await client.query(
            `INSERT INTO item_media (id_item, url, type)
             SELECT $1, url, type FROM item_media WHERE id_item = $2`,
            [inst.id_item, idItem]
          );
        }
      }
    } else {
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
      }
    }

    // Update other types (accommodation, ticket, vehicle) - Only specific instance
    if (itemType === 'accommodation' && extraData) {
      const { totalRooms } = extraData;
      const { rows: sumRows } = await client.query(
        'SELECT SUM(quantity) as total FROM accommodations_rooms WHERE id_item = $1',
        [idItem]
      );
      const currentSum = Number(sumRows[0].total || 0);
      if (Number(totalRooms) < currentSum) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: `Tổng số phòng (${totalRooms}) không được nhỏ hơn tổng số lượng phòng của các hạng phòng hiện có (${currentSum}). Vui lòng giảm số lượng phòng ở từng hạng phòng trước khi giảm tổng số phòng.`
        });
      }

      await client.query(
        `INSERT INTO accommodations (
          id_item, address, hotel_type, star_rating, checkin_time, checkout_time, policies, 
          attribute, phone_number, province_id, district_id, ward_id, specific_address, total_rooms
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
             specific_address = EXCLUDED.specific_address,
             total_rooms = EXCLUDED.total_rooms`,
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
          extraData.specificAddress || null,
          Number(extraData.totalRooms) || 0
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
      const { departureDate, arrivalDate, departureTime, arrivalTime } = attribute || {};

      // Validation
      const now = new Date();
      const depDate = new Date(departureDate);
      const arrDate = new Date(arrivalDate);

      if (depDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
        return res.status(400).json({ message: 'Ngày khởi hành không được nhỏ hơn ngày hiện tại' });
      }
      if (arrDate < depDate) {
        return res.status(400).json({ message: 'Ngày đến phải lớn hơn hoặc bằng ngày khởi hành' });
      }

      // Check 12h gap for departure
      const depDateTime = new Date(`${departureDate}T${departureTime}`);
      const twelveHoursLater = new Date(now.getTime() + 12 * 60 * 60 * 1000);
      if (depDateTime < twelveHoursLater) {
        return res.status(400).json({ message: 'Giờ khởi hành phải cách hiện tại ít nhất 12 tiếng' });
      }

      if (departureDate === arrivalDate) {
        if (arrivalTime <= departureTime) {
          return res.status(400).json({ message: 'Nếu đi và đến cùng ngày, giờ đến phải lớn hơn giờ khởi hành' });
        }
      }

      await client.query(
        `INSERT INTO vehicle (
          id_item, code_vehicle, max_guest, departure_time, departure_point, arrival_time, 
          arrival_point, estimated_duration, attribute, phone_number,
          departure_province_id, departure_district_id, departure_ward_id,
          arrival_province_id, arrival_district_id, arrival_ward_id,
          departure_date, arrival_date
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
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
             arrival_ward_id = EXCLUDED.arrival_ward_id,
             departure_date = EXCLUDED.departure_date,
             arrival_date = EXCLUDED.arrival_date`,
        [
          idItem,
          extraData.codeVehicle || '',
          Number(extraData.maxGuest) || 45,
          departureTime || null,
          attribute?.departurePoint || null,
          arrivalTime || null,
          attribute?.arrivalPoint || null,
          attribute?.estimatedDuration || null,
          attribute ? JSON.stringify(attribute) : null,
          extraData.phoneNumber || null,
          extraData.departureProvinceId || null,
          extraData.departureDistrictId || null,
          extraData.departureWardId || null,
          extraData.arrivalProvinceId || null,
          extraData.arrivalDistrictId || null,
          extraData.arrivalWardId || null,
          departureDate || null,
          arrivalDate || null
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
       WHERE bi.id_item = $1 AND (p.id_user = $2 OR $3 = 'admin') AND bi.status != 'deleted'`,
      [idItem, userId, req.user!.role]
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
      `SELECT id_item FROM bookable_items bi
       JOIN provider p ON p.id_provider = bi.id_provider
       WHERE bi.id_item = $1 AND (p.id_user = $2 OR $3 = 'admin') AND bi.status != 'deleted'`,
      [idItem, userId, req.user!.role]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa dịch vụ này' });
    }

    await client.query('BEGIN');
    await client.query("UPDATE bookable_items SET status = 'deleted' WHERE id_item = $1", [idItem]);
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
       WHERE bi.id_item = $1 AND (p.id_user = $2 OR $3 = 'admin') AND bi.status != 'deleted'`,
      [idItem, userId, req.user!.role]
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

/** Bulk add seats to vehicle */
export async function bulkAddVehiclePositions(req: Request, res: Response) {
  const client = await pool.connect();
  try {
    const userId = req.user!.userId;
    const { idItem } = req.params;
    const { positions } = req.body; // Array of { codePosition, price }

    const check = await client.query(
      `SELECT v.id_vehicle FROM vehicle v
       JOIN bookable_items bi ON bi.id_item = v.id_item
       JOIN provider p ON p.id_provider = bi.id_provider
       WHERE bi.id_item = $1 AND (p.id_user = $2 OR $3 = 'admin') AND bi.status != 'deleted'`,
      [idItem, userId, req.user!.role]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền quản lý phương tiện này' });
    }

    const idVehicle = check.rows[0].id_vehicle;

    await client.query('BEGIN');
    for (const pos of positions) {
      await client.query(
        `INSERT INTO positions (id_vehicle, code_position, price) VALUES ($1, $2, $3)`,
        [idVehicle, pos.codePosition, pos.price]
      );
    }
    await client.query('COMMIT');

    res.json({ success: true, count: positions.length });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Bulk add positions error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  } finally {
    client.release();
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
       WHERE pos.id_position = $1 AND (p.id_user = $2 OR $3 = 'admin') AND bi.status != 'deleted'`,
      [idPosition, userId, req.user!.role]
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
    const { name, areaId, phone, email, fanpage, serviceType, bankName, bankAccountNumber, bankAccountName, agreedTerms } = req.body;

    const files = req.files as Express.Multer.File[];
    const legalDocuments = files ? files.map(file => `/uploads/${file.filename}`) : [];

    const { rows } = await pool.query(
      `INSERT INTO provider (name, id_area, id_user, phone, email, fanpage, service_type, legal_documents, status, bank_name, bank_account_number, bank_account_name, agreed_terms, agreed_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, $11, $12, NOW())
       RETURNING id_provider, name, id_area, id_user, phone, email, fanpage, service_type, legal_documents, status, bank_name, bank_account_number, bank_account_name`,
      [name, areaId, userId, phone, email, fanpage, serviceType, legalDocuments, bankName, bankAccountNumber, bankAccountName, agreedTerms === 'true' || agreedTerms === true]
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

    // Check if item belongs to user via provider and get group_id
    const itemCheck = await pool.query(
      `SELECT bi.id_item, bi.attribute->>'group_id' as group_id 
       FROM bookable_items bi
       JOIN provider p ON p.id_provider = bi.id_provider
       WHERE bi.id_item = $1 AND (p.id_user = $2 OR $3 = 'admin') AND bi.status != 'deleted'`,
      [idItem, userId, req.user!.role]
    );

    if (itemCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền thêm ảnh cho dịch vụ này' });
    }

    const groupId = itemCheck.rows[0].group_id;
    let targetItemIds = [idItem];

    // If part of a daily tour group, find all related items
    if (groupId) {
      const relatedItems = await pool.query(
        "SELECT id_item FROM bookable_items WHERE attribute->>'group_id' = $1",
        [groupId]
      );
      if (relatedItems.rows.length > 0) {
        targetItemIds = relatedItems.rows.map(r => r.id_item);
      }
    }

    const insertedMedia = [];
    for (const file of files) {
      const imageUrl = `/uploads/${file.filename}`;
      // Insert for all target items
      for (const targetId of targetItemIds) {
        const { rows } = await pool.query(
          `INSERT INTO item_media (id_item, url, type) VALUES ($1, $2, 'image')
           RETURNING id_media, id_item, url, type`,
          [targetId, imageUrl]
        );
        // Only collect media for the requested idItem to return in response
        if (String(targetId) === String(idItem)) {
          insertedMedia.push(toCamel(rows[0] as Record<string, unknown>));
        }
      }
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
       WHERE im.id_media = $1 AND (p.id_user = $2 OR $3 = 'admin')`,
      [idMedia, userId, req.user!.role]
    );

    const { rows: mediaInfo } = await pool.query(
      `SELECT url, id_item, (SELECT attribute->>'group_id' FROM bookable_items WHERE id_item = im.id_item) as group_id 
       FROM item_media im WHERE id_media = $1`, 
      [idMedia]
    );

    if (mediaInfo.length > 0) {
      const { url, group_id } = mediaInfo[0];
      if (group_id) {
        // Delete this URL for the entire group
        await pool.query(
          `DELETE FROM item_media 
           WHERE url = $1 AND id_item IN (SELECT id_item FROM bookable_items WHERE attribute->>'group_id' = $2)`,
          [url, group_id]
        );
      } else {
        await pool.query('DELETE FROM item_media WHERE id_media = $1', [idMedia]);
      }
    }

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
    const { nameRoom, maxGuest, attribute, price, media, description, quantity } = req.body;

    // Check if accommodation belongs to user and get total_rooms
    const check = await pool.query(
      `SELECT a.id_item, a.total_rooms FROM accommodations a
       JOIN bookable_items bi ON bi.id_item = a.id_item
       JOIN provider p ON p.id_provider = bi.id_provider
       WHERE a.id_item = $1 AND (p.id_user = $2 OR $3 = 'admin')`,
      [idItem, userId, req.user!.role]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền quản lý dịch vụ này' });
    }

    const { total_rooms } = check.rows[0];

    // Check sum of room quantities
    const { rows: sumRows } = await pool.query(
      'SELECT SUM(quantity) as total FROM accommodations_rooms WHERE id_item = $1',
      [idItem]
    );
    const currentSum = Number(sumRows[0].total || 0);

    const roomQuantity = quantity === undefined ? 1 : Number(quantity);

    if (currentSum + roomQuantity > total_rooms) {
      return res.status(400).json({
        message: `Tổng số lượng phòng vượt quá giới hạn của khách sạn (${total_rooms} phòng). Hiện đã có ${currentSum} phòng. Bạn chỉ có thể thêm tối đa ${total_rooms - currentSum} phòng.`
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO accommodations_rooms (id_item, name_room, max_guest, attribute, price, media, description, quantity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id_room, id_item, name_room, max_guest, attribute, price, media, description, quantity`,
      [idItem, nameRoom, maxGuest, attribute ? JSON.stringify(attribute) : null, price, media ? JSON.stringify(media) : '[]', description, roomQuantity]
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
    const { nameRoom, maxGuest, attribute, price, media, description, quantity } = req.body;

    const check = await pool.query(
      `SELECT r.id_room, r.id_item, a.total_rooms FROM accommodations_rooms r
       JOIN accommodations a ON a.id_item = r.id_item
       JOIN bookable_items bi ON bi.id_item = r.id_item
       JOIN provider p ON p.id_provider = bi.id_provider
       WHERE r.id_room = $1 AND (p.id_user = $2 OR $3 = 'admin')`,
      [idRoom, userId, req.user!.role]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa phòng này' });
    }

    const { id_item, total_rooms } = check.rows[0];

    // Check sum of room quantities excluding current room
    const { rows: sumRows } = await pool.query(
      'SELECT SUM(quantity) as total FROM accommodations_rooms WHERE id_item = $1 AND id_room != $2',
      [id_item, idRoom]
    );
    const otherRoomsSum = Number(sumRows[0].total || 0);

    const roomQuantity = quantity === undefined ? 1 : Number(quantity);

    if (otherRoomsSum + roomQuantity > total_rooms) {
      return res.status(400).json({
        message: `Tổng số lượng phòng vượt quá giới hạn của khách sạn (${total_rooms} phòng). Các hạng phòng khác đã chiếm ${otherRoomsSum} phòng. Bạn chỉ có thể đặt tối đa ${total_rooms - otherRoomsSum} phòng cho hạng này.`
      });
    }

    const { rows } = await pool.query(
      `UPDATE accommodations_rooms 
       SET name_room = $1, max_guest = $2, attribute = $3, price = $4, media = $5, description = $6, quantity = $8
       WHERE id_room = $7
       RETURNING *`,
      [nameRoom, maxGuest, attribute ? JSON.stringify(attribute) : null, price, media ? JSON.stringify(media) : '[]', description, idRoom, roomQuantity]
    );

    res.json(toCamel(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('Update room error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

/** Upload images for a specific room */
export async function uploadRoomMedia(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { idRoom } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'Không có ảnh nào được tải lên' });
    }

    const check = await pool.query(
      `SELECT r.id_room, r.media FROM accommodations_rooms r
       JOIN bookable_items bi ON bi.id_item = r.id_item
       JOIN provider p ON p.id_provider = bi.id_provider
       WHERE r.id_room = $1 AND (p.id_user = $2 OR $3 = 'admin')`,
      [idRoom, userId, req.user!.role]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền quản lý phòng này' });
    }

    const currentMedia = check.rows[0].media ? (typeof check.rows[0].media === 'string' ? JSON.parse(check.rows[0].media) : check.rows[0].media) : [];
    const newMedia = files.map(f => ({ url: `/uploads/${f.filename}`, type: 'image' }));
    const updatedMedia = [...currentMedia, ...newMedia];

    await pool.query(
      'UPDATE accommodations_rooms SET media = $1 WHERE id_room = $2',
      [JSON.stringify(updatedMedia), idRoom]
    );

    res.json({ success: true, media: updatedMedia });
  } catch (err) {
    console.error('Upload room media error:', err);
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
       WHERE r.id_room = $1 AND (p.id_user = $2 OR $3 = 'admin')`,
      [idRoom, userId, req.user!.role]
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
       WHERE pos.id_position = $1 AND (p.id_user = $2 OR $3 = 'admin')`,
      [idPosition, userId, req.user!.role]
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
       WHERE bi.id_item = $1 AND (p.id_user = $2 OR $3 = 'admin')`,
      [idItem, userId, req.user!.role]
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
      "SELECT id_provider, id_area, status, service_type FROM provider WHERE id_provider = $1 AND (id_user = $2 OR $3 = 'admin')",
      [providerId, userId, req.user!.role]
    );

    if (providerCheck.rows.length === 0) {
      return res.status(400).json({ message: "Nhà cung cấp không thuộc về bạn" });
    }

    const provider = providerCheck.rows[0];
    if (provider.status !== 'active') {
      return res.status(403).json({ message: "Nhà cung cấp chưa được duyệt. Bạn chưa thể tạo dịch vụ." });
    }

    const areaIdToUse = areaId ?? provider.id_area;
    const finalItemType = provider.service_type || itemType; // Fallback to frontend if not set

    await client.query('BEGIN');

    const { rows: itemRows } = await client.query(
      `INSERT INTO bookable_items (id_provider, id_area, item_type, title, attribute, price)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id_item, id_provider, id_area, item_type, title, attribute, price`,
      [providerId, areaIdToUse, finalItemType, title, attribute ? JSON.stringify(attribute) : null, price ?? null]
    );

    const itemId = itemRows[0].id_item;
    const effectiveItemType = finalItemType;

    if (effectiveItemType === 'tour') {
      const tourType = extraData?.tourType || 'group';
      const startAt = extraData?.startAt && extraData.startAt !== '' ? new Date(extraData.startAt) : null;
      const endAt = extraData?.endAt && extraData.endAt !== '' ? new Date(extraData.endAt) : null;

      if (tourType === 'daily' && startAt && endAt) {
        // We already created one item above, let's treat it as the first day instance
        // Update its start/end to just that day
        const firstDayStart = new Date(startAt);
        const firstDayEnd = new Date(startAt);
        firstDayEnd.setHours(23, 59, 59, 999);

        const groupId = itemId; // Or generate a new one, but itemId is stable
        const updatedAttr = { ...(attribute || {}), group_id: groupId };

        await client.query(
          `UPDATE bookable_items SET attribute = $1 WHERE id_item = $2`,
          [JSON.stringify(updatedAttr), itemId]
        );

        await client.query(
          `INSERT INTO tours (id_item, guide_language, attribute, start_at, end_at, price, tour_type, max_slots)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [itemId, extraData?.guideLanguage, JSON.stringify(updatedAttr), startAt.toISOString(), firstDayEnd.toISOString(), price, tourType, Number(extraData?.maxSlots) || 0]
        );

        // Create instances for subsequent days
        const currentDate = new Date(startAt);
        currentDate.setDate(currentDate.getDate() + 1);

        while (currentDate <= endAt) {
          const dayStart = new Date(currentDate);
          const dayEnd = new Date(currentDate);
          dayEnd.setHours(23, 59, 59, 999);

          const { rows: subItemRows } = await client.query(
            `INSERT INTO bookable_items (id_provider, id_area, item_type, title, attribute, price)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id_item`,
            [providerId, areaIdToUse, effectiveItemType, title, JSON.stringify(updatedAttr), price ?? null]
          );
          const subItemId = subItemRows[0].id_item;

          await client.query(
            `INSERT INTO tours (id_item, guide_language, attribute, start_at, end_at, price, tour_type, max_slots)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [subItemId, extraData?.guideLanguage, JSON.stringify(updatedAttr), dayStart.toISOString(), dayEnd.toISOString(), price, tourType, Number(extraData?.maxSlots) || 0]
          );

          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else {
        // Original logic for group/private tours
        await client.query(
          `INSERT INTO tours (id_item, guide_language, attribute, start_at, end_at, price, tour_type, max_slots)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [itemId, extraData?.guideLanguage, attribute ? JSON.stringify(attribute) : null, startAt ? startAt.toISOString() : null, endAt ? endAt.toISOString() : null, price, tourType, Number(extraData?.maxSlots) || 0]
        );
      }
    } else if (effectiveItemType === 'accommodation') {
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
    } else if (effectiveItemType === 'ticket') {
      await client.query(
        `INSERT INTO tickets (id_item, ticket_kind) VALUES ($1, $2)`,
        [itemId, extraData?.ticketKind]
      );
    } else if (effectiveItemType === 'vehicle') {
      const { departureDate, arrivalDate, departureTime, arrivalTime } = attribute || {};

      // Validation
      const now = new Date();
      const depDate = new Date(departureDate);
      const arrDate = new Date(arrivalDate);

      if (depDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
        return res.status(400).json({ message: 'Ngày khởi hành không được nhỏ hơn ngày hiện tại' });
      }
      if (arrDate < depDate) {
        return res.status(400).json({ message: 'Ngày đến phải lớn hơn hoặc bằng ngày khởi hành' });
      }

      // Check 12h gap for departure
      const depDateTime = new Date(`${departureDate}T${departureTime}`);
      const twelveHoursLater = new Date(now.getTime() + 12 * 60 * 60 * 1000);
      if (depDateTime < twelveHoursLater) {
        return res.status(400).json({ message: 'Giờ khởi hành phải cách hiện tại ít nhất 12 tiếng' });
      }

      if (departureDate === arrivalDate) {
        if (arrivalTime <= departureTime) {
          return res.status(400).json({ message: 'Nếu đi và đến cùng ngày, giờ đến phải lớn hơn giờ khởi hành' });
        }
      }

      await client.query(
        `INSERT INTO vehicle (
          id_item, code_vehicle, max_guest, departure_time, departure_point, arrival_time, arrival_point, 
          estimated_duration, attribute, phone_number,
          departure_province_id, departure_district_id, departure_ward_id,
          arrival_province_id, arrival_district_id, arrival_ward_id,
          departure_date, arrival_date
        ) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          itemId,
          extraData?.codeVehicle || '',
          Number(extraData?.maxGuest) || 45,
          departureTime || null,
          attribute?.departurePoint || null,
          arrivalTime || null,
          attribute?.arrivalPoint || null,
          attribute?.estimatedDuration || null,
          attribute ? JSON.stringify(attribute) : null,
          extraData?.phoneNumber || null,
          extraData?.departureProvinceId || null,
          extraData?.departureDistrictId || null,
          extraData?.departureWardId || null,
          extraData?.arrivalProvinceId || null,
          extraData?.arrivalDistrictId || null,
          extraData?.arrivalWardId || null,
          departureDate || null,
          arrivalDate || null
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
       WHERE v.id_vehicle = $1 AND (p.id_user = $2 OR $3 = 'admin')`,
      [idVehicle, userId, req.user!.role]
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
       WHERE vt.id_trip = $1 AND (p.id_user = $2 OR $3 = 'admin')`,
      [idTrip, userId, req.user!.role]
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

/** List orders for the current owner's services */
export async function listOrders(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { status, search } = req.query;

    const params: any[] = [userId, req.user!.role];
    let whereClause = 'WHERE (p.id_user = $1 OR $2 = \'admin\')';
    let idx = 2;

    if (status && status !== 'all') {
      whereClause += ` AND o.status = $${idx++}`;
      params.push(status);
    }

    if (search) {
      whereClause += ` AND (o.order_code ILIKE $${idx} OR u.full_name ILIKE $${idx} OR bi.title ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }

    const { rows } = await pool.query(
      `SELECT o.id_order, o.order_code, o.total_amount, o.status, o.create_at, o.currency,
              u.full_name as customer_name, u.phone as customer_phone,
              STRING_AGG(DISTINCT bi.title, ', ') as service_names,
              COUNT(od.id_item) as item_count
       FROM "order" o
       JOIN (
         SELECT id_order, id_item FROM order_tour_detail
         UNION ALL
         SELECT id_order, id_item FROM order_ticket_detail
         UNION ALL
         SELECT id_order, r.id_item FROM order_accommodations_detail d JOIN accommodations_rooms r ON r.id_room = d.id_room
         UNION ALL
         SELECT id_order, v.id_item FROM order_pos_vehicle_detail d JOIN positions p ON p.id_position = d.id_position JOIN vehicle v ON v.id_vehicle = p.id_vehicle
       ) od ON o.id_order = od.id_order
       JOIN bookable_items bi ON bi.id_item = od.id_item
       JOIN provider p ON p.id_provider = bi.id_provider
       JOIN users u ON u.id_user = o.id_user
       ${whereClause}
       GROUP BY o.id_order, u.id_user
       ORDER BY o.create_at DESC`,
      params
    );

    res.json({
      data: rows.map(r => ({
        id: r.id_order,
        orderNumber: r.order_code,
        customerName: r.customer_name,
        customerPhone: r.customer_phone,
        total: parseFloat(r.total_amount),
        status: r.status,
        createdAt: r.create_at,
        items: [{ serviceName: r.service_names, count: parseInt(r.item_count) }]
      })),
      total: rows.length,
      page: 1,
      totalPages: 1
    });
  } catch (err) {
    console.error('List owner orders error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

/** Release a room (check out early) */
export async function releaseRoom(req: Request, res: Response) {
  const client = await pool.connect();
  try {
    const userId = req.user!.userId;
    const { idOrder } = req.params;

    // 1. Ownership check
    const check = await client.query(
      `SELECT o.id_order FROM "order" o
       JOIN order_accommodations_detail d ON o.id_order = d.id_order
       JOIN accommodations_rooms r ON r.id_room = d.id_room
       JOIN bookable_items bi ON bi.id_item = r.id_item
       JOIN provider p ON p.id_provider = bi.id_provider
       WHERE o.id_order = $1 AND (p.id_user = $2 OR $3 = 'admin')`,
      [idOrder, userId, req.user!.role]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này hoặc đây không phải đơn phòng' });
    }

    await client.query('BEGIN');

    // 2. Update end_date to current_date in local timezone
    await client.query(
      `UPDATE order_accommodations_detail 
       SET end_date = (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date 
       WHERE id_order = $1`,
      [idOrder]
    );

    // 3. Move status to completed if it was active
    await client.query(
      `UPDATE "order" 
       SET status = 'completed' 
       WHERE id_order = $1 AND status IN ('confirmed', 'processing')`,
      [idOrder]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Giải phóng phòng thành công' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Release room error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  } finally {
    client.release();
  }
}

/** Update order status as an owner */
export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { idOrder } = req.params;
    const { status } = req.body;

    // Check ownership: ensure this order contains a service belonging to one of the owner's providers
    const check = await pool.query(
      `SELECT o.id_order, o.status FROM "order" o
       JOIN (
         SELECT id_order, id_item FROM order_tour_detail
         UNION ALL
         SELECT id_order, id_item FROM order_ticket_detail
         UNION ALL
         SELECT id_order, r.id_item FROM order_accommodations_detail d JOIN accommodations_rooms r ON r.id_room = d.id_room
         UNION ALL
         SELECT id_order, v.id_item FROM order_pos_vehicle_detail d JOIN positions p ON p.id_position = d.id_position JOIN vehicle v ON v.id_vehicle = p.id_vehicle
       ) od ON o.id_order = od.id_order
       JOIN bookable_items bi ON bi.id_item = od.id_item
       JOIN provider p ON p.id_provider = bi.id_provider
       WHERE o.id_order = $1 AND (p.id_user = $2 OR $3 = 'admin')`,
      [idOrder, userId, req.user!.role]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền cập nhật đơn hàng này' });
    }

    const currentStatus = check.rows[0].status;

    // Execute update
    const result = await pool.query('UPDATE "order" SET status = $1 WHERE id_order = $2', [status, idOrder]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Không thể cập nhật trạng thái đơn hàng' });
    }

    // Log history
    try {
      await pool.query('INSERT INTO order_status_history (id_order, from_status, to_status) VALUES ($1, $2, $3)', [idOrder, currentStatus, status]);
    } catch (e) { /* ignore history log errors */ }

    res.json({ success: true });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

/** Get detail for a specific order (owner view) */
export async function getOrder(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { idOrder } = req.params;

    // 1. Fetch order and check ownership via service provider
    const orderRes = await pool.query(
      `SELECT o.*, 
              u.full_name as customer_name, u.phone as customer_phone, u.email as customer_email,
              p.name as provider_name
       FROM "order" o
       JOIN (
         SELECT id_order, id_item FROM order_tour_detail
         UNION ALL
         SELECT id_order, id_item FROM order_ticket_detail
         UNION ALL
         SELECT id_order, r.id_item FROM order_accommodations_detail d JOIN accommodations_rooms r ON r.id_room = d.id_room
         UNION ALL
         SELECT id_order, v.id_item FROM order_pos_vehicle_detail d JOIN positions p ON p.id_position = d.id_position JOIN vehicle v ON v.id_vehicle = p.id_vehicle
       ) od ON o.id_order = od.id_order
       JOIN bookable_items bi ON bi.id_item = od.id_item
       JOIN provider p ON p.id_provider = bi.id_provider
       JOIN users u ON u.id_user = o.id_user
       WHERE o.id_order = $1 AND p.id_user = $2`,
      [idOrder, userId]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng hoặc bạn không có quyền xem' });
    }

    const order = orderRes.rows[0];
    const orderType = order.order_type;

    // 2. Fetch type-specific details
    let details: any = {};
    if (orderType === 'tour') {
      const res = await pool.query(
        `SELECT d.*, bi.title, bi.price as base_price 
         FROM order_tour_detail d 
         JOIN bookable_items bi ON bi.id_item = d.id_item 
         WHERE d.id_order = $1`,
        [idOrder]
      );
      details = res.rows[0];
    } else if (orderType === 'accommodation') {
      const res = await pool.query(
        `SELECT d.*, r.name_room, bi.title, bi.price as base_price
         FROM order_accommodations_detail d 
         JOIN accommodations_rooms r ON r.id_room = d.id_room 
         JOIN bookable_items bi ON bi.id_item = r.id_item
         WHERE d.id_order = $1`,
        [idOrder]
      );
      details = res.rows[0];
    } else if (orderType === 'vehicle') {
      const res = await pool.query(
        `SELECT d.*, v.code_vehicle, p.code_position, bi.title, bi.price as base_price
         FROM order_pos_vehicle_detail d 
         JOIN positions p ON p.id_position = d.id_position 
         JOIN vehicle v ON v.id_vehicle = p.id_vehicle
         JOIN bookable_items bi ON bi.id_item = v.id_item
         WHERE d.id_order = $1`,
        [idOrder]
      );
      // Since vehicle can have multiple seats in one order, we might need to aggregate?
      // For now, list all items if multiple, or just take the first if that's how it's handled.
      // The frontend detail page usually expects one 'details' object or a list.
      details = res.rows.length > 1 ? { ...res.rows[0], seats: res.rows.map(r => r.code_position) } : res.rows[0];
    } else if (orderType === 'ticket') {
      const res = await pool.query(
        `SELECT d.*, bi.title, bi.price as base_price 
         FROM order_ticket_detail d 
         JOIN bookable_items bi ON bi.id_item = d.id_item 
         WHERE d.id_order = $1`,
        [idOrder]
      );
      details = res.rows[0];
    }

    // 3. Fetch payments
    const payments = await pool.query('SELECT * FROM payments WHERE id_order = $1', [idOrder]);

    const result = {
      order: {
        ...order,
        total_amount: parseFloat(order.total_amount),
        subtotal_amount: parseFloat(order.subtotal_amount),
        discount_amount: parseFloat(order.discount_amount),
      },
      details,
      payments: payments.rows
    };

    // Prioritize guest_info from details if available
    if (details && details.guest_info) {
      const gInfo = typeof details.guest_info === 'string' ? JSON.parse(details.guest_info) : details.guest_info;
      if (gInfo.fullName) result.order.customer_name = gInfo.fullName;
      if (gInfo.phone) result.order.customer_phone = gInfo.phone;
      if (gInfo.email) result.order.customer_email = gInfo.email;
    }

    res.json({ data: result });
  } catch (err) {
    console.error('Get owner order detail error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function getOwnerDashboard(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;

    // 1. Basic Stats
    const statsQuery = await pool.query(`
      SELECT 
        COUNT(o.id_order) as total_orders,
        SUM(o.owner_amount) as total_revenue,
        (SELECT COUNT(*) FROM bookable_items bi JOIN provider p2 ON bi.id_provider = p2.id_provider WHERE p2.id_user = $1) as total_services
      FROM "order" o
      JOIN provider p ON o.id_provider = p.id_provider
      WHERE p.id_user = $1 AND o.status IN ('confirmed', 'processing', 'completed')
    `, [userId]);

    const stats = statsQuery.rows[0];

    // 2. Chart Data (Last 30 days)
    const chartQuery = await pool.query(`
      SELECT 
        DATE(o.create_at) as date,
        SUM(o.owner_amount) as revenue
      FROM "order" o
      JOIN provider p ON o.id_provider = p.id_provider
      WHERE p.id_user = $1 
        AND o.status IN ('confirmed', 'processing', 'completed')
        AND o.create_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(o.create_at)
      ORDER BY DATE(o.create_at) ASC
    `, [userId]);

    // Fill missing dates
    const chartData = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const match = chartQuery.rows.find(r => {
        const rDate = new Date(r.date);
        return rDate.toISOString().split('T')[0] === dateStr;
      });
      chartData.push({
        name: new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        revenue: match ? parseFloat(match.revenue) : 0
      });
    }

    // 3. Recent Orders
    const recentOrders = await pool.query(`
      SELECT o.*, p.name as provider_name
      FROM "order" o
      JOIN provider p ON o.id_provider = p.id_provider
      WHERE p.id_user = $1
      ORDER BY o.create_at DESC
      LIMIT 10
    `, [userId]);

    res.json({
      totalOrders: parseInt(stats.total_orders) || 0,
      totalRevenue: parseFloat(stats.total_revenue) || 0,
      totalServices: parseInt(stats.total_services) || 0,
      averageRating: 4.8, // Mock for now
      ordersChange: "+12.5%",
      revenueChange: "+15.2%",
      chartData,
      recentOrders: recentOrders.rows.map(r => ({
        ...r,
        total_amount: parseFloat(r.total_amount),
        owner_amount: parseFloat(r.owner_amount)
      }))
    });
  } catch (err) {
    console.error('Owner dashboard error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function getMyPayrollHistory(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { rows } = await pool.query(`
      SELECT 
        pt.*, 
        p.name as provider_name,
        (SELECT COUNT(*) FROM "order" o WHERE o.id_payroll = pt.id_payroll) as order_count
      FROM payroll_transactions pt
      JOIN provider p ON pt.id_provider = p.id_provider
      WHERE p.id_user = $1
      ORDER BY pt.created_at DESC
    `, [userId]);

    res.json({ data: rows });
  } catch (err) {
    console.error('Get my payroll history error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

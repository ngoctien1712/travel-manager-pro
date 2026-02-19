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

/** Add media for bookable item */
export async function addItemMedia(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { idItem } = req.params;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!imageUrl) {
      return res.status(400).json({ message: 'Vui lòng upload hình ảnh' });
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

    const { rows } = await pool.query(
      `INSERT INTO item_media (id_item, url, type) VALUES ($1, $2, 'image')
       RETURNING id_media, id_item, url, type`,
      [idItem, imageUrl]
    );

    res.status(201).json(toCamel(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('Add item media error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

/** Add room to accommodation */
export async function addAccommodationRoom(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { idItem } = req.params;
    const { nameRoom, maxGuest, attribute, price } = req.body;

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
      `INSERT INTO accommodations_rooms (id_item, name_room, max_guest, attribute, price)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_room, id_item, name_room, max_guest, attribute, price`,
      [idItem, nameRoom, maxGuest, attribute ? JSON.stringify(attribute) : null, price]
    );

    res.status(201).json(toCamel(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('Add accommodation room error:', err);
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
      await client.query(
        `INSERT INTO tours (id_item, guide_language, attribute, start_at, end_at, price)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [itemId, extraData?.guideLanguage, extraData?.attribute ? JSON.stringify(extraData.attribute) : null, extraData?.startAt, extraData?.endAt, price]
      );
    } else if (itemType === 'accommodation') {
      await client.query(
        `INSERT INTO accommodations (id_item, address) VALUES ($1, $2)`,
        [itemId, extraData?.address]
      );
    } else if (itemType === 'ticket') {
      await client.query(
        `INSERT INTO tickets (id_item, ticket_kind) VALUES ($1, $2)`,
        [itemId, extraData?.ticketKind]
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

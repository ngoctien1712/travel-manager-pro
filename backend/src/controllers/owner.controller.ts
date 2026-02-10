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

/** List area ownerships for current user (areas they are linked to) */
export async function getMyAreaOwnerships(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { rows } = await pool.query(
      `SELECT ao.id_area_owner, ao.id_area, ao.status, ao.id_user,
              a.name AS area_name, a.status AS area_status,
              c.id_city, c.name AS city_name,
              co.id_country, co.code AS country_code, co.name AS country_name
       FROM area_owners ao
       JOIN area a ON a.id_area = ao.id_area
       JOIN cities c ON c.id_city = a.id_city
       JOIN countries co ON co.id_country = c.id_country
       WHERE ao.id_user = $1
       ORDER BY a.name`,
      [userId]
    );
    res.json({
      data: rows.map((r: Record<string, unknown>) => ({
        id: r.id_area_owner,
        areaId: r.id_area,
        status: r.status,
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

/** Request area ownership (owner selects an area; admin approves later) */
export async function requestAreaOwnership(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { areaId } = req.body;

    const existing = await pool.query(
      'SELECT id_area_owner FROM area_owners WHERE id_user = $1 AND id_area = $2',
      [userId, areaId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Bạn đã đăng ký khu vực này' });
    }

    const { rows } = await pool.query(
      `INSERT INTO area_owners (id_area, id_user, status) VALUES ($1, $2, 'pending')
       RETURNING id_area_owner, id_area, id_user, status`,
      [areaId, userId]
    );
    res.status(201).json(toCamel(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('Request area ownership error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

/** List providers for current user */
export async function getMyProviders(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { rows } = await pool.query(
      `SELECT p.id_provider, p.name, p.id_area, p.id_area_owner, p.id_user,
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
        areaOwnerId: r.id_area_owner,
        areaName: r.area_name,
        cityName: r.city_name,
        countryName: r.country_name,
      })),
    });
  } catch (err) {
    console.error('Get my providers error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

/** Create provider: name + id_area (area must be one of user's approved area_owners) */
export async function createProvider(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { name, areaId } = req.body;

    const approved = await pool.query(
      `SELECT id_area_owner FROM area_owners WHERE id_user = $1 AND id_area = $2 AND status = 'active'`,
      [userId, areaId]
    );
    if (approved.rows.length === 0) {
      return res.status(400).json({
        message: 'Chọn khu vực bạn đã được duyệt (area owner). Nếu chưa có, hãy đăng ký và chờ admin duyệt.',
      });
    }
    const idAreaOwner = approved.rows[0].id_area_owner;

    const { rows } = await pool.query(
      `INSERT INTO provider (name, id_area_owner, id_area, id_user) VALUES ($1, $2, $3, $4)
       RETURNING id_provider, name, id_area, id_area_owner, id_user`,
      [name, idAreaOwner, areaId, userId]
    );
    res.status(201).json(toCamel(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('Create provider error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

/** Create bookable item (service): provider must belong to current user */
export async function createBookableItem(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { providerId, areaId, itemType, title, attribute, price } = req.body;

    const providerCheck = await pool.query(
      'SELECT id_provider, id_area FROM provider WHERE id_provider = $1 AND id_user = $2',
      [providerId, userId]
    );
    if (providerCheck.rows.length === 0) {
      return res.status(400).json({ message: 'Nhà cung cấp không thuộc về bạn' });
    }
    const areaIdToUse = areaId ?? providerCheck.rows[0].id_area;

    const { rows } = await pool.query(
      `INSERT INTO bookable_items (id_provider, id_area, item_type, title, attribute, price)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id_item, id_provider, id_area, item_type, title, attribute, price`,
      [providerId, areaIdToUse, itemType || 'tour', title, attribute ? JSON.stringify(attribute) : null, price ?? null]
    );
    res.status(201).json(toCamel(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('Create bookable item error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

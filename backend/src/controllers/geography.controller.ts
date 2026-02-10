import { Request, Response } from 'express';
import pool from '../config/db.js';

function toCamel(o: Record<string, unknown>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  for (const k of Object.keys(o)) {
    const v = o[k];
    const key = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    r[key] = v;
  }
  if ('idPoi' in r) {
    r.id = r.idPoi;
    if ('idArea' in r) r.areaId = r.idArea;
  } else if ('idArea' in r) {
    r.id = r.idArea;
    if ('idCity' in r) r.cityId = r.idCity;
  } else if ('idCity' in r) {
    r.id = r.idCity;
    if ('idCountry' in r) r.countryId = r.idCountry;
  } else if ('idCountry' in r) {
    r.id = r.idCountry;
  }
  return r;
}

// ---------- Public/Owner list (no auth or any auth) ----------
export async function listCountries(req: Request, res: Response) {
  try {
    const { rows } = await pool.query(
      'SELECT id_country, code, name, name_vi FROM countries ORDER BY name NULLS LAST, code'
    );
    res.json({ data: rows.map((r) => toCamel(r as Record<string, unknown>)) });
  } catch (err) {
    console.error('List countries error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function listCities(req: Request, res: Response) {
  try {
    const countryId = req.query.countryId as string | undefined;
    if (!countryId) {
      return res.status(400).json({ message: 'Thiếu countryId' });
    }
    const { rows } = await pool.query(
      'SELECT id_city, id_country, name, name_vi, latitude, longitude FROM cities WHERE id_country = $1 ORDER BY name',
      [countryId]
    );
    res.json({ data: rows.map((r) => toCamel(r as Record<string, unknown>)) });
  } catch (err) {
    console.error('List cities error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function listAreas(req: Request, res: Response) {
  try {
    const cityId = req.query.cityId as string | undefined;
    const status = (req.query.status as string) || 'active';
    if (!cityId) {
      return res.status(400).json({ message: 'Thiếu cityId' });
    }
    const { rows } = await pool.query(
      status === 'all'
        ? 'SELECT id_area, id_city, name, attribute, status FROM area WHERE id_city = $1 ORDER BY name'
        : 'SELECT id_area, id_city, name, attribute, status FROM area WHERE id_city = $1 AND status = $2 ORDER BY name',
      status === 'all' ? [cityId] : [cityId, status]
    );
    res.json({ data: rows.map((r) => toCamel(r as Record<string, unknown>)) });
  } catch (err) {
    console.error('List areas error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function listPois(req: Request, res: Response) {
  try {
    const areaId = req.query.areaId as string | undefined;
    if (!areaId) {
      return res.status(400).json({ message: 'Thiếu areaId' });
    }
    const { rows } = await pool.query(
      'SELECT id_poi, id_area, name, poi_type FROM point_of_interest WHERE id_area = $1 ORDER BY name',
      [areaId]
    );
    res.json({ data: rows.map((r) => toCamel(r as Record<string, unknown>)) });
  } catch (err) {
    console.error('List POIs error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

// ---------- Admin CRUD Countries ----------
export async function createCountry(req: Request, res: Response) {
  try {
    const { code, name, nameVi } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO countries (code, name, name_vi) VALUES ($1, $2, $3)
       RETURNING id_country, code, name, name_vi`,
      [code, name || null, nameVi || null]
    );
    res.status(201).json(toCamel(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('Create country error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function updateCountry(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { code, name, nameVi } = req.body;
    await pool.query(
      'UPDATE countries SET code = COALESCE($1, code), name = COALESCE($2, name), name_vi = COALESCE($3, name_vi) WHERE id_country = $4',
      [code, name, nameVi, id]
    );
    const { rows } = await pool.query('SELECT id_country, code, name, name_vi FROM countries WHERE id_country = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy quốc gia' });
    res.json(toCamel(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('Update country error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function deleteCountry(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM countries WHERE id_country = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ message: 'Không tìm thấy quốc gia' });
    res.json({ message: 'Đã xóa quốc gia' });
  } catch (err) {
    console.error('Delete country error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

// ---------- Admin CRUD Cities ----------
export async function createCity(req: Request, res: Response) {
  try {
    const { countryId, name, nameVi, latitude, longitude } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO cities (id_country, name, name_vi, latitude, longitude) VALUES ($1, $2, $3, $4, $5)
       RETURNING id_city, id_country, name, name_vi, latitude, longitude`,
      [countryId, name, nameVi || null, latitude ?? null, longitude ?? null]
    );
    res.status(201).json(toCamel(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('Create city error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function updateCity(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { countryId, name, nameVi, latitude, longitude } = req.body;
    await pool.query(
      `UPDATE cities SET id_country = COALESCE($1, id_country), name = COALESCE($2, name), name_vi = COALESCE($3, name_vi),
       latitude = COALESCE($4, latitude), longitude = COALESCE($5, longitude) WHERE id_city = $6`,
      [countryId, name, nameVi, latitude, longitude, id]
    );
    const { rows } = await pool.query(
      'SELECT id_city, id_country, name, name_vi, latitude, longitude FROM cities WHERE id_city = $1',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy thành phố' });
    res.json(toCamel(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('Update city error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function deleteCity(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM cities WHERE id_city = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ message: 'Không tìm thấy thành phố' });
    res.json({ message: 'Đã xóa thành phố' });
  } catch (err) {
    console.error('Delete city error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

// ---------- Admin CRUD Area ----------
export async function createArea(req: Request, res: Response) {
  try {
    const { cityId, name, attribute, status } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO area (id_city, name, attribute, status) VALUES ($1, $2, $3, $4)
       RETURNING id_area, id_city, name, attribute, status`,
      [cityId, name, attribute ? JSON.stringify(attribute) : null, status || 'active']
    );
    res.status(201).json(toCamel(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('Create area error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function updateArea(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { cityId, name, attribute, status } = req.body;
    const updates: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    if (cityId !== undefined) { updates.push(`id_city = $${i++}`); params.push(cityId); }
    if (name !== undefined) { updates.push(`name = $${i++}`); params.push(name); }
    if (attribute !== undefined) { updates.push(`attribute = $${i++}`); params.push(JSON.stringify(attribute)); }
    if (status !== undefined) { updates.push(`status = $${i++}`); params.push(status); }
    if (updates.length === 0) {
      const { rows } = await pool.query('SELECT id_area, id_city, name, attribute, status FROM area WHERE id_area = $1', [id]);
      if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy khu vực' });
      return res.json(toCamel(rows[0] as Record<string, unknown>));
    }
    params.push(id);
    await pool.query(`UPDATE area SET ${updates.join(', ')} WHERE id_area = $${i}`, params);
    const { rows } = await pool.query('SELECT id_area, id_city, name, attribute, status FROM area WHERE id_area = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy khu vực' });
    res.json(toCamel(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('Update area error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function deleteArea(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM area WHERE id_area = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ message: 'Không tìm thấy khu vực' });
    res.json({ message: 'Đã xóa khu vực' });
  } catch (err) {
    console.error('Delete area error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

// ---------- Admin CRUD Point of interest ----------
export async function createPoi(req: Request, res: Response) {
  try {
    const { areaId, name, poiType } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO point_of_interest (id_area, name, poi_type) VALUES ($1, $2, $3)
       RETURNING id_poi, id_area, name, poi_type`,
      [areaId, name, poiType ? JSON.stringify(poiType) : null]
    );
    res.status(201).json(toCamel(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('Create POI error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function updatePoi(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { areaId, name, poiType } = req.body;
    const updates: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    if (areaId !== undefined) { updates.push(`id_area = $${i++}`); params.push(areaId); }
    if (name !== undefined) { updates.push(`name = $${i++}`); params.push(name); }
    if (poiType !== undefined) { updates.push(`poi_type = $${i++}`); params.push(JSON.stringify(poiType)); }
    if (updates.length === 0) {
      const { rows } = await pool.query('SELECT id_poi, id_area, name, poi_type FROM point_of_interest WHERE id_poi = $1', [id]);
      if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy địa điểm' });
      return res.json(toCamel(rows[0] as Record<string, unknown>));
    }
    params.push(id);
    await pool.query(`UPDATE point_of_interest SET ${updates.join(', ')} WHERE id_poi = $${i}`, params);
    const { rows } = await pool.query('SELECT id_poi, id_area, name, poi_type FROM point_of_interest WHERE id_poi = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy địa điểm' });
    res.json(toCamel(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('Update POI error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export async function deletePoi(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM point_of_interest WHERE id_poi = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ message: 'Không tìm thấy địa điểm' });
    res.json({ message: 'Đã xóa địa điểm' });
  } catch (err) {
    console.error('Delete POI error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

# Kế hoạch: Geography Data, Crawl, Admin & Area Owner

Tài liệu này mô tả kế hoạch cho 4 entity **countries**, **cities**, **area**, **point_of_interest**: nguồn crawl, thiết kế JSON (Area.attribute, POI.poi_type), quản lý admin và dữ liệu area owner cần nhập để tạo dịch vụ.

---

## 1. Hiện trạng schema và cần chỉnh

- **countries**: Thêm `name`, `name_vi` (đã có trong schema/migration).
- **cities**: Thêm `name_vi`, `latitude`, `longitude` (đã có).
- **area**: `attribute JSONB`, thêm `status` (đã có).
- **point_of_interest**: `poi_type` đổi từ VARCHAR sang **JSONB** (đã có).

---

## 2. Nguồn dữ liệu crawl

| Entity | Nguồn | Dữ liệu crawl chính |
|--------|------|----------------------|
| **Countries** | REST Countries API, ISO 3166 | code (ISO 2/3), name, name_vi (nếu có). |
| **Cities** | Countries Now API, GeoNames | name, id_country; tuỳ chọn: tọa độ. |
| **Area** | Wikipedia, trang du lịch, OSM | name, id_city; **attribute**: khí hậu, mùa du lịch. |
| **Point of interest** | OSM, API địa điểm | name, id_area; **poi_type**: category, rating, giá, accessibility. |

---

## 3. Area.attribute (JSON)

- **climate_type**, **average_temperature** (min, max, unit), **rainy_season** (from_month, to_month), **best_travel_months**, **weather_notes**, **local_regulations**, **key_features**.

---

## 4. point_of_interest.poi_type (JSON)

- **poi_category** / **poi_sub_type**, **rating**, **price_range**, **activities**, **recommended_time**, **crowd_level**, **suitability**, **tags**, **operating_hours**, **accessibility**, **contact_info**.

---

## 5. Luồng Admin

- CRUD countries, cities, area, point_of_interest.
- Trang Geography (cây Country → City → Area → POI).
- Area status “active” hiển thị cho area owner chọn.

---

## 6. Thông tin Area Owner nhập để tạo dịch vụ

- **Đăng ký**: User (email, phone, full_name, password), AreaOwnerProfile (business_name), Area_owners (chọn Area từ danh sách admin).
- **Tạo Provider**: name, id_area (trong số area đã được gán).
- **Tạo Bookable item**: item_type, title, id_area, attribute, price; theo loại: Tours, Accommodations, Vehicle, Tickets; item_media, item_tag.

---

## 7. Task triển khai

- Schema & migration (đã có).
- TypeScript/JSON types cho Area.attribute và poi_type (đã có).
- Crawl scripts: countries, cities, area, POI (đã có).
- API Backend: CRUD geography, list cho owner, provider/bookable + area.
- Admin UI: Geography, form Area/POI, duyệt area owner.
- Area Owner UI: đăng ký (chọn area), provider, form dịch vụ (bookable item).

-- POI Seed Data for Quảng Ninh, Đà Nẵng, Hồ Chí Minh
-- Created: 2026-03-09
-- Coordinates and Area IDs updated for precise local database match

-- DELETE existing POIs if any to avoid duplicates
DELETE FROM point_of_interest WHERE name IN (
  'Vịnh Hạ Long', 'Công viên Sun World Ha Long', 'Bảo tàng Quảng Ninh', 'Chùa Yên Tử', 'Đảo Tuần Châu',
  'Cầu Rồng', 'Bán đảo Sơn Trà', 'Ngũ Hành Sơn', 'Bà Nà Hills', 'Biển Mỹ Khê',
  'Dinh Độc Lập', 'Nhà thờ Đức Bà', 'Chợ Bến Thành', 'Phố đi bộ Nguyễn Huệ', 'Bảo tàng Chứng tích Chiến tranh'
);

-- ============================================================================
-- 1. QUẢNG NINH
-- ============================================================================

-- Vịnh Hạ Long (Sử dụng ID Area "Hạ Long")
INSERT INTO point_of_interest (id_area, name, latitude, longitude, poi_type)
VALUES ('f08775a2-5cd3-4fff-9c22-f601a39e4518', 'Vịnh Hạ Long', 20.9101, 107.1839, '{
  "poi_category": "nature",
  "poi_sub_type": "bay",
  "rating": {"score": 4.9, "reviews_count": 150000},
  "activities": ["boat_tour", "kayaking", "cave_exploring"],
  "recommended_time": {"time_of_day": ["morning", "afternoon"], "avg_duration_minutes": 240},
  "tags": ["world_heritage", "nature_wonder"]
}'::jsonb);

-- Bảo tàng Quảng Ninh (Sử dụng ID Area "Hạ Long")
INSERT INTO point_of_interest (id_area, name, latitude, longitude, poi_type)
VALUES ('f08775a2-5cd3-4fff-9c22-f601a39e4518', 'Bảo tàng Quảng Ninh', 20.9496, 107.0818, '{
  "poi_category": "culture",
  "poi_sub_type": "museum",
  "rating": {"score": 4.7, "reviews_count": 8500},
  "activities": ["sightseeing", "photography", "history_learning"],
  "recommended_time": {"time_of_day": ["morning", "afternoon"], "avg_duration_minutes": 90},
  "tags": ["architecture", "coal_black", "instagrammable"]
}'::jsonb);

-- Công viên Sun World Ha Long (Sử dụng ID Area "Bãi Cháy")
INSERT INTO point_of_interest (id_area, name, latitude, longitude, poi_type)
VALUES ('d3dd382a-150e-4e8a-9ee1-5941fea7da98', 'Công viên Sun World Ha Long', 20.9482, 107.0628, '{
  "poi_category": "entertainment",
  "poi_sub_type": "theme_park",
  "rating": {"score": 4.5, "reviews_count": 45000},
  "activities": ["rides", "cable_car", "water_park"],
  "recommended_time": {"time_of_day": ["afternoon", "evening"], "avg_duration_minutes": 300},
  "tags": ["family", "cable_car", "fun"]
}'::jsonb);

-- Chùa Yên Tử (Sử dụng ID Area "Yên Tử")
INSERT INTO point_of_interest (id_area, name, latitude, longitude, poi_type)
VALUES ('5302c689-9700-4f40-a694-29a2ef8907a0', 'Chùa Yên Tử', 21.1578, 106.7194, '{
  "poi_category": "culture",
  "poi_sub_type": "temple",
  "rating": {"score": 4.8, "reviews_count": 12000},
  "activities": ["trekking", "sightseeing", "pilgrimage"],
  "recommended_time": {"time_of_day": ["morning"], "avg_duration_minutes": 360},
  "tags": ["spiritual", "mountain", "historical"]
}'::jsonb);

-- ============================================================================
-- 2. ĐÀ NẴNG
-- ============================================================================

-- Cầu Rồng (Sử dụng ID Area "Hải Châu")
INSERT INTO point_of_interest (id_area, name, latitude, longitude, poi_type)
VALUES ('8564adca-d8cf-4e44-8913-0c6951b40d75', 'Cầu Rồng', 16.0611, 108.2275, '{
  "poi_category": "attraction",
  "poi_sub_type": "landmark",
  "rating": {"score": 4.7, "reviews_count": 25000},
  "activities": ["photography", "fire_show_weekend"],
  "recommended_time": {"time_of_day": ["evening"], "avg_duration_minutes": 45},
  "tags": ["night_view", "dragon", "iconic"]
}'::jsonb);

-- Biển Mỹ Khê (Sử dụng ID Area "Sơn Trà")
INSERT INTO point_of_interest (id_area, name, latitude, longitude, poi_type)
VALUES ('9b828aa5-8007-4177-a5cf-c8083da87dea', 'Biển Mỹ Khê', 16.0700, 108.2471, '{
  "poi_category": "nature",
  "poi_sub_type": "beach",
  "rating": {"score": 4.6, "reviews_count": 50000},
  "activities": ["swimming", "sunbathing", "seafood"],
  "recommended_time": {"time_of_day": ["morning", "afternoon"], "avg_duration_minutes": 180},
  "tags": ["sand", "ocean", "relax"]
}'::jsonb);

-- Bán đảo Sơn Trà (Sử dụng ID Area "Sơn Trà")
INSERT INTO point_of_interest (id_area, name, latitude, longitude, poi_type)
VALUES ('9b828aa5-8007-4177-a5cf-c8083da87dea', 'Bán đảo Sơn Trà', 16.1214, 108.2774, '{
  "poi_category": "nature",
  "poi_sub_type": "peninsula",
  "rating": {"score": 4.8, "reviews_count": 18000},
  "activities": ["hiking", "sightseeing", "monkey_watching"],
  "recommended_time": {"time_of_day": ["morning"], "avg_duration_minutes": 180},
  "tags": ["wildlife", "viewpoint", "ling_ung_pagoda"]
}'::jsonb);

-- Ngũ Hành Sơn (Sử dụng ID Area "Ngũ Hành Sơn")
INSERT INTO point_of_interest (id_area, name, latitude, longitude, poi_type)
VALUES ('b0811478-5005-43dc-9821-dbe942f85461', 'Ngũ Hành Sơn', 15.9989, 108.2631, '{
  "poi_category": "nature",
  "poi_sub_type": "mountain",
  "rating": {"score": 4.6, "reviews_count": 32000},
  "activities": ["climbing", "cave_exploring", "spiritual"],
  "recommended_time": {"time_of_day": ["morning", "afternoon"], "avg_duration_minutes": 120},
  "tags": ["marble_mountains", "cave", "pagoda"]
}'::jsonb);

-- ============================================================================
-- 3. HỒ CHÍ MINH
-- ============================================================================

-- Chợ Bến Thành (Sử dụng ID Area "Bến Thành")
INSERT INTO point_of_interest (id_area, name, latitude, longitude, poi_type)
VALUES ('d6855cf7-5a58-4448-abb0-1eb7a4762c35', 'Chợ Bến Thành', 10.7725, 106.6980, '{
  "poi_category": "shopping",
  "poi_sub_type": "market",
  "rating": {"score": 4.2, "reviews_count": 65000},
  "activities": ["shopping", "street_food"],
  "recommended_time": {"time_of_day": ["morning", "evening"], "avg_duration_minutes": 90},
  "tags": ["historic", "local_style", "souvenir"]
}'::jsonb);

-- Nhà thờ Đức Bà (Sử dụng ID Area "Bến Thành")
INSERT INTO point_of_interest (id_area, name, latitude, longitude, poi_type)
VALUES ('d6855cf7-5a58-4448-abb0-1eb7a4762c35', 'Nhà thờ Đức Bà', 10.7798, 106.6990, '{
  "poi_category": "culture",
  "poi_sub_type": "church",
  "rating": {"score": 4.6, "reviews_count": 28000},
  "activities": ["photography", "architecture_tour"],
  "recommended_time": {"time_of_day": ["morning", "afternoon"], "avg_duration_minutes": 45},
  "tags": ["colonial", "spiritual", "center"]
}'::jsonb);

-- Dinh Độc Lập (Sử dụng ID Area "Bến Thành")
INSERT INTO point_of_interest (id_area, name, latitude, longitude, poi_type)
VALUES ('d6855cf7-5a58-4448-abb0-1eb7a4762c35', 'Dinh Độc Lập', 10.7770, 106.6953, '{
  "poi_category": "culture",
  "poi_sub_type": "museum",
  "rating": {"score": 4.5, "reviews_count": 25000},
  "activities": ["history_tour", "garden_walk"],
  "recommended_time": {"time_of_day": ["morning", "afternoon"], "avg_duration_minutes": 120},
  "tags": ["history", "architecture", "monument"]
}'::jsonb);

-- Phố đi bộ Nguyễn Huệ (Sử dụng ID Area "Bến Thành")
INSERT INTO point_of_interest (id_area, name, latitude, longitude, poi_type)
VALUES ('d6855cf7-5a58-4448-abb0-1eb7a4762c35', 'Phố đi bộ Nguyễn Huệ', 10.7741, 106.7022, '{
  "poi_category": "attraction",
  "poi_sub_type": "square",
  "rating": {"score": 4.8, "reviews_count": 80000},
  "activities": ["walking", "street_performance", "cafe_hopping"],
  "recommended_time": {"time_of_day": ["evening"], "avg_duration_minutes": 60},
  "tags": ["nightlife", "center", "fountain"]
}'::jsonb);

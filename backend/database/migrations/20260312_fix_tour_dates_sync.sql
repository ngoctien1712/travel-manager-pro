-- Migration: Fix Tour Dates Synchronization
-- Date: 2026-03-12
-- Goal: Ensure all tour instances have a corresponding record in the 'tours' table 
-- and pull missing dates from the 'attribute' JSON column in 'bookable_items'.

INSERT INTO tours (id_item, guide_language, max_slots, tour_type, start_at, end_at, attribute)
SELECT 
    bi.id_item,
    COALESCE(bi.attribute->>'guideLanguage', ''),
    COALESCE((bi.attribute->>'maxSlots')::INTEGER, 30),
    COALESCE(bi.attribute->>'tourType', 'group'),
    COALESCE(
        NULLIF(bi.attribute->>'departureDate', '')::TIMESTAMPTZ,
        NULLIF(bi.attribute->>'startAt', '')::TIMESTAMPTZ,
        NULL
    ),
    COALESCE(
        NULLIF(bi.attribute->>'arrivalDate', '')::TIMESTAMPTZ,
        NULLIF(bi.attribute->>'endAt', '')::TIMESTAMPTZ,
        NULL
    ),
    bi.attribute
FROM bookable_items bi
WHERE bi.item_type = 'tour'
ON CONFLICT (id_item) DO UPDATE 
SET 
    start_at = COALESCE(tours.start_at, EXCLUDED.start_at),
    end_at = COALESCE(tours.end_at, EXCLUDED.end_at),
    tour_type = COALESCE(tours.tour_type, EXCLUDED.tour_type);

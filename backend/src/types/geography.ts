/**
 * Area.attribute (JSONB) - structure for area climate, regulations, features.
 * @see backend/database/design project/Area/exampleJSON.md
 */
export interface AreaAttributeTemperature {
  min: number;
  max: number;
  unit: 'celsius' | 'fahrenheit';
}

export interface AreaAttributeRainySeason {
  from_month: number; // 1-12
  to_month: number;
}

export interface AreaAttributeKeyFeature {
  name: string;
  details: string;
}

export interface AreaAttributeLocalRegulations {
  noise_restriction_hours?: string;
  building_height_limit_m?: number;
  [key: string]: unknown;
}

export interface AreaAttribute {
  climate_type?: string;
  average_temperature?: AreaAttributeTemperature;
  rainy_season?: AreaAttributeRainySeason;
  best_travel_months?: number[];
  weather_notes?: string[];
  local_regulations?: AreaAttributeLocalRegulations;
  key_features?: AreaAttributeKeyFeature[];
}

/**
 * point_of_interest.poi_type (JSONB) - category, rating, price, activities, etc.
 * @see backend/database/design project/POI/exampleJSON.md
 */
export type PoiCategory = 'food' | 'attraction' | 'cafe' | 'entertainment';
export type PoiSubType = 'restaurant' | 'street_food' | 'beach' | 'museum' | 'bar' | string;

export interface PoiTypeRating {
  score: number;
  reviews_count: number;
}

export interface PoiTypePriceRange {
  level?: string;
  min?: number;
  max?: number;
  currency?: string;
}

export interface PoiTypeRecommendedTime {
  time_of_day?: string[];
  avg_duration_minutes?: number;
}

export interface PoiTypeCrowdLevel {
  weekday?: string;
  weekend?: string;
}

export interface PoiTypeSuitability {
  solo?: boolean;
  couple?: boolean;
  family?: boolean;
  group?: boolean;
}

export interface PoiTypeOperatingHours {
  [day: string]: string | undefined;
}

export interface PoiTypeAccessibility {
  wheelchair_accessible?: boolean;
  braille_signs?: boolean;
  [key: string]: unknown;
}

export interface PoiTypeContactInfo {
  phone?: string;
  website?: string;
}

export interface PoiType {
  poi_category?: PoiCategory;
  poi_sub_type?: PoiSubType;
  rating?: PoiTypeRating;
  price_range?: PoiTypePriceRange;
  activities?: string[];
  recommended_time?: PoiTypeRecommendedTime;
  crowd_level?: PoiTypeCrowdLevel;
  suitability?: PoiTypeSuitability;
  tags?: string[];
  operating_hours?: PoiTypeOperatingHours;
  accessibility?: PoiTypeAccessibility;
  contact_info?: PoiTypeContactInfo;
}

export interface CountryRow {
  id_country: string;
  code: string;
  name: string | null;
  name_vi: string | null;
}

export interface CityRow {
  id_city: string;
  id_country: string;
  name: string;
  name_vi: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface AreaRow {
  id_area: string;
  id_city: string;
  name: string;
  attribute: AreaAttribute | null;
  status: string;
}

export interface PointOfInterestRow {
  id_poi: string;
  id_area: string;
  name: string;
  poi_type: PoiType | null;
}

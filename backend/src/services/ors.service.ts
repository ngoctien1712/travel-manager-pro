import dotenv from 'dotenv';
dotenv.config();

const ORS_API_KEY = process.env.OPENROUTE_SERVICE_KEY || '';
const ORS_BASE_URL = 'https://api.openrouteservice.org';

/**
 * OpenRouteService integration using Native Fetch (Node.js 18+)
 */
export const orsService = {
    /**
     * Tìm tọa độ từ tên địa danh (Geocoding)
     */
    geocode: async (text: string) => {
        try {
            const url = `${ORS_BASE_URL}/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(text)}&size=1&boundary.country=VN`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.features && data.features.length > 0) {
                const [lng, lat] = data.features[0].geometry.coordinates;
                return { lat, lng, name: data.features[0].properties.label };
            }
            return null;
        } catch (error) {
            console.error('ORS Geocode Error:', error);
            return null;
        }
    },

    /**
     * Gợi ý địa danh khi gõ (Autocomplete)
     */
    autocomplete: async (text: string) => {
        try {
            const url = `${ORS_BASE_URL}/geocode/autocomplete?api_key=${ORS_API_KEY}&text=${encodeURIComponent(text)}&size=5&boundary.country=VN`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.features) {
                return data.features.map((f: any) => ({
                    label: f.properties.label,
                    coordinates: {
                        lat: f.geometry.coordinates[1],
                        lng: f.geometry.coordinates[0]
                    }
                }));
            }
            return [];
        } catch (error) {
            console.error('ORS Autocomplete Error:', error);
            return [];
        }
    },

    /**
     * Tìm kiếm POI (Point of Interest) trong bán kính quanh một điểm
     */
    findPoisInRange: async (lat: number, lng: number, radius: number = 10000) => {
        try {
            const response = await fetch(`${ORS_BASE_URL}/pois`, {
                method: 'POST',
                headers: {
                    'Authorization': ORS_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    request: 'pois',
                    geometry: {
                        geojson: {
                            type: 'Point',
                            coordinates: [lng, lat]
                        },
                        buffer: radius
                    },
                    filter_category_ids: [
                        621, // Restaurants
                        191, // Fast food
                        567, // Cafes
                        162, // Bar/Pub
                        564, // Pub
                        115, // Ice cream
                        193, // Food court
                        304, // Shopping (convenience, supermarket)
                        312, // Convenience
                        313, // Supermarket
                        305, // Mall
                        518, // Attractions
                        572, // View points
                        522, // Museum
                        641, // Theme park
                        642, // Zoo
                        430  // Parks
                    ],
                    limit: 200
                })
            });

            const data = await response.json();

            if (data.features) {
                return data.features.map((f: any) => ({
                    name: f.properties.osm_tags?.name || f.properties.osm_tags?.name_en || 'Unknown Place',
                    poi_type: {
                        category: f.properties.category_ids?.toString(),
                        osm_id: f.properties.osm_id
                    },
                    latitude: f.geometry.coordinates[1],
                    longitude: f.geometry.coordinates[0]
                })).filter((p: any) => p.name !== 'Unknown Place');
            }
            return [];
        } catch (error) {
            console.error('ORS POIs Error:', error);
            return [];
        }
    }
};

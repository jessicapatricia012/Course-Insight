import { Building } from "./Dataset";
import http from "http";

export interface GeoResponse {
	lat?: number;
	lon?: number;
	error?: string;
}

export async function doGeolocation(buildings: Building[]): Promise<Building[]> {
	const validBuildings = (
		await Promise.all(
			buildings.map(async (building) => {
				try {
					const geoResponse = await fetchGeolocation(building.address);
					if (geoResponse.error) {
						return null; // exclude this building
					}
					building.lat = geoResponse.lat!;
					building.lon = geoResponse.lon!;
					return building;
				} catch {
					return null;
				}
			})
		)
	).filter((building): building is Building => building !== null); // Remove nulls

	return validBuildings;
}

export async function fetchGeolocation(address: string): Promise<GeoResponse> {
	return new Promise((resolve, reject) => {
		const encodedAddress = encodeURIComponent(address);
		const url = `http://cs310.students.cs.ubc.ca:11316/api/v1/project_team271/${encodedAddress}`;
		console.log(url);

		http
			.get(url, (res) => {
				let data = "";

				res.on("data", (chunk) => {
					data += chunk;
				});

				res.on("end", () => {
					try {
						const geoData = JSON.parse(data);
						if (geoData.lat !== undefined && geoData.lon !== undefined) {
							resolve({ lat: geoData.lat, lon: geoData.lon });
						} else {
							resolve({ error: geoData.error || "Failed to get geolocation" });
						}
					} catch {
						resolve({ error: "Failed to get geolocation" });
					}
				});
			})
			.on("error", (err) => {
				reject({ error: "Failed to get geolocation" });
			});
	});
}

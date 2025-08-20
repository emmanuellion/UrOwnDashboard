export type WeatherKind = "sun" | "cloud" | "rain" | "storm" | "snow";

export interface WeatherState {
	kind: WeatherKind;
	tempC: number;
	description: string;
}

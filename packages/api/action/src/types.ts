export interface MapArea {
  mapId: string;
  building: Building;
  title: string;
  level: number;
  constructing: boolean;
  running: boolean;
}

export interface Building {
  type: string;
  title: string;
  facility: string;
}

export interface ResourceInfo {
  fire: number;
  maxFire: number;
  earth: number;
  maxEarth: number;
  wind: number;
  maxWind: number;
  water: number;
  maxWater: number;
  sky: number;
  maxSky: number;
  food: number;
  maxFood: number;
  np: number;
}

export interface ResourceCost {
  fire: number;
  earth: number;
  wind: number;
  water: number;
  sky: number;
  seconds: number;
  reducedSeconds: number;
}

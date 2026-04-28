export interface Place {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePlaceInput {
  name: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface UpdatePlaceInput {
  name?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

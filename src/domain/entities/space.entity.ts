export interface Space {
  id: string;
  placeId: string;
  name: string;
  reference: string | null;
  capacity: number;
  description: string | null;
  opensAt: string;
  closesAt: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSpaceInput {
  placeId: string;
  name: string;
  reference?: string;
  capacity: number;
  description?: string;
  opensAt: string;
  closesAt: string;
}

export interface UpdateSpaceInput {
  name?: string;
  reference?: string;
  capacity?: number;
  description?: string;
  opensAt?: string;
  closesAt?: string;
}

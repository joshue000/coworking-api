export interface Reservation {
  id: string;
  spaceId: string;
  placeId: string;
  clientName: string;
  clientEmail: string;
  reservationDate: Date;
  startTime: string;
  endTime: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReservationInput {
  spaceId: string;
  clientName: string;
  clientEmail: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
}

export interface UpdateReservationInput {
  clientName?: string;
  reservationDate?: string;
  startTime?: string;
  endTime?: string;
}

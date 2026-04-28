import { Place, CreatePlaceInput, UpdatePlaceInput } from "../entities/place.entity";
import { PaginationParams, PaginatedResult } from "../../shared/types/pagination.types";

export interface PlaceRepository {
  findById(id: string): Promise<Place | null>;
  findAll(params: PaginationParams): Promise<PaginatedResult<Place>>;
  create(input: CreatePlaceInput): Promise<Place>;
  update(id: string, input: UpdatePlaceInput): Promise<Place>;
  delete(id: string): Promise<void>;
}

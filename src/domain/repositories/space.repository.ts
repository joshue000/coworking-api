import { Space, CreateSpaceInput, UpdateSpaceInput } from '../entities/space.entity';
import { PaginationParams, PaginatedResult } from '../../shared/types/pagination.types';

export interface SpaceRepository {
  findById(id: string): Promise<Space | null>;
  findByPlaceId(placeId: string, params: PaginationParams): Promise<PaginatedResult<Space>>;
  findAll(params: PaginationParams): Promise<PaginatedResult<Space>>;
  create(input: CreateSpaceInput): Promise<Space>;
  update(id: string, input: UpdateSpaceInput): Promise<Space>;
  delete(id: string): Promise<void>;
}

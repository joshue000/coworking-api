import { PlaceRepository } from '../../../domain/repositories/place.repository';
import { CreatePlaceInput, UpdatePlaceInput } from '../../../domain/entities/place.entity';
import { NotFoundError } from '../../../domain/errors/domain.errors';
import { PaginationParams } from '../../../shared/types/pagination.types';

export class PlaceUseCases {
  constructor(private readonly placeRepository: PlaceRepository) {}

  async getAll(params: PaginationParams) {
    return this.placeRepository.findAll(params);
  }

  async getById(id: string) {
    const place = await this.placeRepository.findById(id);
    if (!place) throw new NotFoundError('Place', id);
    return place;
  }

  async create(input: CreatePlaceInput) {
    return this.placeRepository.create(input);
  }

  async update(id: string, input: UpdatePlaceInput) {
    await this.getById(id);
    return this.placeRepository.update(id, input);
  }

  async delete(id: string) {
    await this.getById(id);
    return this.placeRepository.delete(id);
  }
}

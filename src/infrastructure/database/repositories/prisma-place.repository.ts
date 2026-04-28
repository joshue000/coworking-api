import { PrismaClient } from "@prisma/client";
import { PlaceRepository } from "../../../domain/repositories/place.repository";
import { Place, CreatePlaceInput, UpdatePlaceInput } from "../../../domain/entities/place.entity";
import { PaginationParams, PaginatedResult } from "../../../shared/types/pagination.types";

export class PrismaPlaceRepository implements PlaceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Place | null> {
    return this.prisma.place.findUnique({ where: { id } });
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<Place>> {
    const { page, pageSize } = params;
    const skip = (page - 1) * pageSize;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.place.findMany({ skip, take: pageSize, orderBy: { createdAt: "desc" } }),
      this.prisma.place.count(),
    ]);

    return { data, meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) } };
  }

  async create(input: CreatePlaceInput): Promise<Place> {
    return this.prisma.place.create({ data: input });
  }

  async update(id: string, input: UpdatePlaceInput): Promise<Place> {
    return this.prisma.place.update({ where: { id }, data: input });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.place.delete({ where: { id } });
  }
}

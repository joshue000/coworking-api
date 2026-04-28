import { PrismaClient } from "@prisma/client";
import { SpaceRepository } from "../../../domain/repositories/space.repository";
import { Space, CreateSpaceInput, UpdateSpaceInput } from "../../../domain/entities/space.entity";
import { PaginationParams, PaginatedResult } from "../../../shared/types/pagination.types";

export class PrismaSpaceRepository implements SpaceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Space | null> {
    return this.prisma.space.findUnique({ where: { id }, include: { place: true } });
  }

  async findByPlaceId(placeId: string, params: PaginationParams): Promise<PaginatedResult<Space>> {
    const { page, pageSize } = params;
    const skip = (page - 1) * pageSize;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.space.findMany({ where: { placeId }, skip, take: pageSize, orderBy: { createdAt: "desc" } }),
      this.prisma.space.count({ where: { placeId } }),
    ]);

    return { data, meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) } };
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<Space>> {
    const { page, pageSize } = params;
    const skip = (page - 1) * pageSize;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.space.findMany({ skip, take: pageSize, orderBy: { createdAt: "desc" } }),
      this.prisma.space.count(),
    ]);

    return { data, meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) } };
  }

  async create(input: CreateSpaceInput): Promise<Space> {
    return this.prisma.space.create({ data: input });
  }

  async update(id: string, input: UpdateSpaceInput): Promise<Space> {
    return this.prisma.space.update({ where: { id }, data: input });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.space.delete({ where: { id } });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, IntegrationConfig } from './tenant.entity';
import { ScrapedData } from '../scraper/scraped-data.entity';

export interface CreateTenantDto {
  name: string;
  integrations?: IntegrationConfig[];
}

export interface UpdateTenantDto {
  name?: string;
  integrations?: IntegrationConfig[];
}

export interface ScrapedDataResponse {
  id: number;
  source: string;
  externalId: string;
  tenant?: {
    id: number;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(ScrapedData)
    private readonly scrapedDataRepository: Repository<ScrapedData>,
  ) {}

  async findAll(): Promise<Tenant[]> {
    return this.tenantRepository.find();
  }

  async findOne(id: number): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant;
  }

  async getScrapedData(tenantId: number): Promise<ScrapedDataResponse[]> {
    const tenant = await this.findOne(tenantId);

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    const scrapedData = await this.scrapedDataRepository.find({
      where: { tenant: { id: tenantId } },
      relations: ['tenant'],
      select: {
        id: true,
        source: true,
        externalId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return scrapedData.map((item) => ({
      id: item.id,
      source: item.source,
      externalId: item.externalId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  }

  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    const tenant = this.tenantRepository.create({
      ...createTenantDto,
      integrations: createTenantDto.integrations || [],
    });
    return this.tenantRepository.save(tenant);
  }

  async update(id: number, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(id);
    Object.assign(tenant, updateTenantDto);
    return this.tenantRepository.save(tenant);
  }

  async remove(id: number): Promise<void> {
    const tenant = await this.findOne(id);
    await this.tenantRepository.remove(tenant);
  }
}

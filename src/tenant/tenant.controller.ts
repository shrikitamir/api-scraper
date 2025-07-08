import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { TenantService } from './tenant.service';
import { Tenant, IntegrationConfig } from './tenant.entity';

export class CreateTenantDto {
  name: string;
  integrations?: IntegrationConfig[];
}

export class UpdateTenantDto {
  name?: string;
  integrations?: IntegrationConfig[];
}

export class ScrapedDataResponseDto {
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

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  async findAll(): Promise<Tenant[]> {
    return this.tenantService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Tenant> {
    return this.tenantService.findOne(id);
  }

  @Get(':id/scraped-data')
  async getScrapedData(
    @Param('id') id: number,
  ): Promise<ScrapedDataResponseDto[]> {
    return this.tenantService.getScrapedData(id);
  }

  @Post()
  async create(@Body() createTenantDto: CreateTenantDto): Promise<Tenant> {
    return this.tenantService.create(createTenantDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateTenantDto: UpdateTenantDto,
  ): Promise<Tenant> {
    return this.tenantService.update(id, updateTenantDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<void> {
    return this.tenantService.remove(id);
  }
}

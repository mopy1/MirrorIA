import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecursoNoEncontradoException } from '../../../core/exception/recurso-no-encontrado.exception.js';
import type { CreateProveedorDto } from '../dto/create-proveedor.dto.js';
import type { ProveedorResponseDto } from '../dto/proveedor-response.dto.js';
import { Proveedor } from '../entities/proveedor.entity.js';

@Injectable()
export class ProveedoresService {
  constructor(
    @InjectRepository(Proveedor)
    private readonly proveedorRepository: Repository<Proveedor>,
  ) {}

  async create(dto: CreateProveedorDto): Promise<ProveedorResponseDto> {
    const proveedor = await this.proveedorRepository.save(
      this.proveedorRepository.create({
        razonSocial: dto.razonSocial,
        nit: dto.nit ?? null,
        contactoNombre: dto.contactoNombre ?? null,
        contactoEmail: dto.contactoEmail ?? null,
        contactoTelefono: dto.contactoTelefono ?? null,
        activo: true,
      }),
    );
    return this.toResponse(proveedor);
  }

  async findAll(): Promise<ProveedorResponseDto[]> {
    const proveedores = await this.proveedorRepository.find({
      where: { activo: true },
      order: { razonSocial: 'ASC' },
    });
    return proveedores.map((p) => this.toResponse(p));
  }

  async findOne(id: string): Promise<ProveedorResponseDto> {
    const proveedor = await this.proveedorRepository.findOne({
      where: { id },
    });
    if (!proveedor) {
      throw new RecursoNoEncontradoException('Proveedor', id);
    }
    return this.toResponse(proveedor);
  }

  private toResponse(proveedor: Proveedor): ProveedorResponseDto {
    return {
      id: proveedor.id,
      razonSocial: proveedor.razonSocial,
      nit: proveedor.nit,
      contactoNombre: proveedor.contactoNombre,
      contactoEmail: proveedor.contactoEmail,
      contactoTelefono: proveedor.contactoTelefono,
      activo: proveedor.activo,
    };
  }
}

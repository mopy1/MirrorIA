import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecursoDuplicadoException } from '../../../core/exception/recurso-duplicado.exception.js';
import { RecursoNoEncontradoException } from '../../../core/exception/recurso-no-encontrado.exception.js';
import type { CategoriaResponseDto } from '../dto/catalogo-response.dto.js';
import type { CreateCategoriaDto } from '../dto/create-categoria.dto.js';
import { Categoria } from '../entities/categoria.entity.js';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
  ) {}

  async create(dto: CreateCategoriaDto): Promise<CategoriaResponseDto> {
    const existente = await this.categoriaRepository.findOne({
      where: { slug: dto.slug },
    });
    if (existente) {
      throw new RecursoDuplicadoException(
        `Ya existe una categoría con el slug "${dto.slug}"`,
      );
    }

    let padre: Categoria | null = null;
    if (dto.padreId) {
      padre = await this.categoriaRepository.findOne({
        where: { id: dto.padreId },
      });
      if (!padre) {
        throw new RecursoNoEncontradoException('Categoría padre', dto.padreId);
      }
    }

    const categoria = await this.categoriaRepository.save(
      this.categoriaRepository.create({
        nombre: dto.nombre,
        slug: dto.slug,
        padre,
        activo: true,
      }),
    );
    return this.toResponse(categoria);
  }

  async findAll(): Promise<CategoriaResponseDto[]> {
    const categorias = await this.categoriaRepository.find({
      where: { activo: true },
      relations: { padre: true },
      order: { nombre: 'ASC' },
    });
    return categorias.map((c) => this.toResponse(c));
  }

  private toResponse(categoria: Categoria): CategoriaResponseDto {
    return {
      id: categoria.id,
      nombre: categoria.nombre,
      slug: categoria.slug,
      padreId: categoria.padre?.id ?? null,
      activo: categoria.activo,
    };
  }
}

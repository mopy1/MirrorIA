import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecursoDuplicadoException } from '../../../core/exception/recurso-duplicado.exception.js';
import { RecursoNoEncontradoException } from '../../../core/exception/recurso-no-encontrado.exception.js';
import type {
  ProductoResponseDto,
  VarianteResponseDto,
} from '../dto/catalogo-response.dto.js';
import type { CreateProductoDto } from '../dto/create-producto.dto.js';
import type { CreateVarianteDto } from '../dto/create-variante.dto.js';
import type { UpdateProductoDto } from '../dto/update-producto.dto.js';
import { Categoria } from '../entities/categoria.entity.js';
import { Coleccion } from '../entities/coleccion.entity.js';
import { Color } from '../entities/color.entity.js';
import { Producto } from '../entities/producto.entity.js';
import { Talla } from '../entities/talla.entity.js';
import { VarianteProducto } from '../entities/variante-producto.entity.js';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
    @InjectRepository(Coleccion)
    private readonly coleccionRepository: Repository<Coleccion>,
    @InjectRepository(VarianteProducto)
    private readonly varianteRepository: Repository<VarianteProducto>,
    @InjectRepository(Talla)
    private readonly tallaRepository: Repository<Talla>,
    @InjectRepository(Color)
    private readonly colorRepository: Repository<Color>,
  ) {}

  async create(dto: CreateProductoDto): Promise<ProductoResponseDto> {
    const existente = await this.productoRepository.findOne({
      where: { slug: dto.slug },
    });
    if (existente) {
      throw new RecursoDuplicadoException(
        `Ya existe un producto con el slug "${dto.slug}"`,
      );
    }

    const categoria = await this.categoriaRepository.findOne({
      where: { id: dto.categoriaId },
    });
    if (!categoria) {
      throw new RecursoNoEncontradoException('Categoría', dto.categoriaId);
    }

    const coleccion = await this.coleccionRepository.findOne({
      where: { id: dto.coleccionId },
    });
    if (!coleccion) {
      throw new RecursoNoEncontradoException('Colección', dto.coleccionId);
    }

    const producto = await this.productoRepository.save(
      this.productoRepository.create({
        categoria,
        coleccion,
        titulo: dto.titulo,
        slug: dto.slug,
        descripcion: dto.descripcion ?? null,
        precioCents: dto.precioCents,
        modeloArUrl: dto.modeloArUrl ?? null,
        arOverlayImageUrl: dto.arOverlayImageUrl ?? null,
        imagenes: (dto.imagenes ?? []).map((img, index) => ({
          url: img.url,
          varianteId: img.varianteId,
          esArAsset: img.esArAsset ?? false,
          orden: img.orden ?? index,
        })),
        activo: true,
      }),
    );
    return this.toResponse(producto, []);
  }

  async findAll(): Promise<ProductoResponseDto[]> {
    const productos = await this.productoRepository.find({
      where: { activo: true },
      relations: { categoria: true, coleccion: true },
      order: { createdAt: 'DESC' },
    });
    return productos.map((p) => this.toResponse(p));
  }

  async findOne(id: string): Promise<ProductoResponseDto> {
    const producto = await this.productoRepository.findOne({
      where: { id },
      relations: { categoria: true, coleccion: true },
    });
    if (!producto) {
      throw new RecursoNoEncontradoException('Producto', id);
    }

    const variantes = await this.varianteRepository.find({
      where: { producto: { id } },
      relations: { talla: true, color: true },
      order: { sku: 'ASC' },
    });
    return this.toResponse(producto, variantes);
  }

  async update(
    id: string,
    dto: UpdateProductoDto,
  ): Promise<ProductoResponseDto> {
    const producto = await this.productoRepository.findOne({
      where: { id },
      relations: { categoria: true, coleccion: true },
    });
    if (!producto) {
      throw new RecursoNoEncontradoException('Producto', id);
    }

    if (dto.slug && dto.slug !== producto.slug) {
      const existente = await this.productoRepository.findOne({
        where: { slug: dto.slug },
      });
      if (existente && existente.id !== id) {
        throw new RecursoDuplicadoException(
          `Ya existe un producto con el slug "${dto.slug}"`,
        );
      }
      producto.slug = dto.slug;
    }

    if (dto.categoriaId) {
      const categoria = await this.categoriaRepository.findOne({
        where: { id: dto.categoriaId },
      });
      if (!categoria) {
        throw new RecursoNoEncontradoException('Categoría', dto.categoriaId);
      }
      producto.categoria = categoria;
    }

    if (dto.coleccionId) {
      const coleccion = await this.coleccionRepository.findOne({
        where: { id: dto.coleccionId },
      });
      if (!coleccion) {
        throw new RecursoNoEncontradoException('Colección', dto.coleccionId);
      }
      producto.coleccion = coleccion;
    }

    if (dto.titulo !== undefined) producto.titulo = dto.titulo;
    if (dto.descripcion !== undefined) producto.descripcion = dto.descripcion;
    if (dto.precioCents !== undefined) producto.precioCents = dto.precioCents;
    if (dto.modeloArUrl !== undefined) producto.modeloArUrl = dto.modeloArUrl;
    if (dto.arOverlayImageUrl !== undefined) {
      producto.arOverlayImageUrl = dto.arOverlayImageUrl;
    }
    if (dto.imagenes !== undefined) {
      producto.imagenes = dto.imagenes.map((img, index) => ({
        url: img.url,
        varianteId: img.varianteId,
        esArAsset: img.esArAsset ?? false,
        orden: img.orden ?? index,
      }));
    }
    if (dto.activo !== undefined) producto.activo = dto.activo;

    await this.productoRepository.save(producto);
    return this.findOne(id);
  }

  async createVariante(
    productoId: string,
    dto: CreateVarianteDto,
  ): Promise<VarianteResponseDto> {
    const producto = await this.productoRepository.findOne({
      where: { id: productoId },
    });
    if (!producto) {
      throw new RecursoNoEncontradoException('Producto', productoId);
    }

    const existente = await this.varianteRepository.findOne({
      where: { sku: dto.sku },
    });
    if (existente) {
      throw new RecursoDuplicadoException(
        `Ya existe una variante con el SKU "${dto.sku}"`,
      );
    }

    const talla = await this.tallaRepository.findOne({
      where: { id: dto.tallaId },
    });
    if (!talla) {
      throw new RecursoNoEncontradoException('Talla', dto.tallaId);
    }

    const color = await this.colorRepository.findOne({
      where: { id: dto.colorId },
    });
    if (!color) {
      throw new RecursoNoEncontradoException('Color', dto.colorId);
    }

    const variante = await this.varianteRepository.save(
      this.varianteRepository.create({
        producto,
        talla,
        color,
        sku: dto.sku,
        activo: true,
      }),
    );
    return this.toVarianteResponse(variante, talla, color);
  }

  /**
   * Usado por otros módulos (inventario, ventas) solo para validar que un
   * varianteId exista antes de operar — mismo criterio que
   * ProveedoresService.findOne consumido desde catalogo. Devuelve la
   * variante con su producto cargado porque ventas necesita precioCents.
   */
  async findVarianteById(id: string): Promise<VarianteProducto> {
    const variante = await this.varianteRepository.findOne({
      where: { id },
      relations: { producto: true },
    });
    if (!variante) {
      throw new RecursoNoEncontradoException('Variante de producto', id);
    }
    return variante;
  }

  private toResponse(
    producto: Producto,
    variantes?: VarianteProducto[],
  ): ProductoResponseDto {
    return {
      id: producto.id,
      categoriaId: producto.categoria.id,
      coleccionId: producto.coleccion.id,
      titulo: producto.titulo,
      slug: producto.slug,
      descripcion: producto.descripcion,
      precioCents: producto.precioCents,
      modeloArUrl: producto.modeloArUrl,
      arOverlayImageUrl: producto.arOverlayImageUrl,
      imagenes: producto.imagenes,
      activo: producto.activo,
      variantes: variantes?.map((v) =>
        this.toVarianteResponse(v, v.talla, v.color),
      ),
    };
  }

  private toVarianteResponse(
    variante: VarianteProducto,
    talla: Talla,
    color: Color,
  ): VarianteResponseDto {
    return {
      id: variante.id,
      tallaId: talla.id,
      tallaNombre: talla.nombre,
      colorId: color.id,
      colorNombre: color.nombre,
      sku: variante.sku,
      activo: variante.activo,
    };
  }
}

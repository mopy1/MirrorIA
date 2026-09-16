import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { RecursoDuplicadoException } from '../../../core/exception/recurso-duplicado.exception.js';
import { RecursoNoEncontradoException } from '../../../core/exception/recurso-no-encontrado.exception.js';
import { CreateCuponDto } from '../dto/create-cupon.dto.js';
import { CuponResponseDto } from '../dto/cupon-response.dto.js';
import { ValidarCuponResponseDto } from '../dto/validar-cupon-response.dto.js';
import { Cupon, TipoDescuentoCupon } from '../entities/cupon.entity.js';
import { CuponInvalidoException } from '../exception/cupon-invalido.exception.js';

@Injectable()
export class PromocionesService {
  constructor(
    @InjectRepository(Cupon)
    private readonly cuponRepository: Repository<Cupon>,
  ) {}

  async create(dto: CreateCuponDto): Promise<CuponResponseDto> {
    const codigoNormalizado = dto.codigo.trim().toUpperCase();

    const existente = await this.cuponRepository.findOne({
      where: { codigo: codigoNormalizado },
    });
    if (existente) {
      throw new RecursoDuplicadoException(
        `Ya existe un cupón con el código ${codigoNormalizado}`,
      );
    }

    const fechaInicio = new Date(dto.fechaInicio);
    const fechaFin = new Date(dto.fechaFin);

    if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
      throw new CuponInvalidoException('Las fechas de vigencia proporcionadas no son válidas');
    }

    if (fechaFin < fechaInicio) {
      throw new CuponInvalidoException(
        'La fecha de fin debe ser posterior o igual a la fecha de inicio',
      );
    }

    if (dto.tipoDescuento === TipoDescuentoCupon.PORCENTAJE && dto.valor > 100) {
      throw new CuponInvalidoException(
        'El porcentaje de descuento no puede ser mayor al 100%',
      );
    }

    const cupon = this.cuponRepository.create({
      codigo: codigoNormalizado,
      tipoDescuento: dto.tipoDescuento,
      valor: dto.valor,
      fechaInicio,
      fechaFin,
      usosMaximos: dto.usosMaximos ?? null,
      usosActuales: 0,
      montoMinimoCents: dto.montoMinimoCents ?? null,
      activo: dto.activo ?? true,
    });

    const guardado = await this.cuponRepository.save(cupon);
    return this.toResponseDto(guardado);
  }

  async findAll(): Promise<CuponResponseDto[]> {
    const cupones = await this.cuponRepository.find({
      order: { createdAt: 'DESC' },
    });
    return cupones.map((c) => this.toResponseDto(c));
  }

  async findOne(id: string): Promise<CuponResponseDto> {
    const cupon = await this.cuponRepository.findOne({ where: { id } });
    if (!cupon) {
      throw new RecursoNoEncontradoException('Cupón', id);
    }
    return this.toResponseDto(cupon);
  }

  async findByCodigo(codigo: string): Promise<Cupon | null> {
    return this.cuponRepository.findOne({
      where: { codigo: codigo.trim().toUpperCase() },
    });
  }

  async toggleActivo(id: string): Promise<CuponResponseDto> {
    const cupon = await this.cuponRepository.findOne({ where: { id } });
    if (!cupon) {
      throw new RecursoNoEncontradoException('Cupón', id);
    }
    cupon.activo = !cupon.activo;
    const actualizado = await this.cuponRepository.save(cupon);
    return this.toResponseDto(actualizado);
  }

  async validar(
    codigo: string,
    subtotalCents: number,
  ): Promise<ValidarCuponResponseDto> {
    const codigoNormalizado = codigo.trim().toUpperCase();
    const cupon = await this.findByCodigo(codigoNormalizado);

    if (!cupon) {
      return {
        valido: false,
        mensaje: 'El código de cupón no existe',
        descuentoCents: 0,
        totalConDescuentoCents: subtotalCents,
      };
    }

    if (!cupon.activo) {
      return {
        valido: false,
        mensaje: 'El cupón se encuentra inactivo',
        descuentoCents: 0,
        totalConDescuentoCents: subtotalCents,
      };
    }

    const ahora = new Date();
    if (ahora < cupon.fechaInicio) {
      return {
        valido: false,
        mensaje: 'La promoción aún no ha iniciado',
        descuentoCents: 0,
        totalConDescuentoCents: subtotalCents,
      };
    }

    if (ahora > cupon.fechaFin) {
      return {
        valido: false,
        mensaje: 'La promoción ha expirado',
        descuentoCents: 0,
        totalConDescuentoCents: subtotalCents,
      };
    }

    if (cupon.usosMaximos !== null && cupon.usosActuales >= cupon.usosMaximos) {
      return {
        valido: false,
        mensaje: 'El cupón ha alcanzado el límite máximo de usos permitidos',
        descuentoCents: 0,
        totalConDescuentoCents: subtotalCents,
      };
    }

    if (cupon.montoMinimoCents !== null && subtotalCents < cupon.montoMinimoCents) {
      const minBs = (cupon.montoMinimoCents / 100).toFixed(2);
      return {
        valido: false,
        mensaje: `Este cupón requiere una compra mínima de Bs. ${minBs}`,
        descuentoCents: 0,
        totalConDescuentoCents: subtotalCents,
      };
    }

    const descuentoCents = this.calcularDescuento(cupon, subtotalCents);
    const totalConDescuentoCents = Math.max(0, subtotalCents - descuentoCents);

    return {
      valido: true,
      mensaje: 'Cupón aplicado con éxito',
      cupon: this.toResponseDto(cupon),
      descuentoCents,
      totalConDescuentoCents,
    };
  }

  async consumirCupon(
    codigo: string,
    subtotalCents: number,
    manager?: EntityManager,
  ): Promise<{ cupon: Cupon; descuentoCents: number }> {
    const repo = manager ? manager.getRepository(Cupon) : this.cuponRepository;
    const codigoNormalizado = codigo.trim().toUpperCase();

    const cupon = await repo.findOne({
      where: { codigo: codigoNormalizado },
    });

    if (!cupon) {
      throw new CuponInvalidoException(`El cupón ${codigoNormalizado} no existe`);
    }

    if (!cupon.activo) {
      throw new CuponInvalidoException(`El cupón ${codigoNormalizado} está inactivo`);
    }

    const ahora = new Date();
    if (ahora < cupon.fechaInicio || ahora > cupon.fechaFin) {
      throw new CuponInvalidoException(
        `El cupón ${codigoNormalizado} se encuentra fuera de su periodo de vigencia`,
      );
    }

    if (cupon.usosMaximos !== null && cupon.usosActuales >= cupon.usosMaximos) {
      throw new CuponInvalidoException(
        `El cupón ${codigoNormalizado} ha agotado todos sus usos disponibles`,
      );
    }

    if (cupon.montoMinimoCents !== null && subtotalCents < cupon.montoMinimoCents) {
      throw new CuponInvalidoException(
        `El cupón ${codigoNormalizado} requiere un subtotal mínimo de compra`,
      );
    }

    const descuentoCents = this.calcularDescuento(cupon, subtotalCents);

    cupon.usosActuales += 1;
    await repo.save(cupon);

    return { cupon, descuentoCents };
  }

  private calcularDescuento(cupon: Cupon, subtotalCents: number): number {
    if (cupon.tipoDescuento === TipoDescuentoCupon.PORCENTAJE) {
      const desc = Math.round(subtotalCents * (cupon.valor / 100));
      return Math.min(desc, subtotalCents);
    }

    return Math.min(cupon.valor, subtotalCents);
  }

  private toResponseDto(cupon: Cupon): CuponResponseDto {
    return {
      id: cupon.id,
      codigo: cupon.codigo,
      tipoDescuento: cupon.tipoDescuento,
      valor: cupon.valor,
      fechaInicio: cupon.fechaInicio,
      fechaFin: cupon.fechaFin,
      usosMaximos: cupon.usosMaximos,
      usosActuales: cupon.usosActuales,
      montoMinimoCents: cupon.montoMinimoCents,
      activo: cupon.activo,
      createdAt: cupon.createdAt,
      updatedAt: cupon.updatedAt,
    };
  }
}

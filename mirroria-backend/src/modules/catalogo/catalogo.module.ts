import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProveedoresModule } from '../proveedores/proveedores.module.js';
import { CategoriasController } from './controller/categorias.controller.js';
import { ColeccionesController } from './controller/colecciones.controller.js';
import { ColoresController } from './controller/colores.controller.js';
import { ProductosController } from './controller/productos.controller.js';
import { TallasController } from './controller/tallas.controller.js';
import { TemporadasController } from './controller/temporadas.controller.js';
import { Categoria } from './entities/categoria.entity.js';
import { Coleccion } from './entities/coleccion.entity.js';
import { Color } from './entities/color.entity.js';
import { Producto } from './entities/producto.entity.js';
import { Talla } from './entities/talla.entity.js';
import { Temporada } from './entities/temporada.entity.js';
import { VarianteProducto } from './entities/variante-producto.entity.js';
import { CategoriasService } from './service/categorias.service.js';
import { ColeccionesService } from './service/colecciones.service.js';
import { ColoresService } from './service/colores.service.js';
import { ProductosService } from './service/productos.service.js';
import { TallasService } from './service/tallas.service.js';
import { TemporadasService } from './service/temporadas.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Categoria,
      Temporada,
      Coleccion,
      Talla,
      Color,
      Producto,
      VarianteProducto,
    ]),
    // Solo para validar existencia de proveedorId vía ProveedoresService
    // (exportado) al crear una colección — ver ColeccionesService. Catalogo
    // NO importa la entidad Proveedor ni su repositorio directamente.
    ProveedoresModule,
  ],
  controllers: [
    CategoriasController,
    TemporadasController,
    ColeccionesController,
    TallasController,
    ColoresController,
    ProductosController,
  ],
  providers: [
    CategoriasService,
    TemporadasService,
    ColeccionesService,
    TallasService,
    ColoresService,
    ProductosService,
  ],
  // ProductosService exportado para que inventario/ventas puedan validar
  // varianteId (y leer su precioCents) sin importar la entidad
  // VarianteProducto directamente — mismo criterio que ProveedoresService.
  exports: [ProductosService],
})
export class CatalogoModule {}

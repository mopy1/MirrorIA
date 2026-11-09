import { describe, expect, it } from 'vitest';
import { errorDeSlug, slugDesdeEntrada, slugDesdeNombre } from './slug';
import { esDestacado, formatLimite, porcentajeUso, precioPlanBs, resumenLimites } from './limites';
import { armarDto, cambiarCampo, formVacio, validarPaso } from './registro';
import { iniciales, logoParaApp, marcaParaApp } from './marca-tienda';

describe('slug de la tienda', () => {
  it('normaliza acentos, espacios y símbolos', () => {
    expect(slugDesdeNombre('Boutique Lila & Co.')).toBe('boutique-lila-co');
    expect(slugDesdeNombre('  Moda Señorial  ')).toBe('moda-senorial');
  });

  it('acepta válidos y rechaza formato inválido y reservados', () => {
    expect(errorDeSlug('boutique-lila')).toBeNull();
    expect(errorDeSlug('ab')).not.toBeNull();
    expect(errorDeSlug('-lila')).not.toBeNull();
    expect(errorDeSlug('Lila')).not.toBeNull();
    expect(errorDeSlug('admin')).toMatch(/reservada/);
  });

  it('entrar por dirección acepta el link completo', () => {
    expect(slugDesdeEntrada('https://mirroria.app/t/casa-andina/login')).toBe('casa-andina');
    expect(slugDesdeEntrada(' Nomada ')).toBe('nomada');
  });
});

describe('límites del plan', () => {
  it('null es ilimitado y el singular va con 1', () => {
    expect(formatLimite(null, 'sucursal', 'sucursales')).toBe('Sucursales ilimitadas');
    expect(formatLimite(1, 'sucursal', 'sucursales')).toBe('1 sucursal');
    expect(formatLimite(50, 'prenda activa', 'prendas activas')).toBe('50 prendas activas');
  });

  it('resume los tres topes en orden', () => {
    expect(resumenLimites({ maxSucursales: 1, maxProductos: 50, maxUsuariosStaff: null })).toBe(
      '1 sucursal · 50 prendas activas · Cuentas de staff ilimitadas',
    );
  });

  it('porcentaje acotado a 100 y null si es ilimitado', () => {
    expect(porcentajeUso(1, 3)).toBe(33);
    expect(porcentajeUso(5, 3)).toBe(100);
    expect(porcentajeUso(5, null)).toBeNull();
    expect(porcentajeUso(0, 0)).toBe(100);
  });

  it('destacado: el que marca la plataforma, o crecimiento si no hay marca', () => {
    expect(esDestacado({ codigo: 'basico', destacado: true }, [{ destacado: true }, { destacado: false }])).toBe(true);
    expect(esDestacado({ codigo: 'crecimiento' }, [{}, {}])).toBe(true);
    expect(esDestacado({ codigo: 'basico' }, [{}, {}])).toBe(false);
  });

  it('precio entero en bolivianos', () => {
    expect(precioPlanBs(9900)).toBe('Bs 99');
  });
});

describe('asistente de alta de tienda', () => {
  const lleno = () => {
    let f = formVacio('basico');
    f = cambiarCampo(f, 'tienda', 'nombre', 'Boutique Luna', false);
    f = cambiarCampo(f, 'sucursal', 'nombre', 'Central', false);
    f = cambiarCampo(f, 'sucursal', 'direccion', 'Av. Siempre Viva 123', false);
    f = cambiarCampo(f, 'sucursal', 'ciudadId', 'c1', false);
    f = cambiarCampo(f, 'admin', 'fullName', ' Luna Pérez ', false);
    f = cambiarCampo(f, 'admin', 'email', ' Luna@Correo.BO ', false);
    return cambiarCampo(f, 'admin', 'password', 'Secreta2026!', false);
  };

  it('sugiere el slug desde el nombre hasta que se edita a mano', () => {
    const f = lleno();
    expect(f.tienda.slug).toBe('boutique-luna');
    const tocado = cambiarCampo(f, 'tienda', 'nombre', 'Otra Cosa', true);
    expect(tocado.tienda.slug).toBe('boutique-luna');
  });

  it('valida cada paso por separado', () => {
    expect(validarPaso(0, formVacio(''))).toHaveProperty('planCodigo');
    expect(Object.keys(validarPaso(1, formVacio('basico'))).sort()).toEqual(
      ['sucursal.ciudadId', 'sucursal.direccion', 'sucursal.nombre', 'tienda.nombre', 'tienda.slug'],
    );
    expect(validarPaso(1, lleno())).toEqual({});
    expect(validarPaso(2, { ...lleno(), admin: { fullName: 'L', email: 'no', password: '123' } })).toMatchObject({
      'admin.fullName': expect.any(String),
      'admin.email': 'Email inválido',
      'admin.password': 'Mínimo 8 caracteres',
    });
  });

  it('arma el cuerpo del POST: recorta, baja el email y omite el teléfono vacío', () => {
    const dto = armarDto(lleno());
    expect(dto.admin.email).toBe('luna@correo.bo');
    expect(dto.admin.fullName).toBe('Luna Pérez');
    expect(dto.sucursal).not.toHaveProperty('telefono');
    expect(armarDto({ ...lleno(), sucursal: { ...lleno().sucursal, telefono: ' 70012345 ' } }).sucursal.telefono).toBe('70012345');
  });
});

describe('marca de la tienda en la app', () => {
  it('solo usa logos https que el teléfono puede dibujar', () => {
    expect(logoParaApp('/images/marcas/tiendaria.svg', true)).toBeNull();
    expect(logoParaApp('https://x.com/logo.svg', false)).toBeNull();
    expect(logoParaApp('https://x.com/logo.svg', true)).toBe('https://x.com/logo.svg');
    expect(logoParaApp('https://x.com/logo.png', false)).toBe('https://x.com/logo.png');
    expect(logoParaApp(null, true)).toBeNull();
  });

  it('iniciales del nombre', () => {
    expect(iniciales('Casa Andina')).toBe('CA');
    expect(iniciales('luna')).toBe('LU');
    expect(iniciales('  ')).toBe('T');
  });

  it('un principal claro de una tienda en modo oscuro se oscurece para el fondo blanco', () => {
    const tienda = {
      id: '1', slug: 'nomada', nombre: 'Nómada', disponible: true,
      marca: { colorPrimario: '#E3C14B', logoUrl: null, textos: { eslogan: null } },
    } as never;
    const m = marcaParaApp(tienda, true);
    expect(m.colorPrimario).not.toBe('#E3C14B');
    expect(m.disponible).toBe(true);
  });
});

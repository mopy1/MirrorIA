import type { Repository } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OperacionInvalidaException } from '../../../core/exception/operacion-invalida.exception.js';
import type { SucursalesService } from '../../sucursales/service/sucursales.service.js';
import { RolUsuario, type Usuario } from '../entities/usuario.entity.js';
import { UsuariosService } from './usuarios.service.js';

describe('UsuariosService — nunca quedan 0 ADMIN', () => {
  let repo: { findOne: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };
  let service: UsuariosService;
  const admin = (id: string) => ({ id, role: RolUsuario.ADMIN, isActive: true }) as Usuario;

  beforeEach(() => {
    repo = { findOne: vi.fn(), count: vi.fn(), save: vi.fn((u) => u) };
    service = new UsuariosService(
      repo as unknown as Repository<Usuario>,
      { assertExists: vi.fn() } as unknown as SucursalesService,
    );
  });

  it('un ADMIN no puede quitarse su propio rol ni desactivarse (409)', async () => {
    repo.findOne.mockResolvedValue(admin('yo'));
    repo.count.mockResolvedValue(3);
    await expect(service.updateRol('yo', { role: RolUsuario.CUSTOMER }, 'yo')).rejects.toBeInstanceOf(
      OperacionInvalidaException,
    );
    await expect(service.updateEstado('yo', { isActive: false }, 'yo')).rejects.toBeInstanceOf(
      OperacionInvalidaException,
    );
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('no se puede degradar ni desactivar al último ADMIN activo (409)', async () => {
    repo.findOne.mockResolvedValue(admin('otro'));
    repo.count.mockResolvedValue(1);
    await expect(service.updateEstado('otro', { isActive: false }, 'yo')).rejects.toThrow(/último administrador/);
    await expect(service.updateRol('otro', { role: RolUsuario.CUSTOMER }, 'yo')).rejects.toThrow(/último/);
  });

  it('con otro ADMIN activo, sí se puede degradar a un ADMIN ajeno', async () => {
    repo.findOne.mockResolvedValue(admin('otro'));
    repo.count.mockResolvedValue(2);
    const r = await service.updateRol('otro', { role: RolUsuario.CUSTOMER }, 'yo');
    expect(r.role).toBe(RolUsuario.CUSTOMER);
  });
});

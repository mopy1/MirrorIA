// Espejo de los DTO de Wayra en mirroria-backend/src/modules/pagos/dto/wayra.dto.ts

export interface CuentaWayra {
  id: string
  tipo: string
  numeroEnmascarado: string
  saldoCents: number
}

export interface CobroWayra {
  comercio: string
  glosa: string
  referencia: string
  montoCents: number
  estado: "PENDIENTE" | "PAGADO" | "VENCIDO"
  transaccion: string | null
  pagadoEn: string | null
  titular: string
  cuentas: CuentaWayra[]
}

export interface ComprobanteWayra {
  transaccion: string
  comercio: string
  glosa: string
  referencia: string
  montoCents: number
  cuentaOrigen: string
  titular: string
  pagadoEn: string
}

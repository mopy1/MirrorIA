import React from 'react';
import { View } from 'react-native';
import { Cargando, ErrorVista } from '@/components/admin/Estados';
import { Seccion } from '@/components/admin/Seccion';
import { Text } from '@/components/ui/text';
import { describirRango } from '../../lib/fechas-dashboard';
import { filasPrendas, filasProveedores } from '../../lib/graficos';
import { contarCompras } from '../../lib/resumen-negocio';
import type { DashboardEjecutivoDto } from '../../types/dashboard.types';
import { ListaBarras } from '../comun/ListaBarras';
import { ComoTePagan } from './ComoTePagan';
import { FiltrosResumen, type FiltrosResumenProps } from './FiltrosResumen';
import { KpisResumen } from './KpisResumen';
import { ResumenNegocio } from './ResumenNegocio';
import { UsoPlan } from './UsoPlan';
import { VentasPorDia } from './VentasPorDia';

interface Props {
  filtros: FiltrosResumenProps;
  data: DashboardEjecutivoDto | null;
  isLoading: boolean;
  error: string | null;
  onRecargar: () => void;
}

const VACIO_PRENDAS =
  'Todavía no vendiste prendas en estas fechas. Cuando vendas, aquí vas a ver cuáles salen más para reponerlas a tiempo.';
const VACIO_PROVEEDORES =
  'Las prendas vendidas todavía no tienen proveedor asignado. Asignalo en cada prenda para saber de quién conviene comprar más.';

/** "Resumen del negocio": primero la conclusión en palabras, después el detalle. */
export function VistaResumen({ filtros, data, isLoading, error, onRecargar }: Props) {
  const g = data?.graficos;
  return (
    <View className="gap-4">
      <FiltrosResumen {...filtros} />
      {data && !isLoading ? (
        <Text className="text-xs text-muted-foreground">{describirRango(data.periodo)}</Text>
      ) : null}
      {error && !isLoading ? (
        <ErrorVista mensaje="No pudimos cargar el resumen del negocio." onReintentar={onRecargar} />
      ) : !data || !g ? (
        <Cargando texto="Armando el resumen…" />
      ) : (
        <>
          <ResumenNegocio data={data} />
          <KpisResumen data={data} compras={contarCompras(data)} />
          <VentasPorDia dias={g.tendenciaIngresos} />
          <Seccion titulo="Prendas más vendidas">
            {g.topPrendas.length === 0 ? (
              <Text className="text-sm text-muted-foreground">{VACIO_PRENDAS}</Text>
            ) : (
              <ListaBarras conImagen filas={filasPrendas(g.topPrendas)} />
            )}
          </Seccion>
          <ComoTePagan pagos={g.distribucionPagos} />
          <Seccion titulo="Proveedores que más venden">
            {g.topProveedores.length === 0 ? (
              <Text className="text-sm text-muted-foreground">{VACIO_PROVEEDORES}</Text>
            ) : (
              <ListaBarras filas={filasProveedores(g.topProveedores)} />
            )}
          </Seccion>
          <UsoPlan plan={data.planSaaS} />
        </>
      )}
    </View>
  );
}

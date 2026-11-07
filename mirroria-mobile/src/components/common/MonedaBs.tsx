import { Text } from '@/components/ui/text';
import { formatoBs } from '@/lib/formato/dinero';
import { cn } from '@/lib/utils';

/** Montos siempre en Geist Mono con cifras tabulares (la compra se lee como un recibo). */
export function MonedaBs({ cents, className }: { cents: number; className?: string }) {
  return (
    <Text className={cn('font-mono text-sm', className)} style={{ fontVariant: ['tabular-nums'] }}>
      {formatoBs(cents)}
    </Text>
  );
}

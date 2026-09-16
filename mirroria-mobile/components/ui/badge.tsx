import * as React from 'react';
import { View, type ViewProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Text } from './text';

const badgeVariants = cva(
  'inline-flex flex-row items-center rounded-full px-2.5 py-0.5 border',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary',
        secondary: 'border-transparent bg-secondary',
        outline: 'border-border bg-transparent',
        accent: 'border-transparent bg-accent',
        destructive: 'border-transparent bg-destructive',
        success: 'border-emerald-500/20 bg-emerald-500/10',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const badgeTextVariants = cva('text-xs font-semibold', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      outline: 'text-foreground',
      accent: 'text-accent-foreground',
      destructive: 'text-destructive-foreground',
      success: 'text-emerald-600 dark:text-emerald-400',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface BadgeProps
  extends ViewProps,
    VariantProps<typeof badgeVariants> {
  label?: string;
  children?: React.ReactNode;
}

export function Badge({
  className,
  variant,
  label,
  children,
  ...props
}: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant }), className)} {...props}>
      {label ? (
        <Text className={cn(badgeTextVariants({ variant }))}>{label}</Text>
      ) : (
        children
      )}
    </View>
  );
}

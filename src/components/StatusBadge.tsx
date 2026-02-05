 import { Badge } from '@/components/ui/badge';
 import { cn } from '@/lib/utils';
 
 type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'muted';
 
 interface StatusBadgeProps {
   label: string;
   variant: BadgeVariant;
   className?: string;
 }
 
 const variantClasses: Record<BadgeVariant, string> = {
   success: 'bg-success/10 text-success border-success/20 hover:bg-success/15',
   warning: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/15',
   error: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15',
   info: 'bg-info/10 text-info border-info/20 hover:bg-info/15',
   muted: 'bg-muted text-muted-foreground border-border hover:bg-muted/80',
 };
 
 export const StatusBadge = ({ label, variant, className }: StatusBadgeProps) => {
   return (
     <Badge
       variant="outline"
       className={cn(
         'font-medium border',
         variantClasses[variant],
         className
       )}
     >
       {label}
     </Badge>
   );
 };
 
 export default StatusBadge;
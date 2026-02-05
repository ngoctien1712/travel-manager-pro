 import { ReactNode } from 'react';
 import { Card, CardContent } from '@/components/ui/card';
 import { TrendingUp, TrendingDown } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 interface StatCardProps {
   title: string;
   value: string | number;
   icon: ReactNode;
   change?: number;
   changeLabel?: string;
   className?: string;
 }
 
 export const StatCard = ({ title, value, icon, change, changeLabel, className }: StatCardProps) => {
   const isPositive = change && change >= 0;
   
   return (
     <Card className={cn('card-elevated', className)}>
       <CardContent className="p-6">
         <div className="flex items-start justify-between">
           <div className="space-y-2">
             <p className="text-sm font-medium text-muted-foreground">{title}</p>
             <p className="text-2xl font-bold tracking-tight">{value}</p>
             {change !== undefined && (
               <div className="flex items-center gap-1 text-sm">
                 {isPositive ? (
                   <TrendingUp className="h-4 w-4 text-success" />
                 ) : (
                   <TrendingDown className="h-4 w-4 text-destructive" />
                 )}
                 <span className={isPositive ? 'text-success' : 'text-destructive'}>
                   {isPositive ? '+' : ''}{change}%
                 </span>
                 {changeLabel && (
                   <span className="text-muted-foreground">{changeLabel}</span>
                 )}
               </div>
             )}
           </div>
           <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
             {icon}
           </div>
         </div>
       </CardContent>
     </Card>
   );
 };
 
 interface StatsGridProps {
   children: ReactNode;
   className?: string;
 }
 
 export const StatsGrid = ({ children, className }: StatsGridProps) => {
   return (
     <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
       {children}
     </div>
   );
 };
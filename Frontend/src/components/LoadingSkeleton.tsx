 import { Skeleton } from '@/components/ui/skeleton';
 import { cn } from '@/lib/utils';
 
 interface TableSkeletonProps {
   rows?: number;
   columns?: number;
 }
 
 export const TableSkeleton = ({ rows = 5, columns = 5 }: TableSkeletonProps) => {
   return (
     <div className="space-y-3">
       {/* Header */}
       <div className="flex gap-4 pb-4 border-b">
         {Array.from({ length: columns }).map((_, i) => (
           <Skeleton key={i} className="h-4 flex-1" />
         ))}
       </div>
       {/* Rows */}
       {Array.from({ length: rows }).map((_, rowIndex) => (
         <div key={rowIndex} className="flex gap-4 py-3">
           {Array.from({ length: columns }).map((_, colIndex) => (
             <Skeleton key={colIndex} className="h-5 flex-1" />
           ))}
         </div>
       ))}
     </div>
   );
 };
 
 export const CardSkeleton = ({ className }: { className?: string }) => {
   return (
     <div className={cn('rounded-xl border bg-card p-6 space-y-4', className)}>
       <div className="flex justify-between">
         <div className="space-y-2">
           <Skeleton className="h-4 w-24" />
           <Skeleton className="h-8 w-32" />
         </div>
         <Skeleton className="h-12 w-12 rounded-xl" />
       </div>
       <Skeleton className="h-4 w-20" />
     </div>
   );
 };
 
 export const StatsGridSkeleton = () => {
   return (
     <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
       {Array.from({ length: 4 }).map((_, i) => (
         <CardSkeleton key={i} />
       ))}
     </div>
   );
 };
 
 export const ServiceCardSkeleton = () => {
   return (
     <div className="rounded-xl border bg-card overflow-hidden">
       <Skeleton className="h-48 w-full" />
       <div className="p-4 space-y-3">
         <Skeleton className="h-4 w-3/4" />
         <Skeleton className="h-3 w-1/2" />
         <div className="flex justify-between pt-2">
           <Skeleton className="h-5 w-24" />
           <Skeleton className="h-5 w-16" />
         </div>
       </div>
     </div>
   );
 };

// Default loading skeleton used by many pages
const LoadingSkeleton = () => <TableSkeleton rows={5} columns={4} />;

export default LoadingSkeleton;
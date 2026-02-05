 import { ReactNode, useState } from 'react';
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from '@/components/ui/table';
 import { Input } from '@/components/ui/input';
 import { Button } from '@/components/ui/button';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
 import { TableSkeleton } from '@/components/LoadingSkeleton';
 import { EmptyState } from '@/components/EmptyState';
 import { cn } from '@/lib/utils';
 
 export interface Column<T> {
   key: string;
   header: string;
   cell: (item: T) => ReactNode;
   className?: string;
   sortable?: boolean;
 }
 
 export interface FilterOption {
   label: string;
   value: string;
 }
 
 export interface Filter {
   key: string;
   label: string;
   options: FilterOption[];
 }
 
 interface DataTableProps<T> {
   data: T[];
   columns: Column<T>[];
   loading?: boolean;
   page?: number;
   pageSize?: number;
   total?: number;
   onPageChange?: (page: number) => void;
   onPageSizeChange?: (size: number) => void;
   search?: string;
   onSearchChange?: (search: string) => void;
   searchPlaceholder?: string;
   filters?: Filter[];
   filterValues?: Record<string, string>;
   onFilterChange?: (key: string, value: string) => void;
   emptyTitle?: string;
   emptyDescription?: string;
   className?: string;
 }
 
 export function DataTable<T extends { id: string }>({
   data,
   columns,
   loading = false,
   page = 1,
   pageSize = 10,
   total = 0,
   onPageChange,
   onPageSizeChange,
   search,
   onSearchChange,
   searchPlaceholder = 'Tìm kiếm...',
   filters,
   filterValues = {},
   onFilterChange,
   emptyTitle = 'Không có dữ liệu',
   emptyDescription = 'Không tìm thấy kết quả phù hợp',
   className,
 }: DataTableProps<T>) {
   const totalPages = Math.ceil(total / pageSize);
   const startItem = (page - 1) * pageSize + 1;
   const endItem = Math.min(page * pageSize, total);
 
   return (
     <div className={cn('space-y-4', className)}>
       {/* Search and Filters */}
       {(onSearchChange || filters) && (
         <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
           {onSearchChange && (
             <div className="relative flex-1 max-w-sm">
               <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
               <Input
                 placeholder={searchPlaceholder}
                 value={search}
                 onChange={(e) => onSearchChange(e.target.value)}
                 className="pl-9"
               />
             </div>
           )}
           {filters && filters.map((filter) => (
             <Select
               key={filter.key}
               value={filterValues[filter.key] || ''}
               onValueChange={(value) => onFilterChange?.(filter.key, value)}
             >
               <SelectTrigger className="w-[180px]">
                 <SelectValue placeholder={filter.label} />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="">Tất cả</SelectItem>
                 {filter.options.map((option) => (
                   <SelectItem key={option.value} value={option.value}>
                     {option.label}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           ))}
         </div>
       )}
 
       {/* Table */}
       <div className="rounded-lg border bg-card">
         {loading ? (
           <div className="p-6">
             <TableSkeleton rows={pageSize} columns={columns.length} />
           </div>
         ) : data.length === 0 ? (
           <EmptyState title={emptyTitle} description={emptyDescription} />
         ) : (
           <Table>
             <TableHeader>
               <TableRow>
                 {columns.map((column) => (
                   <TableHead key={column.key} className={column.className}>
                     {column.header}
                   </TableHead>
                 ))}
               </TableRow>
             </TableHeader>
             <TableBody>
               {data.map((item) => (
                 <TableRow key={item.id}>
                   {columns.map((column) => (
                     <TableCell key={column.key} className={column.className}>
                       {column.cell(item)}
                     </TableCell>
                   ))}
                 </TableRow>
               ))}
             </TableBody>
           </Table>
         )}
       </div>
 
       {/* Pagination */}
       {total > 0 && (
         <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
           <div className="text-sm text-muted-foreground">
             Hiển thị {startItem}-{endItem} trong tổng số {total} kết quả
           </div>
           <div className="flex items-center gap-2">
             <Select
               value={pageSize.toString()}
               onValueChange={(value) => onPageSizeChange?.(Number(value))}
             >
               <SelectTrigger className="w-[70px]">
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 {[10, 20, 50, 100].map((size) => (
                   <SelectItem key={size} value={size.toString()}>
                     {size}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
             <div className="flex items-center gap-1">
               <Button
                 variant="outline"
                 size="icon"
                 onClick={() => onPageChange?.(1)}
                 disabled={page <= 1}
               >
                 <ChevronsLeft className="h-4 w-4" />
               </Button>
               <Button
                 variant="outline"
                 size="icon"
                 onClick={() => onPageChange?.(page - 1)}
                 disabled={page <= 1}
               >
                 <ChevronLeft className="h-4 w-4" />
               </Button>
               <span className="px-3 text-sm">
                 Trang {page} / {totalPages}
               </span>
               <Button
                 variant="outline"
                 size="icon"
                 onClick={() => onPageChange?.(page + 1)}
                 disabled={page >= totalPages}
               >
                 <ChevronRight className="h-4 w-4" />
               </Button>
               <Button
                 variant="outline"
                 size="icon"
                 onClick={() => onPageChange?.(totalPages)}
                 disabled={page >= totalPages}
               >
                 <ChevronsRight className="h-4 w-4" />
               </Button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }
 
 export default DataTable;
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from '@/components/ui/alert-dialog';
 import { Button } from '@/components/ui/button';
 import { Loader2 } from 'lucide-react';
 
 interface ConfirmDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   title: string;
   description: string;
   confirmLabel?: string;
   cancelLabel?: string;
   variant?: 'default' | 'destructive';
   loading?: boolean;
   onConfirm: () => void;
 }
 
 export const ConfirmDialog = ({
   open,
   onOpenChange,
   title,
   description,
   confirmLabel = 'Xác nhận',
   cancelLabel = 'Hủy',
   variant = 'default',
   loading = false,
   onConfirm,
 }: ConfirmDialogProps) => {
   return (
     <AlertDialog open={open} onOpenChange={onOpenChange}>
       <AlertDialogContent>
         <AlertDialogHeader>
           <AlertDialogTitle>{title}</AlertDialogTitle>
           <AlertDialogDescription>{description}</AlertDialogDescription>
         </AlertDialogHeader>
         <AlertDialogFooter>
           <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
           <Button
             variant={variant === 'destructive' ? 'destructive' : 'default'}
             onClick={onConfirm}
             disabled={loading}
           >
             {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
             {confirmLabel}
           </Button>
         </AlertDialogFooter>
       </AlertDialogContent>
     </AlertDialog>
   );
 };
 
 export default ConfirmDialog;
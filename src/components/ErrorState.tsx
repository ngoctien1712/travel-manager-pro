 import { AlertCircle, RefreshCw } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 
 interface ErrorStateProps {
   title?: string;
   message?: string;
   onRetry?: () => void;
 }
 
 export const ErrorState = ({
   title = 'Đã xảy ra lỗi',
   message = 'Không thể tải dữ liệu. Vui lòng thử lại sau.',
   onRetry,
 }: ErrorStateProps) => {
   return (
     <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
       <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
         <AlertCircle className="h-8 w-8 text-destructive" />
       </div>
       <h3 className="text-lg font-semibold mb-1">{title}</h3>
       <p className="text-sm text-muted-foreground max-w-sm mb-4">{message}</p>
       {onRetry && (
         <Button variant="outline" onClick={onRetry}>
           <RefreshCw className="mr-2 h-4 w-4" />
           Thử lại
         </Button>
       )}
     </div>
   );
 };
 
 export default ErrorState;
 import { ReactNode } from 'react';
 import { Button } from '@/components/ui/button';
 import { FileQuestion } from 'lucide-react';
 
 interface EmptyStateProps {
   icon?: ReactNode;
   title: string;
   description?: string;
   action?: {
     label: string;
     onClick: () => void;
   };
 }
 
 export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => {
   return (
     <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
       <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
         {icon || <FileQuestion className="h-8 w-8 text-muted-foreground" />}
       </div>
       <h3 className="text-lg font-semibold mb-1">{title}</h3>
       {description && (
         <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
       )}
       {action && (
         <Button onClick={action.onClick}>{action.label}</Button>
       )}
     </div>
   );
 };
 
 export default EmptyState;
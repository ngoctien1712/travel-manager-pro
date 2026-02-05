 import { ReactNode } from 'react';
 import { ChevronRight } from 'lucide-react';
 import { Link } from 'react-router-dom';
 
 interface BreadcrumbItem {
   label: string;
   path?: string;
 }
 
 interface PageHeaderProps {
   title: string;
   description?: string;
   breadcrumbs?: BreadcrumbItem[];
   actions?: ReactNode;
 }
 
 export const PageHeader = ({ title, description, breadcrumbs, actions }: PageHeaderProps) => {
   return (
     <div className="mb-6">
       {breadcrumbs && breadcrumbs.length > 0 && (
         <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
           {breadcrumbs.map((item, index) => (
             <span key={index} className="flex items-center gap-1">
               {index > 0 && <ChevronRight className="h-4 w-4" />}
               {item.path ? (
                 <Link to={item.path} className="hover:text-foreground transition-colors">
                   {item.label}
                 </Link>
               ) : (
                 <span className="text-foreground">{item.label}</span>
               )}
             </span>
           ))}
         </nav>
       )}
       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
         <div>
           <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{title}</h1>
           {description && (
             <p className="mt-1 text-muted-foreground">{description}</p>
           )}
         </div>
         {actions && <div className="flex items-center gap-2">{actions}</div>}
       </div>
     </div>
   );
 };
 
 export default PageHeader;
 import { useQuery } from '@tanstack/react-query';
 import { Link } from 'react-router-dom';
 import { customerApi } from '@/api/customer.api';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent } from '@/components/ui/card';
 import { ServiceCardSkeleton } from '@/components/LoadingSkeleton';
 import { Map, Building2, Ticket, Sparkles, Star, MapPin, ArrowRight } from 'lucide-react';
 import { formatCurrency } from '@/utils/format';
 
 const iconMap: Record<string, React.ReactNode> = {
   Map: <Map className="h-6 w-6" />,
   Building2: <Building2 className="h-6 w-6" />,
   Ticket: <Ticket className="h-6 w-6" />,
   Sparkles: <Sparkles className="h-6 w-6" />,
 };
 
 export const Home = () => {
   const { data, isLoading } = useQuery({
     queryKey: ['home'],
     queryFn: () => customerApi.getHome(),
   });
 
   return (
     <div className="page-enter">
       {/* Hero Section */}
       <section className="relative h-[500px] flex items-center justify-center gradient-hero text-primary-foreground overflow-hidden">
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1528127269322-539801943592?w=1920')] bg-cover bg-center opacity-30" />
         <div className="relative z-10 text-center px-4 max-w-3xl">
           <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4">
             Khám phá Việt Nam
           </h1>
           <p className="text-lg md:text-xl opacity-90 mb-8">
             Hành trình di sản văn hóa với những trải nghiệm tuyệt vời nhất
           </p>
           <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
               <Link to="/services">Khám phá ngay <ArrowRight className="ml-2 h-4 w-4" /></Link>
             </Button>
             <Button size="lg" variant="outline" asChild className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
               <Link to="/trip-planner">Lập kế hoạch</Link>
             </Button>
           </div>
         </div>
       </section>
 
       {/* Categories */}
       <section className="container py-12">
         <h2 className="text-2xl font-bold mb-6">Danh mục dịch vụ</h2>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {data?.categories.map((cat) => (
             <Link key={cat.id} to={`/services?type=${cat.id === '1' ? 'tour' : cat.id === '2' ? 'hotel' : cat.id === '3' ? 'ticket' : 'experience'}`}>
               <Card className="card-elevated text-center p-6 hover:border-primary/50">
                 <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto mb-3">
                   {iconMap[cat.icon]}
                 </div>
                 <h3 className="font-semibold">{cat.name}</h3>
                 <p className="text-sm text-muted-foreground">{cat.count} dịch vụ</p>
               </Card>
             </Link>
           ))}
         </div>
       </section>
 
       {/* Featured Services */}
       <section className="container py-12">
         <div className="flex items-center justify-between mb-6">
           <h2 className="text-2xl font-bold">Dịch vụ nổi bật</h2>
           <Button variant="ghost" asChild>
             <Link to="/services">Xem tất cả <ArrowRight className="ml-1 h-4 w-4" /></Link>
           </Button>
         </div>
         <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
           {isLoading ? (
             Array.from({ length: 4 }).map((_, i) => <ServiceCardSkeleton key={i} />)
           ) : (
             data?.featuredServices.slice(0, 4).map((service) => (
               <Link key={service.id} to={`/services/${service.id}`}>
                 <Card className="card-elevated overflow-hidden group">
                   <div className="relative h-48 overflow-hidden">
                     <img src={service.thumbnail} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                     {service.originalPrice && (
                       <span className="absolute top-3 left-3 bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded">
                         -{Math.round((1 - service.price / service.originalPrice) * 100)}%
                       </span>
                     )}
                   </div>
                   <CardContent className="p-4">
                     <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">{service.name}</h3>
                     <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                       <MapPin className="h-3 w-3" /> {service.city}
                     </div>
                     <div className="flex items-center justify-between mt-3">
                       <span className="font-bold text-primary">{formatCurrency(service.price)}</span>
                       <div className="flex items-center gap-1 text-sm">
                         <Star className="h-4 w-4 fill-warning text-warning" />
                         {service.rating}
                       </div>
                     </div>
                   </CardContent>
                 </Card>
               </Link>
             ))
           )}
         </div>
       </section>
 
       {/* Popular Destinations */}
       <section className="container py-12">
         <h2 className="text-2xl font-bold mb-6">Điểm đến phổ biến</h2>
         <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
           {data?.popularDestinations.slice(0, 6).map((dest) => (
             <Link key={dest.id} to={`/services?city=${encodeURIComponent(dest.name)}`}>
               <div className="relative h-48 rounded-xl overflow-hidden group">
                 <img src={dest.image} alt={dest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                 <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" />
                 <div className="absolute bottom-4 left-4 text-primary-foreground">
                   <h3 className="font-bold text-lg">{dest.name}</h3>
                   <p className="text-sm opacity-90">{dest.serviceCount} dịch vụ</p>
                 </div>
               </div>
             </Link>
           ))}
         </div>
       </section>
     </div>
   );
 };
 
 export default Home;
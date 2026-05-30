import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ProductCard from "../components/ProductCard";
import { MapPin, Store, ArrowLeft } from "lucide-react";

const FARMER_IMG = "https://media.base44.com/images/public/6a1adc60daf80c817c60553f/c3dfda7a9_generated_image.png";

export default function ShopDetail() {
  const { id } = useParams();

  const { data: shop, isLoading: loadingShop } = useQuery({
    queryKey: ["shop", id],
    queryFn: () => base44.entities.Shop.get(id),
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["shopProducts", id],
    queryFn: () => base44.entities.Product.filter({ shop_id: id }),
    enabled: !!id,
  });

  if (loadingShop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Shop not found.</p>
        <Link to="/shops" className="text-primary mt-4 inline-block">Browse farms</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <div className="relative h-64 sm:h-80 overflow-hidden bg-muted">
        {shop.cover_image ? (
          <img src={shop.cover_image} alt={shop.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 max-w-7xl mx-auto">
          <div className="flex items-end gap-4">
            <div className="h-16 w-16 rounded-xl bg-card overflow-hidden border-2 border-white/20 flex-shrink-0">
              {shop.logo_image ? (
                <img src={shop.logo_image} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <Store className="h-7 w-7 text-primary" />
                </div>
              )}
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-white drop-shadow-lg">{shop.name}</h1>
              <div className="flex items-center gap-2 text-white/80 text-sm mt-1">
                <MapPin className="h-3.5 w-3.5" /> {shop.location} · by {shop.owner_name}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link to="/shops" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> All Farms
        </Link>

        {/* Story */}
        {shop.story && (
          <div className="mb-10 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="font-display text-2xl font-semibold mb-3">Our Story</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{shop.story}</p>
            </div>
            <div className="rounded-2xl overflow-hidden aspect-[4/3] bg-muted">
              <img src={FARMER_IMG} alt="Farm story" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        <p className="text-muted-foreground mb-6">{shop.description}</p>

        <h2 className="font-display text-2xl font-semibold mb-6">Products</h2>
        {loadingProducts ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3].map((i) => <div key={i} className="h-72 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : products.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">This farm hasn't listed any products yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
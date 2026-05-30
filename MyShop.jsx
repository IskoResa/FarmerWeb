import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Plus, Edit, Trash2, Store, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import ProductCard from "../components/ProductCard";

export default function MyShop() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [shopDialog, setShopDialog] = useState(false);
  const [editingShop, setEditingShop] = useState(null);

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const { data: shops = [], isLoading } = useQuery({
    queryKey: ["myShops", user?.email],
    queryFn: () => base44.entities.Shop.filter({ owner_email: user?.email }),
    enabled: !!user?.email,
  });

  const shop = shops[0];

  const { data: products = [] } = useQuery({
    queryKey: ["myProducts", shop?.id],
    queryFn: () => base44.entities.Product.filter({ shop_id: shop?.id }),
    enabled: !!shop?.id,
  });

  const [form, setForm] = useState({ name: "", description: "", story: "", location: "", cover_image: "", logo_image: "" });

  const saveShop = useMutation({
    mutationFn: (data) => editingShop ? base44.entities.Shop.update(editingShop.id, data) : base44.entities.Shop.create({ ...data, owner_email: user.email, owner_name: user.full_name || user.email, status: "active" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myShops"] });
      setShopDialog(false);
      setEditingShop(null);
      toast.success(editingShop ? "Shop updated!" : "Your shop is live!");
    },
  });

  const deleteProduct = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProducts"] });
      toast.success("Product removed.");
    },
  });

  const openEdit = () => {
    setEditingShop(shop);
    setForm({ name: shop.name, description: shop.description, story: shop.story || "", location: shop.location, cover_image: shop.cover_image || "", logo_image: shop.logo_image || "" });
    setShopDialog(true);
  };

  const openCreate = () => {
    setEditingShop(null);
    setForm({ name: "", description: "", story: "", location: "", cover_image: "", logo_image: "" });
    setShopDialog(true);
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm((f) => ({ ...f, [field]: file_url }));
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!shop) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <Store className="h-16 w-16 mx-auto text-muted-foreground/30" />
        <h2 className="font-display text-2xl font-semibold">Create Your Farm Shop</h2>
        <p className="text-muted-foreground">Set up your shop to start selling fresh produce.</p>
        <Button onClick={openCreate} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" /> Create Shop
        </Button>
        <ShopFormDialog open={shopDialog} onOpenChange={setShopDialog} form={form} setForm={setForm} onSave={() => saveShop.mutate(form)} saving={saveShop.isPending} onImageUpload={handleImageUpload} isEdit={false} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold">{shop.name}</h1>
          <p className="text-muted-foreground mt-1">{shop.location}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={openEdit} className="rounded-xl">
            <Edit className="mr-2 h-4 w-4" /> Edit Shop
          </Button>
          <Button onClick={() => navigate("/add-product")} className="rounded-xl">
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground">You haven't listed any products yet.</p>
          <Button onClick={() => navigate("/add-product")} variant="outline" className="rounded-xl">
            <Plus className="mr-2 h-4 w-4" /> Add Your First Product
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((p) => (
            <div key={p.id} className="relative group">
              <ProductCard product={p} />
              <div className="absolute top-3 left-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-lg shadow" onClick={(e) => { e.preventDefault(); navigate(`/edit-product/${p.id}`); }}>
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="destructive" className="h-8 w-8 rounded-lg shadow" onClick={(e) => e.preventDefault()}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove product?</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently delete "{p.name}" from your shop.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteProduct.mutate(p.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      <ShopFormDialog open={shopDialog} onOpenChange={setShopDialog} form={form} setForm={setForm} onSave={() => saveShop.mutate(form)} saving={saveShop.isPending} onImageUpload={handleImageUpload} isEdit={!!editingShop} />
    </div>
  );
}

function ShopFormDialog({ open, onOpenChange, form, setForm, onSave, saving, onImageUpload, isEdit }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Your Shop" : "Create Your Farm Shop"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Shop Name *</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 rounded-xl" />
          </div>
          <div>
            <label className="text-sm font-medium">Location *</label>
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mt-1 rounded-xl" />
          </div>
          <div>
            <label className="text-sm font-medium">Description *</label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 rounded-xl" rows={2} />
          </div>
          <div>
            <label className="text-sm font-medium">Your Farm Story</label>
            <Textarea value={form.story} onChange={(e) => setForm({ ...form, story: e.target.value })} className="mt-1 rounded-xl" rows={3} placeholder="Share your farming journey..." />
          </div>
          <div>
            <label className="text-sm font-medium">Cover Image</label>
            <input type="file" accept="image/*" onChange={(e) => onImageUpload(e, "cover_image")} className="mt-1 block text-sm" />
            {form.cover_image && <img src={form.cover_image} className="mt-2 h-24 rounded-xl object-cover" alt="" />}
          </div>
          <div>
            <label className="text-sm font-medium">Logo</label>
            <input type="file" accept="image/*" onChange={(e) => onImageUpload(e, "logo_image")} className="mt-1 block text-sm" />
            {form.logo_image && <img src={form.logo_image} className="mt-2 h-16 w-16 rounded-xl object-cover" alt="" />}
          </div>
          <Button className="w-full rounded-xl" onClick={onSave} disabled={saving || !form.name || !form.description || !form.location}>
            {saving ? "Saving..." : isEdit ? "Update Shop" : "Create Shop"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
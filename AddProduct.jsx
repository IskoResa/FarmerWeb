import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const categories = ["Vegetables", "Fruits", "Dairy", "Grains", "Herbs", "Honey & Preserves", "Eggs", "Meat", "Baked Goods", "Other"];

export default function AddProduct() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id: editId } = useParams();
  const isEdit = !!editId;

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const { data: shops = [] } = useQuery({
    queryKey: ["myShops", user?.email],
    queryFn: () => base44.entities.Shop.filter({ owner_email: user?.email }),
    enabled: !!user?.email,
  });
  const shop = shops[0];

  const { data: existing } = useQuery({
    queryKey: ["product", editId],
    queryFn: () => base44.entities.Product.get(editId),
    enabled: !!editId,
  });

  const [form, setForm] = useState({
    name: "", description: "", category: "Vegetables", price_per_kg: "",
    available_kg: "", availability_date: "", estimated_delivery: "",
    location: "", image: "", image2: "",
  });

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name || "", description: existing.description || "",
        category: existing.category || "Vegetables", price_per_kg: existing.price_per_kg || "",
        available_kg: existing.available_kg || "", availability_date: existing.availability_date || "",
        estimated_delivery: existing.estimated_delivery || "", location: existing.location || "",
        image: existing.image || "", image2: existing.image2 || "",
      });
    }
  }, [existing]);

  const save = useMutation({
    mutationFn: (data) => isEdit
      ? base44.entities.Product.update(editId, data)
      : base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProducts"] });
      toast.success(isEdit ? "Product updated!" : "Product listed!");
      navigate("/my-shop");
    },
  });

  const handleImageUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm((f) => ({ ...f, [field]: file_url }));
  };

  const handleSubmit = () => {
    if (!form.name || !form.description || !form.price_per_kg || !form.available_kg || !form.location) {
      toast.error("Please fill in all required fields.");
      return;
    }
    const data = {
      ...form,
      price_per_kg: Number(form.price_per_kg),
      available_kg: Number(form.available_kg),
      shop_id: shop?.id,
      shop_name: shop?.name,
      farmer_email: user?.email,
      status: "available",
    };
    save.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="font-display text-3xl font-bold mb-8">{isEdit ? "Edit Product" : "List a New Product"}</h1>

      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium">Product Name *</label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 rounded-xl" placeholder="e.g. Organic Roma Tomatoes" />
        </div>

        <div>
          <label className="text-sm font-medium">Category *</label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Description *</label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 rounded-xl" rows={3} placeholder="Describe your product..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Price per Kg ($) *</label>
            <Input type="number" min="0" step="0.01" value={form.price_per_kg} onChange={(e) => setForm({ ...form, price_per_kg: e.target.value })} className="mt-1 rounded-xl" />
          </div>
          <div>
            <label className="text-sm font-medium">Available Quantity (Kg) *</label>
            <Input type="number" min="0" value={form.available_kg} onChange={(e) => setForm({ ...form, available_kg: e.target.value })} className="mt-1 rounded-xl" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Location *</label>
          <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mt-1 rounded-xl" placeholder="e.g. Sacramento Valley, CA" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Available From</label>
            <Input type="date" value={form.availability_date} onChange={(e) => setForm({ ...form, availability_date: e.target.value })} className="mt-1 rounded-xl" />
          </div>
          <div>
            <label className="text-sm font-medium">Estimated Delivery</label>
            <Input value={form.estimated_delivery} onChange={(e) => setForm({ ...form, estimated_delivery: e.target.value })} className="mt-1 rounded-xl" placeholder="e.g. 2-3 days" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Product Photo</label>
          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "image")} className="mt-1 block text-sm" />
          {form.image && <img src={form.image} className="mt-2 h-32 rounded-xl object-cover" alt="" />}
        </div>

        <div>
          <label className="text-sm font-medium">Additional Photo</label>
          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "image2")} className="mt-1 block text-sm" />
          {form.image2 && <img src={form.image2} className="mt-2 h-32 rounded-xl object-cover" alt="" />}
        </div>

        <Button className="w-full rounded-xl h-12 text-base" onClick={handleSubmit} disabled={save.isPending}>
          {save.isPending ? "Saving..." : isEdit ? "Update Product" : "List Product"}
        </Button>
      </div>
    </div>
  );
}
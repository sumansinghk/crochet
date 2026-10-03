"use client";

import { useEffect, useState } from 'react';
import { Check, Edit2, Plus, Trash2, X } from 'lucide-react';

type ColorDetails = { name: string; hex: string; stock: number; price: number; sku?: string; available?: boolean };

export default function AdminProductsPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [removingCategoryId, setRemovingCategoryId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryNameDraft, setCategoryNameDraft] = useState('');
  const [updatingCategoryId, setUpdatingCategoryId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    categoryName: '',
    salePercent: '',
    imageUrl: '',
    description: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [colorDetails, setColorDetails] = useState<ColorDetails[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    categoryName: '',
    salePercent: '',
    imageUrl: '',
    description: '',
  });
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editImagePreviews, setEditImagePreviews] = useState<string[]>([]);
  const [uploadingEditImages, setUploadingEditImages] = useState(false);
  const [editColorDetails, setEditColorDetails] = useState<ColorDetails[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

  async function loadCategories() {
    const res = await fetch('/api/categories');
    const json = await res.json();
    setCategories(json?.data?.items || []);
  }

  async function addCategory() {
    const name = newCategoryName.trim();
    if (!name) return;

    setAddingCategory(true);
    setError('');
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || `Failed to add category (${response.status})`);
      }

      await loadCategories();
      if (editingProduct) {
        setEditForm((current) => ({ ...current, categoryName: result.data.item.name }));
      } else {
        setForm((current) => ({ ...current, categoryName: result.data.item.name }));
      }
      setNewCategoryName('');
    } catch (error: any) {
      setError(error.message || 'Unable to add category.');
    } finally {
      setAddingCategory(false);
    }
  }

  async function removeCategory(category: any) {
    if (!window.confirm(`Remove the category "${category.name}"? Categories used by products cannot be removed.`)) return;

    setRemovingCategoryId(category.id);
    setError('');
    try {
      const response = await fetch('/api/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: category.id }),
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || `Failed to remove category (${response.status})`);
      }

      setCategories((current) => current.filter((item) => item.id !== category.id));
      setForm((current) => current.categoryName === category.name ? { ...current, categoryName: '' } : current);
      setEditForm((current) => current.categoryName === category.name ? { ...current, categoryName: '' } : current);
      setSelectedCategory((current) => current === category.name ? 'all' : current);
    } catch (error: any) {
      setError(error.message || 'Unable to remove category.');
    } finally {
      setRemovingCategoryId(null);
    }
  }

  async function updateCategory(category: any) {
    const name = categoryNameDraft.trim();
    if (!name) {
      setError('Category name is required.');
      return;
    }

    setUpdatingCategoryId(category.id);
    setError('');
    try {
      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: category.id, name }),
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || `Failed to update category (${response.status})`);
      }

      setCategories((current) => current.map((item) => item.id === category.id ? result.data.item : item));
      setForm((current) => current.categoryName === category.name ? { ...current, categoryName: name } : current);
      setEditForm((current) => current.categoryName === category.name ? { ...current, categoryName: name } : current);
      setSelectedCategory((current) => current === category.name ? name : current);
      setEditingCategoryId(null);
      setCategoryNameDraft('');
      await loadProducts();
    } catch (error: any) {
      setError(error.message || 'Unable to update category.');
    } finally {
      setUpdatingCategoryId(null);
    }
  }

  function renderCategoryManager() {
    return (
      <details className="mt-2 rounded border border-zinc-200 px-3 py-2">
        <summary className="cursor-pointer text-xs font-medium text-zinc-600">Manage categories</summary>
        <div className="mt-2 flex flex-col gap-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-2">
              {editingCategoryId === category.id ? (
                <>
                  <input
                    autoFocus
                    value={categoryNameDraft}
                    onChange={(event) => setCategoryNameDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        void updateCategory(category);
                      }
                      if (event.key === 'Escape') {
                        setEditingCategoryId(null);
                        setCategoryNameDraft('');
                      }
                    }}
                    aria-label={`Edit ${category.name} category name`}
                    className="min-w-0 flex-1 rounded border px-2 py-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => updateCategory(category)}
                    disabled={updatingCategoryId === category.id || !categoryNameDraft.trim()}
                    aria-label={`Save ${category.name} category`}
                    title="Save category"
                    className="rounded p-1 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategoryId(null);
                      setCategoryNameDraft('');
                    }}
                    disabled={updatingCategoryId === category.id}
                    aria-label="Cancel category edit"
                    title="Cancel"
                    className="rounded p-1 text-zinc-500 hover:bg-zinc-100"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <span className="min-w-0 flex-1 truncate text-xs text-zinc-700">{category.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategoryId(category.id);
                      setCategoryNameDraft(category.name);
                      setError('');
                    }}
                    aria-label={`Edit ${category.name} category`}
                    title={`Edit ${category.name}`}
                    className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeCategory(category)}
                    disabled={removingCategoryId === category.id || updatingCategoryId === category.id}
                    aria-label={`Remove ${category.name} category`}
                    title={`Remove ${category.name}`}
                    className="rounded p-1 text-zinc-500 hover:bg-red-50 hover:text-red-700 disabled:cursor-wait disabled:opacity-50"
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </details>
    );
  }

  async function loadProducts() {
    const res = await fetch('/api/products?limit=50&includeInactive=true');
    const json = await res.json();
    console.log('Loaded products:====', json?.data?.items);
    setProducts(json?.data?.items || []);
  }

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  const visibleProducts = selectedCategory === 'all'
    ? products
    : products.filter((product) => (product.category?.name || product.categoryName || 'General').toLowerCase() === selectedCategory.toLowerCase());

  async function removeProduct(product: any) {
    const productName = product.name || product.title || 'this product';
    const isDraft = !product.isActive && Number(product.price ?? 0) <= 0;
    const confirmation = product.isActive
      ? `Archive ${productName} from the storefront? Existing orders will be kept.`
      : `Permanently delete the ${isDraft ? 'draft' : 'archived product'} ${productName}? This cannot be undone.`;
    if (!window.confirm(confirmation)) return;

    setDeletingProductId(product.id);
    setDeleteError('');
    try {
      const response = await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || `Failed to remove product (${response.status})`);
      }
      setProducts((current) => current.filter((item) => item.id !== product.id));
    } catch (error: any) {
      setDeleteError(error.message || 'Unable to remove product.');
    } finally {
      setDeletingProductId(null);
    }
  }

  function clearUploadedImage(index?: number) {
    if (index !== undefined) {
      setImages((prev) => prev.filter((_, i) => i !== index));
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));
      setColorDetails((prev) => prev.filter((_, i) => i !== index));
    } else {
      setImages([]);
      setImagePreviews([]);
      setColorDetails([]);
      setForm((prev) => ({ ...prev, imageUrl: '' }));
    }
  }

  async function uploadProductImage(file: File) {
    const formData = new FormData();
    formData.set('file', file);
    const response = await fetch('/api/uploads/products', { method: 'POST', body: formData });
    const result = await response.json();
    if (!response.ok || !result?.success || typeof result.data?.url !== 'string') {
      throw new Error(result?.message || `Image upload failed (${response.status}).`);
    }
    return result.data.url as string;
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    if (files.length === 0) return;
    event.currentTarget.value = '';

    setUploadingImages(true);
    try {
      for (const file of files) {
        const image = await uploadProductImage(file);
        setImages((prev) => [...prev, image]);
        setImagePreviews((prev) => [...prev, image]);
        setColorDetails((prev) => [...prev, { name: `Color ${prev.length + 1}`, hex: '#F7C6D0', stock: 0, price: 0, available: true }]);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to upload image files.');
    } finally {
      setUploadingImages(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const colors = images.map((image, index) => ({
        ...colorDetails[index],
        image,
        price: Number(colorDetails[index]?.price ?? 0),
        stock: Number(colorDetails[index]?.stock ?? 0),
      }));
      const sellableColors = colors.filter((color) => color.available !== false);
      const allColorsPriced = sellableColors.length > 0 && sellableColors.every((color) => color.price > 0);
      const payload = {
        title: form.title,
        categoryName: form.categoryName,
        price: allColorsPriced ? Math.min(...sellableColors.map((color) => color.price)) : 0,
        salePercent: form.salePercent,
        stock: colors.reduce((total, color) => total + color.stock, 0),
        imageUrl: images.length > 0 ? images[0] : form.imageUrl,
        images: images.length > 0 ? images : (form.imageUrl ? [form.imageUrl] : []),
        colors,
        description: form.description,
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const rawText = await res.text();
      let json: any = {};

      if (rawText) {
        try {
          json = JSON.parse(rawText);
        } catch (error) {
          console.error('Invalid product API response:', rawText.slice(0, 500));
          throw new Error('The server returned an invalid response.');
        }
      }

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || `Failed to create product (${res.status})`);
      }

      setForm({ title: '', categoryName: '', salePercent: '', imageUrl: '', description: '' });
      setImages([]);
      setImagePreviews([]);
      setColorDetails([]);
      await loadCategories();
      await loadProducts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  function openEditModal(product: any) {
    setEditingProduct(product);
    setEditForm({
      title: product.name || product.title,
      categoryName: product.category?.name || product.categoryName,
      salePercent: product.salePercent != null ? String(product.salePercent) : '',
      imageUrl: product.image || '',
      description: product.description || '',
    });
    const existingImages = product.images || (product.image ? [product.image] : []);
    setEditImages(existingImages);
    setEditImagePreviews(existingImages);
    setEditColorDetails(existingImages.map((image: string, index: number) => {
      const color = (product.colors || []).find((variant: { image?: string }) => variant.image === image) || product.colors?.[index];
      return {
        name: color?.name && color.name !== 'Default' ? color.name : existingImages.length === 1 ? color?.name || 'Default' : `Color ${index + 1}`,
        hex: color?.hex || '#F7C6D0',
        price: Number(color?.originalPrice ?? color?.price ?? product.originalPrice ?? product.price ?? 0),
        stock: Number(color?.stock ?? product.stockQuantity ?? 0),
        sku: color?.sku,
        available: color?.available !== false,
      };
    }));
  }

  function closeEditModal() {
    setEditingProduct(null);
    setEditForm({ title: '', categoryName: '', salePercent: '', imageUrl: '', description: '' });
    setEditImages([]);
    setEditImagePreviews([]);
    setEditColorDetails([]);
  }

  async function handleEditImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    if (files.length === 0) return;
    event.currentTarget.value = '';

    setUploadingEditImages(true);
    try {
      for (const file of files) {
        const image = await uploadProductImage(file);
        setEditImages((prev) => [...prev, image]);
        setEditImagePreviews((prev) => [...prev, image]);
        setEditColorDetails((prev) => [...prev, { name: `Color ${prev.length + 1}`, hex: '#F7C6D0', stock: 0, price: 0, available: true }]);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to upload image files.');
    } finally {
      setUploadingEditImages(false);
    }
  }

  async function handleEditImageReplace(index: number, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    setUploadingEditImages(true);
    try {
      const imageUrl = await uploadProductImage(file);
      setEditImages((prev) => prev.map((image, imageIndex) => imageIndex === index ? imageUrl : image));
      setEditImagePreviews((prev) => prev.map((image, imageIndex) => imageIndex === index ? imageUrl : image));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to upload image file.');
    } finally {
      setUploadingEditImages(false);
    }
  }

  function clearEditUploadedImage(index?: number) {
    if (index !== undefined) {
      setEditImages((prev) => prev.filter((_, i) => i !== index));
      setEditImagePreviews((prev) => prev.filter((_, i) => i !== index));
      setEditColorDetails((prev) => prev.filter((_, i) => i !== index));
    } else {
      setEditImages([]);
      setEditImagePreviews([]);
      setEditColorDetails([]);
      setEditForm((prev) => ({ ...prev, imageUrl: '' }));
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProduct) return;

    setEditSaving(true);
    setError('');

    try {
      const colors = editImages.map((image, index) => ({
        ...editColorDetails[index],
        image,
        price: Number(editColorDetails[index]?.price ?? 0),
        stock: Number(editColorDetails[index]?.stock ?? 0),
      }));
      const sellableColors = colors.filter((color) => color.available !== false);
      const allColorsPriced = sellableColors.length > 0 && sellableColors.every((color) => color.price > 0);
      const payload = {
        title: editForm.title,
        categoryName: editForm.categoryName,
        price: allColorsPriced ? Math.min(...sellableColors.map((color) => color.price)) : Number(editingProduct.price ?? 0),
        salePercent: editForm.salePercent,
        stock: colors.reduce((total, color) => total + color.stock, 0),
        imageUrl: editImages.length > 0 ? editImages[0] : editForm.imageUrl,
        images: editImages.length > 0 ? editImages : (editForm.imageUrl ? [editForm.imageUrl] : []),
        colors,
        description: editForm.description,
      };

      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const rawText = await res.text();
      let json: any = {};

      if (rawText) {
        try {
          json = JSON.parse(rawText);
        } catch (error) {
          console.error('Invalid product API response:', rawText.slice(0, 500));
          throw new Error('The server returned an invalid response.');
        }
      }

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || `Failed to update product (${res.status})`);
      }

      closeEditModal();
      await loadProducts();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setEditSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Products</h1>
        <p className="text-sm text-gray-600">Create products and they will appear on the storefront automatically.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
        {error ? <div className="bg-red-50 border border-red-200 text-red-700 rounded px-3 py-2 text-sm">{error}</div> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Product name</label>
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="w-full rounded border px-3 py-2" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select value={form.categoryName} onChange={(event) => setForm({ ...form, categoryName: event.target.value })} className="w-full rounded border px-3 py-2" required>
              <option value="" disabled>Select a category</option>
              {categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
            </select>
            <div className="mt-2 flex gap-2">
              <input value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} placeholder="Add a category" className="min-w-0 flex-1 rounded border px-3 py-2 text-sm" />
              <button type="button" onClick={addCategory} disabled={addingCategory || !newCategoryName.trim()} className="inline-flex items-center gap-1 rounded bg-zinc-900 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50">
                <Plus size={15} /> Add
              </button>
            </div>
            {!editingProduct ? renderCategoryManager() : null}
          </div>
        </div>

        <div className="max-w-sm">
          <label className="mb-1 block text-sm font-medium">Sale discount (optional)</label>
          <div className="flex items-center gap-2">
            <input type="number" min="1" max="100" step="1" value={form.salePercent} onChange={(event) => setForm({ ...form, salePercent: event.target.value })} className="w-full rounded border px-3 py-2" placeholder="e.g. 20" />
            <span className="text-sm text-zinc-600">%</span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">The discount is calculated from each variant’s regular price.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Product images</label>
          <div className="rounded border border-dashed border-pink-200 bg-pink-50 p-4">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImageUpload}
              disabled={uploadingImages}
              className="block w-full text-sm text-gray-600 file:mr-4 file:rounded file:border-0 file:bg-pink-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-pink-700"
            />
          </div>
          {imagePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative flex items-center gap-3 rounded border border-zinc-200 p-2 pr-12">
                  <img src={preview} alt={`Color ${index + 1} product preview`} className="h-20 w-20 shrink-0 rounded object-cover border border-pink-200" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <label className="block text-xs font-medium text-zinc-600">Color name
                      <input value={colorDetails[index]?.name || ''} onChange={(event) => setColorDetails((prev) => prev.map((color, colorIndex) => colorIndex === index ? { ...color, name: event.target.value } : color))} className="mt-1 w-full rounded border border-zinc-200 px-2 py-1.5 text-sm" required />
                    </label>
                    <label className="block text-xs font-medium text-zinc-600">Starting inventory
                      <input type="number" min="0" step="1" value={colorDetails[index]?.stock ?? 0} onChange={(event) => setColorDetails((prev) => prev.map((color, colorIndex) => colorIndex === index ? { ...color, stock: Number(event.target.value) } : color))} className="mt-1 w-full rounded border border-zinc-200 px-2 py-1.5 text-sm" aria-label={`Starting inventory for ${colorDetails[index]?.name || `color ${index + 1}`}`} />
                    </label>
                    <label className="block text-xs font-medium text-zinc-600">Price
                      <input type="number" min="0" step="1" value={colorDetails[index]?.price ?? 0} onChange={(event) => setColorDetails((prev) => prev.map((color, colorIndex) => colorIndex === index ? { ...color, price: Number(event.target.value) } : color))} className="mt-1 w-full rounded border border-zinc-200 px-2 py-1.5 text-sm" aria-label={`Price for ${colorDetails[index]?.name || `color ${index + 1}`}`} />
                    </label>
                    {Number.isInteger(Number(form.salePercent)) && Number(form.salePercent) >= 1 && Number(form.salePercent) <= 100 && colorDetails[index]?.price > 0 ? (
                      <p className="text-xs text-emerald-700">
                        Sale price: ₹{Math.round(colorDetails[index].price * (100 - Number(form.salePercent)) / 100)}
                        <span className="ml-1 text-zinc-500 line-through">₹{colorDetails[index].price}</span>
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => clearUploadedImage(index)}
                    aria-label={`Remove ${colorDetails[index]?.name || `color ${index + 1}`} image`}
                    title="Remove image"
                    className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-sm transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="mt-1 text-xs text-gray-500">Upload JPEG, PNG, or WebP images up to 8 MB each. The first image will be the primary product image.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded px-3 py-2" rows={4} placeholder="Describe the product" />
        </div>

        <button type="submit"         disabled={saving || uploadingImages} className="bg-pink-200 text-white px-4 py-2 rounded disabled:opacity-60">
          {uploadingImages ? 'Uploading images...' : saving ? 'Saving...' : 'Add product'}
        </button>
      </form>

      <div className="bg-white p-6 rounded shadow">
        {deleteError ? <div role="alert" className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{deleteError}</div> : null}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Current products</h2>
            <p className="mt-1 text-sm text-zinc-500">{products.length} products</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${selectedCategory === 'all' ? 'bg-pink-500 text-white' : 'bg-pink-50 text-pink-700'}`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.name)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${selectedCategory === category.name ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700'}`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {visibleProducts.length === 0 ? (
          <div className="rounded border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-500">
            No products match this filter yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleProducts.map((product) => {
              const categoryName = product.category?.name || product.categoryName || 'General';
              const image = product.image || '/assets/images/1.png';
              return (
                <div key={product.id} className="overflow-hidden rounded-[1.5rem] border border-rose-100 bg-[#FFF8F2] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="relative h-52 overflow-hidden bg-white">
                    <img
                      src={image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-700">
                      {categoryName}
                    </span>
                  </div>

                  <div className="space-y-4 p-4">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="line-clamp-2 text-lg font-semibold text-zinc-900">{product.name}</h3>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${product.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                          {product.isActive ? 'Published' : Number(product.price ?? 0) <= 0 ? 'Draft' : 'Archived'}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-zinc-600">{product.description || 'Handmade crochet piece.'}</p>
                      {product.salePercent ? (
                        <p className="mt-2 flex items-center gap-2 text-sm">
                          <span className="font-semibold text-emerald-700">{product.salePercent}% off</span>
                          <span className="font-semibold text-zinc-900">₹{Number(product.price).toLocaleString('en-IN')}</span>
                          <span className="text-zinc-500 line-through">₹{Number(product.originalPrice).toLocaleString('en-IN')}</span>
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Inventory managed separately</span>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => openEditModal(product)} aria-label={`Edit ${product.name}`} title="Edit product" className="rounded-full bg-zinc-900 p-2 text-white transition hover:bg-zinc-800">
                          <Edit2 size={18} />
                        </button>
                        <button type="button" onClick={() => removeProduct(product)} disabled={deletingProductId === product.id} aria-label={`${product.isActive ? 'Archive' : 'Delete'} ${product.name}`} title={product.isActive ? 'Archive product' : Number(product.price ?? 0) <= 0 ? 'Delete draft' : 'Delete archived product'} className="rounded-full border border-red-200 p-2 text-red-700 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-50">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl max-h-96 overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Edit Product</h2>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-full p-1 hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded px-3 py-2 text-sm">
                  {error}
                </div>
              ) : null}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Product name</label>
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={editForm.categoryName}
                    onChange={(e) => setEditForm({ ...editForm, categoryName: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    required
                  >
                    <option value="" disabled>Select a category</option>
                    {editForm.categoryName && !categories.some((category) => category.name === editForm.categoryName) ? (
                      <option value={editForm.categoryName}>{editForm.categoryName}</option>
                    ) : null}
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>{category.name}</option>
                    ))}
                  </select>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={newCategoryName}
                      onChange={(event) => setNewCategoryName(event.target.value)}
                      placeholder="Add a category"
                      className="min-w-0 flex-1 rounded border px-3 py-2 text-sm"
                    />
                    <button type="button" onClick={addCategory} disabled={addingCategory || !newCategoryName.trim()} className="inline-flex items-center gap-1 rounded bg-zinc-900 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50">
                      <Plus size={15} /> Add
                    </button>
                  </div>
                  {renderCategoryManager()}
                </div>
              </div>

              <div className="max-w-sm">
                <label className="mb-1 block text-sm font-medium">Sale discount (optional)</label>
                <div className="flex items-center gap-2">
                  <input type="number" min="1" max="100" step="1" value={editForm.salePercent} onChange={(event) => setEditForm({ ...editForm, salePercent: event.target.value })} className="w-full rounded border px-3 py-2" placeholder="e.g. 20" />
                  <span className="text-sm text-zinc-600">%</span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">The discount is calculated from each variant’s regular price.</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  placeholder="Describe the product"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Product images</label>
                <div className="rounded border border-dashed border-pink-200 bg-pink-50 p-4">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleEditImageUpload}
                    disabled={uploadingEditImages}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:rounded file:border-0 file:bg-pink-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-pink-700"
                  />
                </div>
                {editImagePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {editImagePreviews.map((preview, index) => (
                      <div key={index} className="relative flex items-center gap-3 rounded border border-zinc-200 p-2 pr-12">
                        <img src={preview} alt={`Color ${index + 1} product preview`} className="h-20 w-20 shrink-0 rounded object-cover border border-pink-200" />
                        <div className="min-w-0 flex-1 space-y-2">
                          <label className="block text-xs font-medium text-zinc-600">Color name
                            <input value={editColorDetails[index]?.name || ''} onChange={(event) => setEditColorDetails((prev) => prev.map((color, colorIndex) => colorIndex === index ? { ...color, name: event.target.value } : color))} className="mt-1 w-full rounded border border-zinc-200 px-2 py-1.5 text-sm" required />
                          </label>
                          <label className="block text-xs font-medium text-zinc-600">Inventory quantity
                            <input type="number" min="0" step="1" value={editColorDetails[index]?.stock ?? 0} onChange={(event) => setEditColorDetails((prev) => prev.map((color, colorIndex) => colorIndex === index ? { ...color, stock: Number(event.target.value) } : color))} className="mt-1 w-full rounded border border-zinc-200 px-2 py-1.5 text-sm" aria-label={`Inventory quantity for ${editColorDetails[index]?.name || `color ${index + 1}`}`} />
                          </label>
                          <label className="block text-xs font-medium text-zinc-600">Price
                            <input type="number" min="0" step="1" value={editColorDetails[index]?.price ?? 0} onChange={(event) => setEditColorDetails((prev) => prev.map((color, colorIndex) => colorIndex === index ? { ...color, price: Number(event.target.value) } : color))} className="mt-1 w-full rounded border border-zinc-200 px-2 py-1.5 text-sm" aria-label={`Price for ${editColorDetails[index]?.name || `color ${index + 1}`}`} />
                          </label>
                          {Number.isInteger(Number(editForm.salePercent)) && Number(editForm.salePercent) >= 1 && Number(editForm.salePercent) <= 100 && editColorDetails[index]?.price > 0 ? (
                            <p className="text-xs text-emerald-700">
                              Sale price: ₹{Math.round(editColorDetails[index].price * (100 - Number(editForm.salePercent)) / 100)}
                              <span className="ml-1 text-zinc-500 line-through">₹{editColorDetails[index].price}</span>
                            </p>
                          ) : null}
                          <label className="block text-xs font-medium text-zinc-600">Replace image
                            <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploadingEditImages} onChange={(event) => handleEditImageReplace(index, event)} className="mt-1 block w-full text-xs text-zinc-600 file:mr-2 file:rounded file:border-0 file:bg-pink-100 file:px-2 file:py-1 file:font-medium file:text-pink-700" aria-label={`Replace image for ${editColorDetails[index]?.name || `color ${index + 1}`}`} />
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => clearEditUploadedImage(index)}
                          aria-label={`Remove ${editColorDetails[index]?.name || `color ${index + 1}`} image`}
                          title="Remove image"
                          className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-sm transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-xs text-gray-500">Upload JPEG, PNG, or WebP images up to 8 MB each. The first image will be the primary product image.</p>
                {error ? <p role="alert" className="mt-2 text-sm text-red-700">{error}</p> : null}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={editSaving || uploadingEditImages}
                  className="bg-pink-500 text-white px-4 py-2 rounded disabled:opacity-60"
                >
                  {uploadingEditImages ? 'Uploading images...' : editSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

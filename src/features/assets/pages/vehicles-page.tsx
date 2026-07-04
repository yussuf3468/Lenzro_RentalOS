import { useState } from 'react';
import { AlertTriangle, Car, Plus, Search, Tags } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/empty-state';
import { Stagger, StaggerItem } from '@/components/motion-primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth';
import { SimpleSelect } from '@/components/form/form-select';
import { toMessage } from '@/lib/errors';
import { AssetFormDialog } from '../components/asset-form';
import { AssetCard } from '../components/asset-card';
import { CategoryDialog } from '../components/category-dialog';
import { useAssets, useCategories } from '../hooks/use-assets';
import { ASSET_STATUSES, statusMeta } from '../lib/asset-meta';
import { type Asset } from '../schemas/asset.schema';

export function VehiclesPage() {
  const { claims } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const categories = useCategories();
  const assets = useAssets({
    status: status || undefined,
    categoryId: categoryId || undefined,
  });

  const hasFilters = Boolean(search || status || categoryId);
  const query = search.trim().toLowerCase();
  const visible = (assets.data ?? []).filter(
    (asset) =>
      !query ||
      asset.name.toLowerCase().includes(query) ||
      (asset.identifier ?? '').toLowerCase().includes(query),
  );

  const categoryName = (id: string | null) =>
    id ? categories.data?.find((category) => category.id === id)?.name : undefined;

  const openCreate = () => setFormOpen(true);
  // Cards open the vehicle's profile (its digital twin) — editing lives there.
  const openProfile = (asset: Asset) => navigate(`/app/vehicles/${asset.id}`);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fleet</h1>
          <p className="text-muted-foreground">
            Your vehicles{assets.data ? ` — ${assets.data.length}` : ''}. Every one is a row on the
            calendar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCategoriesOpen(true)}>
            <Tags /> Categories
          </Button>
          <Button onClick={openCreate}>
            <Plus /> Add vehicle
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or plate…"
            className="pl-9"
          />
        </div>
        <SimpleSelect
          value={status}
          onChange={setStatus}
          ariaLabel="Filter by status"
          allLabel="All statuses"
          className="sm:w-44"
          options={ASSET_STATUSES.map((value) => ({ value, label: statusMeta(value).label }))}
        />
        <SimpleSelect
          value={categoryId}
          onChange={setCategoryId}
          ariaLabel="Filter by category"
          allLabel="All categories"
          className="sm:w-44"
          options={(categories.data ?? []).map((category) => ({
            value: category.id,
            label: category.name,
          }))}
        />
      </div>

      {/* Content */}
      {assets.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="aspect-[16/10] rounded-xl" />
          ))}
        </div>
      ) : assets.isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load vehicles"
          description={toMessage(assets.error)}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Car}
          title={hasFilters ? 'No vehicles match your filters' : 'No vehicles yet'}
          description={
            hasFilters
              ? 'Try clearing your search or filters.'
              : 'Add your first vehicle to start building your fleet.'
          }
          action={
            hasFilters ? undefined : (
              <Button onClick={openCreate}>
                <Plus /> Add vehicle
              </Button>
            )
          }
        />
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((asset) => (
            <StaggerItem key={asset.id}>
              <AssetCard
                asset={asset}
                categoryName={categoryName(asset.category_id)}
                onEdit={() => openProfile(asset)}
              />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <AssetFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        categories={categories.data ?? []}
        organizationId={claims.organizationId}
      />
      <CategoryDialog
        open={categoriesOpen}
        onOpenChange={setCategoriesOpen}
        categories={categories.data ?? []}
      />
    </div>
  );
}

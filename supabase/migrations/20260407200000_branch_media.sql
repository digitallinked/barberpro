-- Branch-level media: logo_url on branches + branch_images table for per-branch gallery.
-- Storage path convention:
--   Logo:    <tenant_id>/branches/<branch_id>/logo/<filename>
--   Gallery: <tenant_id>/branches/<branch_id>/images/<filename>

-- 1. Add logo_url to branches
ALTER TABLE public.branches
  ADD COLUMN IF NOT EXISTS logo_url text;

-- 2. Create branch_images table
CREATE TABLE IF NOT EXISTS public.branch_images (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id     uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  tenant_id     uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  storage_path  text NOT NULL,
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS branch_images_branch_id_idx ON public.branch_images(branch_id, sort_order);
CREATE INDEX IF NOT EXISTS branch_images_tenant_id_idx ON public.branch_images(tenant_id);

-- 3. RLS for branch_images
ALTER TABLE public.branch_images ENABLE ROW LEVEL SECURITY;

-- Staff can read images for their tenant's branches
CREATE POLICY "branch_images_select" ON public.branch_images
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM public.staff_profiles WHERE user_id = auth.uid()
    )
  );

-- Staff can insert images for their tenant's branches
CREATE POLICY "branch_images_insert" ON public.branch_images
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.staff_profiles WHERE user_id = auth.uid()
    )
  );

-- Staff can update sort order for their tenant's branch images
CREATE POLICY "branch_images_update" ON public.branch_images
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM public.staff_profiles WHERE user_id = auth.uid()
    )
  );

-- Staff can delete images for their tenant's branches
CREATE POLICY "branch_images_delete" ON public.branch_images
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id FROM public.staff_profiles WHERE user_id = auth.uid()
    )
  );

-- Public read so customers can see branch photos
CREATE POLICY "branch_images_public_select" ON public.branch_images
  FOR SELECT USING (true);

-- Migration: Add branch access checking function and helper for role-based queries.
-- This provides application-level helpers; RLS stays tenant-scoped, app layer enforces branch scope.

-- Returns the branch_id of the currently authenticated app_user (null for owners or unresolved)
create or replace function public.get_my_branch_id()
returns uuid
language sql
stable
security definer
as $$
  select branch_id
  from public.app_users
  where auth_user_id = auth.uid()
    and is_active = true
  limit 1;
$$;

-- Returns true if the current user can access data for the given branch.
-- Owners can access all branches in their tenant; others can only access their assigned branch.
create or replace function public.can_access_branch(p_branch_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.app_users
    where auth_user_id = auth.uid()
      and is_active = true
      and (
        role = 'owner'
        or branch_id = p_branch_id
      )
  );
$$;

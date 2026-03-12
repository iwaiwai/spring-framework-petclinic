import type { OwnerDto } from '@/types/owner'

const API_BASE = '/api'

/**
 * Search owners by last name prefix.
 * Ready for use when the frontend switches to full SPA mode.
 */
export async function searchOwners(lastName: string): Promise<OwnerDto[]> {
  const response = await fetch(
    `${API_BASE}/owners?lastName=${encodeURIComponent(lastName)}`)
  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`)
  }
  return response.json()
}

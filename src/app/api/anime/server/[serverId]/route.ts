import { NextRequest, NextResponse } from 'next/server';
import { fetchWajikServerStream } from '@/lib/anime/wajik';
import { normalizeServerStream } from '@/lib/anime/adapter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { serverId: string } }
) {
  try {
    const serverId = params.serverId;
    if (!serverId) {
      return NextResponse.json({ success: false, error: 'Server ID is required' }, { status: 400 });
    }

    const raw = await fetchWajikServerStream(serverId);
    const normalized = normalizeServerStream(raw, serverId);
    return NextResponse.json({ success: true, data: normalized });
  } catch (error) {
    console.error(`API Error /api/anime/server/${params.serverId}:`, error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil stream video dari server' },
      { status: 500 }
    );
  }
}

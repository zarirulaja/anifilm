import { NextRequest, NextResponse } from 'next/server';
import { fetchWajikCompleted } from '@/lib/anime/wajik';
import { normalizePaginatedList } from '@/lib/anime/adapter';

export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Number(searchParams.get('page') || '1');

    const raw = await fetchWajikCompleted(page);
    const normalized = normalizePaginatedList(raw);
    return NextResponse.json({ success: true, data: normalized });
  } catch (error) {
    console.error('API Error /api/anime/completed:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data completed anime' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    const history = await prisma.watchProgress.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    console.error('API Error GET /api/history:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil riwayat tontonan' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const clearAll = searchParams.get('all') === 'true';

    if (clearAll) {
      await prisma.watchProgress.deleteMany({});
      return NextResponse.json({ success: true, message: 'Riwayat berhasil dibersihkan' });
    }

    if (id) {
      await prisma.watchProgress.delete({ where: { id } });
      return NextResponse.json({ success: true, message: 'Item riwayat berhasil dihapus' });
    }

    return NextResponse.json(
      { success: false, error: 'Parameter id atau all=true diperlukan' },
      { status: 400 }
    );
  } catch (error) {
    console.error('API Error DELETE /api/history:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus riwayat tontonan' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const favorites = await prisma.favorite.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: favorites });
  } catch (error) {
    console.error('API Error GET /api/favorites:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil daftar favorit' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mediaType = 'anime', animeId, title, poster, status, rating } = body;

    if (!animeId || !title) {
      return NextResponse.json(
        { success: false, error: 'animeId and title are required' },
        { status: 400 }
      );
    }

    const favorite = await prisma.favorite.upsert({
      where: { animeId },
      update: {
        mediaType,
        title,
        poster: poster || '',
        status: status || null,
        rating: rating || null,
      },
      create: {
        mediaType,
        animeId,
        title,
        poster: poster || '',
        status: status || null,
        rating: rating || null,
      },
    });

    return NextResponse.json({ success: true, data: favorite });
  } catch (error) {
    console.error('API Error POST /api/favorites:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan ke favorit' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const animeId = searchParams.get('animeId');

    if (!animeId) {
      return NextResponse.json(
        { success: false, error: 'animeId parameter required' },
        { status: 400 }
      );
    }

    await prisma.favorite.delete({
      where: { animeId },
    });

    return NextResponse.json({ success: true, message: 'Dihapus dari favorit' });
  } catch (error) {
    console.error('API Error DELETE /api/favorites:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus dari favorit' },
      { status: 500 }
    );
  }
}

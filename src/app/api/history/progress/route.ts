import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const animeId = searchParams.get('animeId');
    const episodeId = searchParams.get('episodeId');

    if (!animeId) {
      return NextResponse.json(
        { success: false, error: 'animeId required' },
        { status: 400 }
      );
    }

    if (episodeId) {
      const item = await prisma.watchProgress.findUnique({
        where: {
          animeId_episodeId: { animeId, episodeId },
        },
      });
      return NextResponse.json({ success: true, data: item });
    }

    // Get latest watched episode for anime
    const item = await prisma.watchProgress.findFirst({
      where: { animeId },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('API Error GET /api/history/progress:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil progress tontonan' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      mediaType = 'anime',
      animeId,
      animeTitle,
      poster,
      episodeId,
      episodeTitle,
      progressSeconds,
      durationSeconds,
      completed,
    } = body;

    if (!animeId || !episodeId) {
      return NextResponse.json(
        { success: false, error: 'animeId and episodeId are required' },
        { status: 400 }
      );
    }

    const item = await prisma.watchProgress.upsert({
      where: {
        animeId_episodeId: {
          animeId,
          episodeId,
        },
      },
      update: {
        mediaType,
        animeTitle: animeTitle || 'Media',
        poster: poster || '',
        episodeTitle: episodeTitle || 'Episode',
        progressSeconds: Number(progressSeconds || 0),
        durationSeconds: Number(durationSeconds || 0),
        completed: Boolean(completed),
      },
      create: {
        mediaType,
        animeId,
        animeTitle: animeTitle || 'Media',
        poster: poster || '',
        episodeId,
        episodeTitle: episodeTitle || 'Episode',
        progressSeconds: Number(progressSeconds || 0),
        durationSeconds: Number(durationSeconds || 0),
        completed: Boolean(completed),
      },
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('API Error POST /api/history/progress:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menyimpan progress tontonan' },
      { status: 500 }
    );
  }
}

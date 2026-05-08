import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/google-services';

export async function POST(req: NextRequest) {
  try {
    const { text, targetLanguage } = await req.json();

    if (!text || !targetLanguage) {
      return NextResponse.json({ error: 'Missing text or targetLanguage' }, { status: 400 });
    }

    if (!process.env.GOOGLE_CLOUD_PROJECT) {
      // Demo mode fallback
      const fakeTranslation = `[${targetLanguage.toUpperCase()}] ${text}`;
      return NextResponse.json({ translatedText: fakeTranslation });
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Translate } = require('@google-cloud/translate/build/src/v2');
    const translate = new Translate({ projectId: process.env.GOOGLE_CLOUD_PROJECT });

    let [translations] = await translate.translate(text, targetLanguage);
    translations = Array.isArray(translations) ? translations : [translations];

    return NextResponse.json({ translatedText: translations[0] });

  } catch (error) {
    logger.error('Translation API error', { error: String(error) });
    return NextResponse.json({ error: 'Failed to translate' }, { status: 500 });
  }
}

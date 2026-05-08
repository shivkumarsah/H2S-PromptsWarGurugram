/* eslint-disable */
import { NextRequest, NextResponse } from 'next/server';
import { tripsDb } from '@/lib/firestore';
import { logger } from '@/lib/google-services';
import { Itinerary, DayPlan, Activity } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { tripId, targetLanguage } = await req.json();

    if (!tripId || !targetLanguage) {
      return NextResponse.json({ success: false, error: 'Missing tripId or targetLanguage' }, { status: 400 });
    }

    const trip = await tripsDb.get(tripId);
    if (!trip || !trip.itinerary) {
      return NextResponse.json({ success: false, error: 'Trip or itinerary not found' }, { status: 404 });
    }

    if (!process.env.GOOGLE_CLOUD_PROJECT || targetLanguage === 'en') {
      // In demo mode or if English is requested, just return the original
      return NextResponse.json({ success: true, data: trip.itinerary });
    }

     
    const { Translate } = require('@google-cloud/translate/build/src/v2');
    const translate = new Translate({ projectId: process.env.GOOGLE_CLOUD_PROJECT });

    // Helper to translate an array of strings
    const translateTexts = async (texts: string[]) => {
      if (texts.length === 0) return [];
      let [translations] = await translate.translate(texts, targetLanguage);
      translations = Array.isArray(translations) ? translations : [translations];
      return translations;
    };

    const itinerary = JSON.parse(JSON.stringify(trip.itinerary)) as Itinerary;

    // Collect all strings to translate
    const stringsToTranslate: string[] = [];
    const mapping: Array<{ obj: Record<string, unknown>; key: string }> = [];

    // Highlights
    itinerary.highlights.forEach((h, i) => {
      stringsToTranslate.push(h);
      mapping.push({ obj: itinerary.highlights, key: String(i) });
    });

    // Days
    itinerary.days.forEach((day: DayPlan) => {
      if (day.theme) {
        stringsToTranslate.push(day.theme);
        mapping.push({ obj: day, key: 'theme' });
      }
      if (day.summary) {
        stringsToTranslate.push(day.summary);
        mapping.push({ obj: day, key: 'summary' });
      }

      // Activities
      day.activities.forEach((act: Activity) => {
        if (act.name) {
          stringsToTranslate.push(act.name);
          mapping.push({ obj: act, key: 'name' });
        }
        if (act.description) {
          stringsToTranslate.push(act.description);
          mapping.push({ obj: act, key: 'description' });
        }
      });
    });

    if (stringsToTranslate.length > 0) {
      const translatedStrings = await translateTexts(stringsToTranslate);
      
      // Map back
      translatedStrings.forEach((str: string, i: number) => {
        const { obj, key } = mapping[i];
        obj[key] = str as unknown;
      });
    }

    logger.info('Itinerary translated', { tripId, targetLanguage });

    return NextResponse.json({
      success: true,
      data: itinerary
    });

  } catch (error) {
    logger.error('Translation error', { error: String(error) });
    return NextResponse.json({ success: false, error: 'Failed to translate' }, { status: 500 });
  }
}

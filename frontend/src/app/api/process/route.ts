import { createWorker } from 'tesseract.js';

export const dynamic = 'force-dynamic'; // Required for file uploads

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return new Response('No file uploaded', { status: 400 });
  }

  const worker = await createWorker('eng');
  try {
    const { data } = await worker.recognize(file);
    return new Response(JSON.stringify({ text: data.text }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response('OCR processing failed', { status: 500 });
  } finally {
    await worker.terminate();
  }
}
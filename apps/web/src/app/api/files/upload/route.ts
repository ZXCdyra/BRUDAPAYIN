import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Accept multipart/form-data for file uploads
  const formData = await request.formData();
  const orderId = formData.get('orderId') as string;
  const files = formData.getAll('files') as File[];
  return NextResponse.json({
    order_id: orderId,
    files_uploaded: files.length,
    file_ids: files.map((_, i) => `file-${Date.now()}-${i}`),
  });
}

import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import { saveProductImage } from '../../../../lib/productImageStorage';

export const runtime = 'nodejs';

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const role = String(token?.role ?? '').toUpperCase();
  if (!token || !['ADMIN', 'SUPER_ADMIN'].includes(role)) {
    return NextResponse.json({ success: false, message: 'Administrator access is required.' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: 'Choose an image file to upload.' }, { status: 400 });
    }

    if (file.size === 0 || file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ success: false, message: 'Images must be smaller than 8 MB.' }, { status: 400 });
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return NextResponse.json({ success: false, message: 'Only JPEG, PNG, and WebP images are supported.' }, { status: 415 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const url = await saveProductImage(bytes, file.type);

    return NextResponse.json({
      success: true,
      data: { url },
    });
  } catch (error) {
    console.error('Product image upload failed:', error);
    return NextResponse.json({ success: false, message: 'Unable to save the uploaded image.' }, { status: 500 });
  }
}

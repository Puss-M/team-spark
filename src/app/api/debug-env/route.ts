import { NextResponse } from "next/server";

export const runtime = 'edge';

export async function GET() {
  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT_SET',
    supabaseKeyExists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseKeyPreview: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
      ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` 
      : 'NOT_SET',
    openaiKeyExists: !!process.env.OPENAI_API_KEY,
    openaiKeyPreview: process.env.OPENAI_API_KEY 
      ? `${process.env.OPENAI_API_KEY.substring(0, 15)}...` 
      : 'NOT_SET',
    nodeEnv: process.env.NODE_ENV,
  });
}

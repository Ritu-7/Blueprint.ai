import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../utils/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('support_tickets' as any)
      .insert([{ name, email, message }]);

    if (error) {
      console.error('Supabase support error:', error);
      return NextResponse.json({ error: 'Failed to submit ticket' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Ticket submitted successfully' });
  } catch (error: any) {
    console.error('Support API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



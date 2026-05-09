import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return NextResponse.json({
      success: true,
      prUrl: "https://github.com/user/project/pull/1",
      message: 'Pull request created successfully'
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create pull request' }, { status: 500 });
  }
}

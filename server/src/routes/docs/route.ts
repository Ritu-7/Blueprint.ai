import { NextResponse } from 'next/server';

export async function GET() {
  const endpoints = [
    {
      name: "Generate Application",
      path: "/api/generate",
      method: "POST",
      description: "Triggers the AI engine to generate full-stack application code based on a prompt.",
      payload: {
        prompt: "string (e.g., 'A modern CRM for architects')"
      },
      response: {
        project: {
          id: "string",
          name: "string",
          ui_code: "string",
          schema_code: "string",
          api_code: "string"
        }
      }
    },
    {
      name: "Get User Projects",
      path: "/api/projects",
      method: "GET",
      description: "Retrieves all generated projects for the authenticated user.",
      response: {
        projects: "Array<Project>"
      }
    }
  ];

  return NextResponse.json({ endpoints });
}



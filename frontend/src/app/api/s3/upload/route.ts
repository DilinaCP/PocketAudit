export async function POST(req: Request) {
  const formData = await req.formData();
  
  // Forward to Node.js backend
  const backendResponse = await fetch('http://localhost:3001/api/process', {
    method: 'POST',
    body: formData
  });

  if (!backendResponse.ok) {
    return Response.json(
      { error: 'Backend processing failed' },
      { status: 500 }
    );
  }

  return Response.json(await backendResponse.json());
}
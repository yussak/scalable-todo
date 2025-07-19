export async function GET() {
  return Response.json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
}

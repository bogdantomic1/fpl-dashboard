export async function GET() {
    const res = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
      headers: {
        'Content-Type': 'application/json',
        'API-Key': process.env.DATA_API_KEY,
      },
    })
    const data = await res.json()
   
    return Response.json({ data })
  }
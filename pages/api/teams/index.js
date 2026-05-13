import jsonDb from '@/lib/jsonDb';

export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.json(jsonDb.getTeams());
  }

  if (req.method === 'POST') {
    const team = jsonDb.createTeam(req.body);
    return res.json(team);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

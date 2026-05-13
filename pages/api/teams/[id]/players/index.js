import jsonDb from '@/lib/jsonDb';

export default function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'POST') {
    const player = jsonDb.addPlayerToTeam(id, req.body);
    if (player) return res.json(player);
    return res.status(404).json({ error: 'Team not found' });
  }

  res.setHeader('Allow', ['POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

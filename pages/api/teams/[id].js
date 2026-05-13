import jsonDb from '@/lib/jsonDb';

export default function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    const team = jsonDb.updateTeam(id, req.body);
    if (team) return res.json(team);
    return res.status(404).json({ error: 'Team not found' });
  }

  if (req.method === 'DELETE') {
    const success = jsonDb.deleteTeam(id);
    if (success) return res.json({ success: true });
    return res.status(404).json({ error: 'Team not found' });
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

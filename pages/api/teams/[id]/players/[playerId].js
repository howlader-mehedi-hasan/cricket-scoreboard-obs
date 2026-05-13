import jsonDb from '@/lib/jsonDb';

export default function handler(req, res) {
  const { id, playerId } = req.query;

  if (req.method === 'DELETE') {
    const success = jsonDb.deletePlayer(id, playerId);
    if (success) return res.json({ success: true });
    return res.status(404).json({ error: 'Not found' });
  }

  res.setHeader('Allow', ['DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

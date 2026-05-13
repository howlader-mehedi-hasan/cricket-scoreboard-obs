import jsonDb from '@/lib/jsonDb';

export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.json(jsonDb.getMatches());
  }

  res.setHeader('Allow', ['GET']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

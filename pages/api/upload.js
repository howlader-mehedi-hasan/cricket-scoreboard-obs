import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { image, name } = req.body;
    if (!image || !name) {
      return res.status(400).json({ error: 'Missing data' });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const extension = name.split('.').pop();
    const fileName = `bg_${Date.now()}.${extension}`;
    const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    fs.writeFileSync(filePath, base64Data, 'base64');
    return res.json({ url: `/uploads/${fileName}` });
  } catch (err) {
    console.error('[API] Upload error:', err);
    return res.status(500).json({ error: 'Upload failed' });
  }
}

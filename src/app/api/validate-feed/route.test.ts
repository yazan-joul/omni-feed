import { POST } from './route';
import { NextRequest } from 'next/server';

describe('Validate Feed API', () => {
  const createRequest = (body: any) => 
    new NextRequest('http://localhost:3000/api/validate-feed', {
      method: 'POST',
      body: JSON.stringify(body),
    });

  it('extracts reddit subreddit cleanly', async () => {
    const req = createRequest({ url: 'https://reddit.com/r/nextjs?sort=top', platform: 'reddit' });
    const res = await POST(req);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.title).toBe('r/nextjs');
    expect(data.url).toBe('https://www.reddit.com/r/nextjs');
  });

  it('extracts X/Twitter handles cleanly from query params', async () => {
    const req = createRequest({ url: 'https://x.com/fireship_dev?s=21', platform: 'twitter' });
    const res = await POST(req);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.title).toBe('@fireship_dev');
    expect(data.url).toBe('https://x.com/fireship_dev');
  });

  it('handles raw @ handles for instagram', async () => {
    const req = createRequest({ url: '@zuck', platform: 'instagram' });
    const res = await POST(req);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.title).toBe('@zuck');
    expect(data.url).toBe('https://www.instagram.com/zuck/');
  });
});

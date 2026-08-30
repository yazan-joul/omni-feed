import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import { FeedSource } from '@/lib/types';
import { DEFAULT_FEED_SOURCES } from '@/lib/config/default-sources';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let xmlText = '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      xmlText = body.xml;
    } else {
      xmlText = await request.text();
    }

    if (!xmlText || typeof xmlText !== 'string') {
      return NextResponse.json({ success: false, error: 'No XML provided.' }, { status: 400 });
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });

    const parsed = parser.parse(xmlText);
    const opml = parsed.opml;

    if (!opml || !opml.body) {
      return NextResponse.json({ success: false, error: 'Invalid OPML format.' }, { status: 400 });
    }

    const extractOutlines = (node: any): any[] => {
      let outlines: any[] = [];
      if (!node) return outlines;

      if (Array.isArray(node)) {
        node.forEach((n: any) => outlines.push(...extractOutlines(n)));
      } else if (node.outline) {
        outlines.push(...extractOutlines(node.outline));
      }
      
      // If the node itself is a feed outline (has xmlUrl)
      if (node['@_xmlUrl']) {
        outlines.push(node);
      }
      
      return outlines;
    };

    const feedOutlines = extractOutlines(opml.body.outline);

    const sources: FeedSource[] = feedOutlines.map((out: any, index: number) => {
      const title = out['@_title'] || out['@_text'] || 'Imported Feed';
      const xmlUrl = out['@_xmlUrl'];
      
      let platform: any = 'rss';
      if (xmlUrl.includes('youtube.com') || xmlUrl.includes('youtu.be')) platform = 'youtube';
      else if (xmlUrl.includes('substack.com')) platform = 'substack';

      return {
        id: `imported-${Date.now()}-${index}`,
        name: title,
        platform,
        url: xmlUrl,
        enabled: true,
        isCustom: true,
      };
    }).filter((s: FeedSource) => s.url); // Ensure URL exists

    return NextResponse.json({
      success: true,
      count: sources.length,
      sources,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to parse OPML.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Try to parse custom sources from query, else export default
  const { searchParams } = new URL(request.url);
  const customSourcesParam = searchParams.get('sources');
  
  let sourcesToExport: FeedSource[] = [...DEFAULT_FEED_SOURCES];
  
  if (customSourcesParam) {
    try {
      const parsed = JSON.parse(decodeURIComponent(customSourcesParam));
      if (Array.isArray(parsed) && parsed.length > 0) {
        sourcesToExport = parsed;
      }
    } catch {
      // fallback to defaults
    }
  }

  // Generate OPML XML string
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<opml version="2.0">\n`;
  xml += `  <head>\n`;
  xml += `    <title>OmniFeed Subscriptions</title>\n`;
  xml += `    <dateCreated>${new Date().toUTCString()}</dateCreated>\n`;
  xml += `  </head>\n`;
  xml += `  <body>\n`;

  // Flat list, no categories
  for (const source of sourcesToExport) {
    xml += `    <outline text="${escapeXml(source.name)}" title="${escapeXml(source.name)}" type="rss" xmlUrl="${escapeXml(source.url)}" />\n`;
  }

  xml += `  </body>\n`;
  xml += `</opml>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'text/x-opml',
      'Content-Disposition': 'attachment; filename="omnifeed-subscriptions.opml"',
    },
  });
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

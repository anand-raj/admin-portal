import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { sendNewsletter } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function NewsletterPage() {
  const { token } = useAuth();
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!subject.trim() || !html.trim()) {
      toast.error('Subject and body are required.');
      return;
    }
    if (!confirm(`Send this newsletter to all approved members?`)) return;
    setSending(true);
    try {
      const result = await sendNewsletter(token, { subject, html });
      toast.success(`Sent to ${result.sent} of ${result.total} members.`);
      setSubject('');
      setHtml('');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-6 space-y-4 max-w-2xl">
      <h1 className="text-xl font-semibold">Newsletter</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compose</CardTitle>
          <CardDescription>
            Sent to all approved, non-expired members. Use <code>{'{{name}}'}</code> for personalisation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" value={subject} onChange={e => setSubject(e.target.value)}
              placeholder="Monthly update — April 2026" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="html">Body (HTML)</Label>
            <textarea
              id="html"
              value={html}
              onChange={e => setHtml(e.target.value)}
              placeholder="<p>Hi {{name}},</p><p>...</p>"
              rows={12}
              className="w-full border rounded-md p-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            />
          </div>
          <Button onClick={handleSend} disabled={sending} className="w-full">
            {sending ? 'Sending…' : 'Send Newsletter'}
          </Button>
        </CardContent>
      </Card>

      {html && (
        <Card>
          <CardHeader><CardTitle className="text-base">Preview</CardTitle></CardHeader>
          <CardContent>
            <div
              className="border rounded p-4 bg-white prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: html.replace(/\{\{name\}\}/g, 'Preview User') }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

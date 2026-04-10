import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../lib/auth';
import {
  getEventSummaries,
  getEventRegistrations,
  confirmRegistration,
  cancelRegistration,
} from '../lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { CalendarDays, Users, ChevronRight, ArrowLeft } from 'lucide-react';

function statusVariant(status) {
  return { confirmed: 'default', pending: 'secondary', cancelled: 'outline' }[status] ?? 'secondary';
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Event summary cards ────────────────────────────────────────────────────
function EventSummaryList({ summaries, onSelect }) {
  if (!summaries.length) {
    return <p className="text-sm text-gray-500 py-8 text-center">No event registrations yet.</p>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {summaries.map(ev => (
        <Card
          key={ev.event_slug}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onSelect(ev)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold leading-snug line-clamp-2">
              {ev.event_title}
            </CardTitle>
            <p className="text-xs text-gray-400 font-mono">{ev.event_slug}</p>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <Users size={12} /> {ev.total} registration{ev.total !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays size={12} /> {ev.total_participants} participant{ev.total_participants !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {ev.pending > 0 && <Badge variant="secondary">{ev.pending} pending</Badge>}
              {ev.confirmed > 0 && <Badge variant="default">{ev.confirmed} confirmed</Badge>}
              {ev.cancelled > 0 && <Badge variant="outline">{ev.cancelled} cancelled</Badge>}
            </div>
            <div className="flex justify-end">
              <ChevronRight size={16} className="text-gray-400" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Registration table for a single event ─────────────────────────────────
function EventRegistrationTable({ event, registrations, onBack, onRefresh, busy, onConfirm, onCancel, search, setSearch }) {
  const filtered = registrations.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft size={14} /> Events
        </Button>
        <div className="text-sm text-gray-400">/</div>
        <h2 className="text-sm font-semibold truncate">{event.event_title}</h2>
      </div>

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex gap-2 flex-wrap text-xs text-gray-500">
          <Badge variant="secondary">{event.total} total</Badge>
          <Badge variant="default">{event.confirmed} confirmed</Badge>
          <Badge variant="outline">{event.pending} pending</Badge>
          {event.cancelled > 0 && <Badge variant="outline">{event.cancelled} cancelled</Badge>}
          <span className="ml-1">{event.total_participants} participants total</span>
        </div>
        <Input
          placeholder="Search name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-8 text-sm w-56"
        />
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-center">Participants</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                  No registrations found.
                </TableCell>
              </TableRow>
            ) : filtered.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium whitespace-nowrap">{r.name}</TableCell>
                <TableCell className="text-sm text-gray-600">{r.email}</TableCell>
                <TableCell className="text-sm text-gray-500">{r.phone || '—'}</TableCell>
                <TableCell className="text-center">{r.participants}</TableCell>
                <TableCell className="text-sm text-gray-500 max-w-[180px] truncate" title={r.notes}>{r.notes || '—'}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                </TableCell>
                <TableCell className="text-xs text-gray-400 whitespace-nowrap">{fmtDate(r.created_at)}</TableCell>
                <TableCell>
                  <div className="flex gap-1 justify-end">
                    {r.status !== 'confirmed' && r.status !== 'cancelled' && (
                      <Button
                        size="sm" variant="outline"
                        className="h-7 text-xs"
                        disabled={!!busy[r.id]}
                        onClick={() => onConfirm(r.id)}
                      >
                        Confirm
                      </Button>
                    )}
                    {r.status !== 'cancelled' && (
                      <Button
                        size="sm" variant="ghost"
                        className="h-7 text-xs text-red-500 hover:text-red-700"
                        disabled={!!busy[r.id]}
                        onClick={() => onCancel(r.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function EventRegistrationsPage() {
  const { token } = useAuth();
  const [summaries, setSummaries] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regsLoading, setRegsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState({});

  const loadSummaries = useCallback(async () => {
    try {
      setLoading(true);
      setSummaries(await getEventSummaries(token));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadSummaries(); }, [loadSummaries]);

  async function selectEvent(ev) {
    setSelectedEvent(ev);
    setSearch('');
    setRegsLoading(true);
    try {
      setRegistrations(await getEventRegistrations(token, ev.event_slug));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setRegsLoading(false);
    }
  }

  async function act(id, fn, label) {
    setBusy(b => ({ ...b, [id]: true }));
    try {
      await fn(token, id);
      // Refresh registrations & summaries
      const [regs, evs] = await Promise.all([
        getEventRegistrations(token, selectedEvent.event_slug),
        getEventSummaries(token),
      ]);
      setRegistrations(regs);
      setSummaries(evs);
      // Update selectedEvent counts
      const updated = evs.find(e => e.event_slug === selectedEvent.event_slug);
      if (updated) setSelectedEvent(updated);
      toast.success(label);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(b => ({ ...b, [id]: false }));
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Event Registrations</h1>
          {!selectedEvent && !loading && (
            <p className="text-sm text-gray-500 mt-0.5">{summaries.length} event{summaries.length !== 1 ? 's' : ''} with registrations</p>
          )}
        </div>
        {selectedEvent && (
          <Button variant="outline" size="sm" onClick={loadSummaries} disabled={loading}>
            Refresh
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : !selectedEvent ? (
        <EventSummaryList summaries={summaries} onSelect={selectEvent} />
      ) : regsLoading ? (
        <p className="text-sm text-gray-400">Loading registrations…</p>
      ) : (
        <EventRegistrationTable
          event={selectedEvent}
          registrations={registrations}
          onBack={() => { setSelectedEvent(null); loadSummaries(); }}
          onRefresh={() => selectEvent(selectedEvent)}
          busy={busy}
          onConfirm={id => act(id, confirmRegistration, 'Registration confirmed')}
          onCancel={id => act(id, cancelRegistration, 'Registration cancelled')}
          search={search}
          setSearch={setSearch}
        />
      )}
    </div>
  );
}

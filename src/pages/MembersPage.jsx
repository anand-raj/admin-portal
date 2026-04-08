import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../lib/auth';
import { getMembers, approveMember, rejectMember, renewMember } from '../lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

function statusVariant(status, isExpired) {
  if (isExpired) return 'destructive';
  return { approved: 'default', pending: 'secondary', rejected: 'outline' }[status] ?? 'secondary';
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isExpired(expiresAt) {
  return expiresAt && new Date(expiresAt) < new Date();
}

export default function MembersPage() {
  const { token } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setMembers(await getMembers(token));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function act(id, fn, label) {
    setBusy(b => ({ ...b, [id]: true }));
    try {
      await fn(token, id);
      await load();
      toast.success(label);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(b => ({ ...b, [id]: false }));
    }
  }

  const filtered = members
    .filter(m => filter === 'all' || m.status === filter)
    .filter(m => !search || m.name.toLowerCase().includes(search) || m.email.toLowerCase().includes(search));

  const counts = {
    total: members.length,
    pending: members.filter(m => m.status === 'pending').length,
    approved: members.filter(m => m.status === 'approved').length,
    rejected: members.filter(m => m.status === 'rejected').length,
    expired: members.filter(m => isExpired(m.expires_at)).length,
  };

  const FILTERS = ['all', 'pending', 'approved', 'rejected'];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Members</h1>
        <Button variant="outline" size="sm" onClick={load}>↻ Refresh</Button>
      </div>

      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: 'Total', value: counts.total },
          { label: 'Pending', value: counts.pending, cls: 'text-amber-600' },
          { label: 'Approved', value: counts.approved, cls: 'text-green-700' },
          { label: 'Rejected', value: counts.rejected, cls: 'text-red-600' },
          { label: 'Expired', value: counts.expired, cls: 'text-red-500' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-white rounded-lg border px-4 py-2 text-center min-w-20">
            <div className={`text-2xl font-bold ${cls ?? ''}`}>{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex gap-1">
          {FILTERS.map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
        <Input
          placeholder="Search name or email…"
          className="max-w-xs"
          value={search}
          onChange={e => setSearch(e.target.value.toLowerCase())}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Occupation</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Approved</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={10} className="text-center py-10 text-muted-foreground">Loading…</TableCell></TableRow>
            )}
            {!loading && !filtered.length && (
              <TableRow><TableCell colSpan={10} className="text-center py-10 text-muted-foreground">No members found.</TableCell></TableRow>
            )}
            {filtered.map(m => {
              const expired = isExpired(m.expires_at);
              const isBusy = busy[m.id];
              return (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell><a href={`mailto:${m.email}`} className="hover:underline">{m.email}</a></TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(m.status, expired)}>
                      {expired ? 'expired' : m.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{fmtDate(m.created_at)}</TableCell>
                  <TableCell className="text-sm">{m.occupation || '—'}</TableCell>
                  <TableCell className="text-sm">
                    {m.city || m.state || m.pincode
                      ? <>{m.city}{m.city && m.state ? ', ' : ''}{m.state}{m.pincode ? <span className="text-muted-foreground"> {m.pincode}</span> : ''}</>
                      : '—'}
                  </TableCell>
                  <TableCell className="text-sm">{m.phone || '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{fmtDate(m.approved_at)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{fmtDate(m.expires_at)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      {m.status !== 'approved' && (
                        <Button size="sm" variant="outline" disabled={isBusy}
                          className="text-green-700 border-green-200 hover:bg-green-50"
                          onClick={() => act(m.id, approveMember, 'Member approved.')}>
                          Approve
                        </Button>
                      )}
                      {(m.status === 'approved' || expired) && (
                        <Button size="sm" variant="outline" disabled={isBusy}
                          className="text-blue-700 border-blue-200 hover:bg-blue-50"
                          onClick={() => act(m.id, renewMember, 'Membership renewed.')}>
                          Renew
                        </Button>
                      )}
                      {m.status !== 'rejected' && (
                        <Button size="sm" variant="outline" disabled={isBusy}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => act(m.id, rejectMember, 'Member rejected.')}>
                          Reject
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">Showing {filtered.length} of {members.length} members</p>
    </div>
  );
}

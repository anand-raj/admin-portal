import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { getOrders } from '../lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtAmount(paise) {
  return `₹${(paise / 100).toFixed(2)}`;
}

export default function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  async function load() {
    try {
      setLoading(true);
      setOrders(await getOrders(token));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = orders
    .filter(o => filter === 'all' || o.status === filter)
    .filter(o => !search ||
      o.name?.toLowerCase().includes(search) ||
      o.email?.toLowerCase().includes(search) ||
      o.book_title?.toLowerCase().includes(search)
    );

  const counts = {
    total: orders.length,
    paid: orders.filter(o => o.status === 'paid').length,
    pending: orders.filter(o => o.status === 'pending').length,
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Orders</h1>
        <Button variant="outline" size="sm" onClick={load}>↻ Refresh</Button>
      </div>

      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: 'Total', value: counts.total },
          { label: 'Paid', value: counts.paid, cls: 'text-green-700' },
          { label: 'Pending', value: counts.pending, cls: 'text-amber-600' },
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
          {['all', 'paid', 'pending'].map(f => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm"
              onClick={() => setFilter(f)} className="capitalize">
              {f}
            </Button>
          ))}
        </div>
        <Input placeholder="Search name, email, or book…" className="max-w-xs"
          value={search} onChange={e => setSearch(e.target.value.toLowerCase())} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Book</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Loading…</TableCell></TableRow>
            )}
            {!loading && !filtered.length && (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No orders found.</TableCell></TableRow>
            )}
            {filtered.map(o => (
              <TableRow key={o.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{o.razorpay_order_id ?? o.id}</TableCell>
                <TableCell>
                  <div className="font-medium">{o.name}</div>
                  <div className="text-xs text-muted-foreground">{o.email}</div>
                </TableCell>
                <TableCell>{o.book_title}</TableCell>
                <TableCell>{o.amount ? fmtAmount(o.amount) : '—'}</TableCell>
                <TableCell>
                  <Badge variant={o.status === 'paid' ? 'default' : 'secondary'} className="capitalize">
                    {o.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{fmtDate(o.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">Showing {filtered.length} of {orders.length} orders</p>
    </div>
  );
}

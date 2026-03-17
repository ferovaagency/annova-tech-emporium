// TODO: Add authentication/authorization for admin access
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/data/products';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Search, Loader2, X, Eye, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AvailabilityRequest {
  id: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  items: Array<{ name: string; quantity: number; price: number; slug: string }>;
  total: number;
  status: string;
  admin_notes: string | null;
  suggested_products: Array<{ id: string; name: string; slug: string; price: number; image?: string }> | null;
  created_at: string;
  updated_at: string;
}

interface DBProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  stock: number | null;
  active: boolean | null;
  category: string | null;
  brand: string | null;
  images: string[] | null;
}

interface CustomerRow {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  city: string | null;
  last_order_at: string | null;
  created_at: string;
}

interface OrderRow {
  id: string;
  reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  total: number;
  status: string;
  created_at: string;
  updated_at: string;
  items: Array<{ name: string; quantity: number; price: number; slug?: string }>;
  shipping_address: Record<string, string> | null;
  status_history: Array<{ status: string; at: string; source?: string }>;
}

interface SuggestedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  image?: string;
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export default function AdminPanel() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<AvailabilityRequest[]>([]);
  const [dbProducts, setDbProducts] = useState<DBProduct[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('solicitudes');
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [unavailableModalOpen, setUnavailableModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AvailabilityRequest | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SuggestedProduct[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<SuggestedProduct[]>([]);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  const fetchRequests = useCallback(async () => {
    const { data } = await supabase.from('availability_requests').select('*').order('created_at', { ascending: false });
    if (data) setRequests(data as unknown as AvailabilityRequest[]);
  }, []);

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase.from('products').select('id, name, slug, price, sale_price, stock, active, category, brand, images').order('created_at', { ascending: false });
    if (data) setDbProducts(data as unknown as DBProduct[]);
  }, []);

  const fetchCustomers = useCallback(async () => {
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (data) setCustomers(data as unknown as CustomerRow[]);
  }, []);

  const fetchOrders = useCallback(async () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase.from('orders').select('*').or(`created_at.gte.${twoWeeksAgo},status.neq.delivered`).order('created_at', { ascending: false });
    if (data) setOrders(data as unknown as OrderRow[]);
  }, []);

  const cleanupApprovals = useCallback(async () => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('availability_requests').delete().neq('status', 'pending').lt('updated_at', cutoff);
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    Promise.all([fetchRequests(), fetchProducts(), fetchCustomers(), fetchOrders()]).then(() => setLoading(false));
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, [fetchRequests, fetchProducts, fetchCustomers, fetchOrders]);

  useEffect(() => {
    if (currentTab === 'solicitudes') cleanupApprovals();
  }, [currentTab, cleanupApprovals]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase.from('products').select('id, name, slug, price, sale_price, images').eq('active', true).ilike('name', `%${searchQuery}%`).limit(8);
      if (data) {
        setSearchResults(data.filter((p: any) => !selectedSuggestions.some((s) => s.id === p.id)).map((p: any) => ({ id: p.id, name: p.name, slug: p.slug, price: p.sale_price || p.price, image: p.images?.[0] })));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedSuggestions]);

  const handleMarkAvailable = async (id: string) => {
    await supabase.from('availability_requests').update({ status: 'available', updated_at: new Date().toISOString() }).eq('id', id);
    toast({ title: 'Solicitud marcada como disponible' });
    fetchRequests();
  };

  const openUnavailableModal = (req: AvailabilityRequest) => {
    setSelectedRequest(req);
    setAdminNote('');
    setSelectedSuggestions([]);
    setSearchQuery('');
    setSearchResults([]);
    setUnavailableModalOpen(true);
  };

  const handleSendUnavailable = async () => {
    if (!selectedRequest) return;
    await supabase.from('availability_requests').update({ status: 'unavailable', admin_notes: adminNote || null, suggested_products: selectedSuggestions.length > 0 ? selectedSuggestions as any : null, updated_at: new Date().toISOString() }).eq('id', selectedRequest.id);
    toast({ title: 'Respuesta enviada al cliente' });
    setUnavailableModalOpen(false);
    fetchRequests();
  };

  const handleToggleActive = async (product: DBProduct) => {
    await supabase.from('products').update({ active: !product.active, updated_at: new Date().toISOString() }).eq('id', product.id);
    fetchProducts();
  };

  const handleDeleteProduct = async (product: DBProduct) => {
    if (!confirm(`¿Eliminar '${product.name}'? Esta acción no se puede deshacer.`)) return;
    const { error } = await supabase.from('products').delete().eq('id', product.id);
    if (error) toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Producto eliminado' }); fetchProducts(); }
  };

  const handleOrderStatusChange = async (orderId: string, status: string) => {
    const order = orders.find((item) => item.id === orderId);
    const nextHistory = [...(order?.status_history || []), { status, at: new Date().toISOString(), source: 'admin' }];
    const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString(), status_history: nextHistory as any }).eq('id', orderId);
    if (error) {
      toast({ title: 'No se pudo actualizar el pedido', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Estado actualizado' });
    fetchOrders();
    if (selectedOrder?.id === orderId) setSelectedOrder((prev) => prev ? { ...prev, status, status_history: nextHistory } : prev);
  };

  const requestStatusBadge = (status: string) => {
    if (status === 'pending') return <Badge className="bg-yellow-500 text-white">Pendiente</Badge>;
    if (status === 'available') return <Badge className="bg-green-600 text-white">Disponible</Badge>;
    return <Badge variant="destructive">No disponible</Badge>;
  };

  const orderStatusBadge = (status: string) => {
    if (status === 'pending') return <Badge className="bg-yellow-500 text-white">Pendiente</Badge>;
    if (status === 'paid') return <Badge className="bg-blue-600 text-white">Pagado</Badge>;
    if (status === 'shipped') return <Badge className="bg-orange-500 text-white">Enviado</Badge>;
    if (status === 'delivered') return <Badge className="bg-green-600 text-white">Entregado</Badge>;
    return <Badge className="bg-red-600 text-white">Cancelado</Badge>;
  };

  const filteredProducts = useMemo(() => dbProducts.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase())), [dbProducts, productSearch]);
  const filteredCustomers = useMemo(() => customers.filter((c) => `${c.name || ''} ${c.email}`.toLowerCase().includes(customerSearch.toLowerCase())), [customers, customerSearch]);
  const filteredOrders = useMemo(() => orders.filter((o) => `${o.reference} ${o.customer_email}`.toLowerCase().includes(orderSearch.toLowerCase())), [orders, orderSearch]);

  if (loading) return <main className="py-16 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></main>;

  return (
    <main className="py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bebas mb-8">Panel de <span className="text-primary">Administración</span></h1>
        <Tabs defaultValue="solicitudes" value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="solicitudes" className="relative">Aprobaciones{pendingCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">{pendingCount}</span>}</TabsTrigger>
            <TabsTrigger value="productos">Productos</TabsTrigger>
            <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
            <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
          </TabsList>

          <TabsContent value="solicitudes" className="mt-6">
            {requests.length === 0 ? <p className="text-center text-muted-foreground py-8">No hay solicitudes aún.</p> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Cliente</TableHead><TableHead>Productos</TableHead><TableHead>Total</TableHead><TableHead>Estado</TableHead><TableHead>Acciones</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {requests.map((req) => <TableRow key={req.id}><TableCell className="text-xs whitespace-nowrap">{new Date(req.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</TableCell><TableCell><p className="font-medium text-sm">{req.customer_name}</p><p className="text-xs text-muted-foreground">{req.customer_email}</p><p className="text-xs text-muted-foreground">{req.customer_phone}</p></TableCell><TableCell><ul className="text-xs space-y-1">{(req.items || []).map((item, i) => <li key={i}>{item.name} x{item.quantity} — {formatPrice(item.price)}</li>)}</ul></TableCell><TableCell className="font-medium">{formatPrice(req.total)}</TableCell><TableCell>{requestStatusBadge(req.status)}</TableCell><TableCell>{req.status === 'pending' && <div className="flex gap-2"><Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleMarkAvailable(req.id)}><CheckCircle className="w-4 h-4 mr-1" /> Disponible</Button><Button size="sm" variant="destructive" onClick={() => openUnavailableModal(req)}><XCircle className="w-4 h-4 mr-1" /> No disponible</Button></div>}</TableCell></TableRow>)}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="productos" className="mt-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">{dbProducts.length} productos en base de datos</p>
              <Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Buscar por nombre..." className="sm:max-w-sm" />
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Categoría</TableHead><TableHead>Marca</TableHead><TableHead>Precio</TableHead><TableHead>Stock</TableHead><TableHead>Estado</TableHead><TableHead>Acciones</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredProducts.map((p) => <TableRow key={p.id}><TableCell className="font-medium text-sm">{p.name}</TableCell><TableCell className="text-sm">{p.category || '-'}</TableCell><TableCell className="text-sm">{p.brand || '-'}</TableCell><TableCell className="text-sm">{formatPrice(Number(p.sale_price || p.price))}</TableCell><TableCell className="text-sm">{p.stock ?? '-'}</TableCell><TableCell><Badge className={p.active ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'}>{p.active ? 'Activo' : 'Inactivo'}</Badge></TableCell><TableCell><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => handleToggleActive(p)} title={p.active ? 'Desactivar' : 'Activar'}>{p.active ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}</Button><a href={`/producto/${p.slug}`} target="_blank" rel="noopener noreferrer"><Button size="icon" variant="ghost" title="Ver producto"><Eye className="w-4 h-4" /></Button></a><Button size="icon" variant="ghost" onClick={() => handleDeleteProduct(p)} title="Eliminar" className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button></div></TableCell></TableRow>)}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="usuarios" className="mt-6">
            <div className="mb-4"><Input value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} placeholder="Buscar por nombre o email..." className="sm:max-w-sm" /></div>
            <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Email</TableHead><TableHead>Teléfono</TableHead><TableHead>Ciudad</TableHead><TableHead>Última compra</TableHead></TableRow></TableHeader><TableBody>{filteredCustomers.map((customer) => <TableRow key={customer.id}><TableCell>{customer.name || '-'}</TableCell><TableCell>{customer.email}</TableCell><TableCell>{customer.phone || '-'}</TableCell><TableCell>{customer.city || '-'}</TableCell><TableCell>{customer.last_order_at ? new Date(customer.last_order_at).toLocaleString('es-CO') : '-'}</TableCell></TableRow>)}</TableBody></Table></div>
          </TabsContent>

          <TabsContent value="pedidos" className="mt-6">
            <div className="mb-4"><Input value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} placeholder="Buscar por referencia o email..." className="sm:max-w-sm" /></div>
            <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Referencia</TableHead><TableHead>Cliente</TableHead><TableHead>Email</TableHead><TableHead>Total</TableHead><TableHead>Estado</TableHead><TableHead>Fecha</TableHead></TableRow></TableHeader><TableBody>{filteredOrders.map((order) => <TableRow key={order.id} className="cursor-pointer" onClick={() => setSelectedOrder(order)}><TableCell>{order.reference}</TableCell><TableCell>{order.customer_name}</TableCell><TableCell>{order.customer_email}</TableCell><TableCell>{formatPrice(Number(order.total))}</TableCell><TableCell>{orderStatusBadge(order.status)}</TableCell><TableCell>{new Date(order.created_at).toLocaleString('es-CO')}</TableCell></TableRow>)}</TableBody></Table></div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={unavailableModalOpen} onOpenChange={setUnavailableModalOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Responder como No Disponible</DialogTitle></DialogHeader><div className="space-y-4"><div><label className="text-sm font-medium mb-1 block">Nota para el cliente</label><Textarea placeholder="Explica al cliente por qué no está disponible..." value={adminNote} onChange={(e) => setAdminNote(e.target.value)} /></div><div><label className="text-sm font-medium mb-1 block">Productos sugeridos (opcional)</label><div className="relative"><Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" /><Input placeholder="Buscar producto..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" /></div>{searchResults.length > 0 && <div className="border rounded-lg mt-2 max-h-48 overflow-y-auto">{searchResults.map((item) => <button key={item.id} className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-3" onClick={() => { setSelectedSuggestions((prev) => [...prev, item]); setSearchQuery(''); setSearchResults([]); }}>{item.image && <img src={item.image} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />}<span className="flex-1 truncate">{item.name}</span><span className="text-xs text-primary font-bold flex-shrink-0">{formatPrice(item.price)}</span></button>)}</div>}{selectedSuggestions.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{selectedSuggestions.map((s) => <div key={s.id} className="flex items-center gap-2 bg-muted rounded-full px-3 py-1 text-sm"><span className="truncate max-w-[180px]">{s.name}</span><button className="text-muted-foreground hover:text-destructive" onClick={() => setSelectedSuggestions((prev) => prev.filter((p) => p.id !== s.id))}><X className="w-3 h-3" /></button></div>)}</div>}</div><Button onClick={handleSendUnavailable} variant="destructive" className="w-full">Confirmar y notificar</Button></div></DialogContent></Dialog>

      <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Detalle del pedido</DialogTitle></DialogHeader>
          {selectedOrder && <div className="space-y-4"><div className="grid gap-2 text-sm"><p><strong>Referencia:</strong> {selectedOrder.reference}</p><p><strong>Cliente:</strong> {selectedOrder.customer_name}</p><p><strong>Email:</strong> {selectedOrder.customer_email}</p><p><strong>Teléfono:</strong> {selectedOrder.customer_phone || '-'}</p><p><strong>Total:</strong> {formatPrice(Number(selectedOrder.total))}</p></div><div><p className="mb-2 text-sm font-medium">Estado</p><Select value={selectedOrder.status} onValueChange={(value) => handleOrderStatusChange(selectedOrder.id, value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pendiente</SelectItem><SelectItem value="paid">Pagado</SelectItem><SelectItem value="shipped">Enviado</SelectItem><SelectItem value="delivered">Entregado</SelectItem><SelectItem value="cancelled">Cancelado</SelectItem></SelectContent></Select></div><div><p className="mb-2 text-sm font-medium">Productos</p><div className="space-y-2">{(selectedOrder.items || []).map((item, index) => <div key={index} className="flex justify-between rounded-lg bg-muted px-3 py-2 text-sm"><span>{item.name} x{item.quantity}</span><span>{formatPrice(item.price * item.quantity)}</span></div>)}</div></div><div><p className="mb-2 text-sm font-medium">Datos de envío</p><pre className="rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap">{JSON.stringify(selectedOrder.shipping_address || {}, null, 2)}</pre></div><div><p className="mb-2 text-sm font-medium">Historial de estado</p><div className="space-y-2">{(selectedOrder.status_history || []).map((entry, index) => <div key={index} className="rounded-lg border px-3 py-2 text-sm"><div className="font-medium">{ORDER_STATUS_LABELS[entry.status] || entry.status}</div><div className="text-xs text-muted-foreground">{new Date(entry.at).toLocaleString('es-CO')}</div></div>)}</div></div></div>}
        </DialogContent>
      </Dialog>
    </main>
  );
}

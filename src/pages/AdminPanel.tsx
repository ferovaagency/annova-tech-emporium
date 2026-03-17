// TODO: Add authentication/authorization for admin access
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { products as localProducts, formatPrice } from '@/data/products';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Search, ExternalLink, Loader2 } from 'lucide-react';
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
  suggested_products: Array<{ name: string; slug: string; price: number }> | null;
  created_at: string;
  updated_at: string;
}

interface DBProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number | null;
  active: boolean | null;
  category: string | null;
  brand: string | null;
}

export default function AdminPanel() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<AvailabilityRequest[]>([]);
  const [dbProducts, setDbProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Unavailable modal state
  const [unavailableModalOpen, setUnavailableModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AvailabilityRequest | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSuggestions, setSelectedSuggestions] = useState<Array<{ name: string; slug: string; price: number }>>([]);

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const fetchRequests = useCallback(async () => {
    const { data } = await supabase
      .from('availability_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setRequests(data as unknown as AvailabilityRequest[]);
  }, []);

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, price, stock, active, category, brand')
      .order('created_at', { ascending: false });
    if (data) setDbProducts(data as unknown as DBProduct[]);
  }, []);

  useEffect(() => {
    Promise.all([fetchRequests(), fetchProducts()]).then(() => setLoading(false));
    // Polling every 15s for new requests
    const interval = setInterval(fetchRequests, 15000);
    return () => clearInterval(interval);
  }, [fetchRequests, fetchProducts]);

  const handleMarkAvailable = async (id: string) => {
    await supabase.from('availability_requests').update({ status: 'available' }).eq('id', id);
    toast({ title: 'Solicitud marcada como disponible' });
    fetchRequests();
  };

  const openUnavailableModal = (req: AvailabilityRequest) => {
    setSelectedRequest(req);
    setAdminNote('');
    setSelectedSuggestions([]);
    setSearchQuery('');
    setUnavailableModalOpen(true);
  };

  const handleSendUnavailable = async () => {
    if (!selectedRequest) return;
    await supabase.from('availability_requests').update({
      status: 'unavailable',
      admin_notes: adminNote || null,
      suggested_products: selectedSuggestions.length > 0 ? selectedSuggestions : null,
    }).eq('id', selectedRequest.id);
    toast({ title: 'Respuesta enviada al cliente' });
    setUnavailableModalOpen(false);
    fetchRequests();
  };

  const handleToggleActive = async (product: DBProduct) => {
    await supabase.from('products').update({ active: !product.active }).eq('id', product.id);
    fetchProducts();
  };

  // Search products for suggestions (from both DB and local data)
  const searchResults = searchQuery.length >= 2
    ? [
        ...dbProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => ({ name: p.name, slug: p.slug, price: Number(p.price) })),
        ...localProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => ({ name: p.name, slug: p.slug, price: p.price })),
      ].filter((item, index, self) => self.findIndex(s => s.slug === item.slug) === index)
        .filter(item => !selectedSuggestions.some(s => s.slug === item.slug))
        .slice(0, 5)
    : [];

  const statusBadge = (status: string) => {
    if (status === 'pending') return <Badge className="bg-yellow-500 text-white">Pendiente</Badge>;
    if (status === 'available') return <Badge className="bg-green-600 text-white">Disponible</Badge>;
    return <Badge variant="destructive">No disponible</Badge>;
  };

  if (loading) {
    return (
      <main className="py-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
      </main>
    );
  }

  return (
    <main className="py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bebas mb-8">Panel de <span className="text-primary">Administración</span></h1>

        <Tabs defaultValue="solicitudes">
          <TabsList>
            <TabsTrigger value="solicitudes" className="relative">
              Solicitudes de Disponibilidad
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="productos">Productos</TabsTrigger>
          </TabsList>

          {/* TAB 1 - Solicitudes */}
          <TabsContent value="solicitudes" className="mt-6">
            {requests.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay solicitudes aún.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Productos</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map(req => (
                      <TableRow key={req.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {new Date(req.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-sm">{req.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{req.customer_email}</p>
                          <p className="text-xs text-muted-foreground">{req.customer_phone}</p>
                        </TableCell>
                        <TableCell>
                          <ul className="text-xs space-y-1">
                            {(req.items || []).map((item, i) => (
                              <li key={i}>{item.name} x{item.quantity}</li>
                            ))}
                          </ul>
                        </TableCell>
                        <TableCell className="font-medium">{formatPrice(req.total)}</TableCell>
                        <TableCell>{statusBadge(req.status)}</TableCell>
                        <TableCell>
                          {req.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleMarkAvailable(req.id)}>
                                <CheckCircle className="w-4 h-4 mr-1" /> Disponible
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => openUnavailableModal(req)}>
                                <XCircle className="w-4 h-4 mr-1" /> No disponible
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* TAB 2 - Productos */}
          <TabsContent value="productos" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">{dbProducts.length} productos en base de datos</p>
              <Button onClick={() => window.location.href = '/generador'}>
                Ir al generador
              </Button>
            </div>
            {dbProducts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay productos en la base de datos. Usa el generador para crear productos.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dbProducts.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium text-sm">{p.name}</TableCell>
                        <TableCell className="text-sm">{p.category || '-'}</TableCell>
                        <TableCell className="text-sm">{p.brand || '-'}</TableCell>
                        <TableCell className="text-sm">{formatPrice(Number(p.price))}</TableCell>
                        <TableCell className="text-sm">{p.stock ?? '-'}</TableCell>
                        <TableCell>
                          <Badge variant={p.active ? 'default' : 'secondary'}>
                            {p.active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => handleToggleActive(p)}>
                            {p.active ? 'Desactivar' : 'Activar'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Unavailable response modal */}
      <Dialog open={unavailableModalOpen} onOpenChange={setUnavailableModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Responder como No Disponible</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Nota para el cliente</label>
              <Textarea
                placeholder="Explica al cliente por qué no está disponible..."
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Productos sugeridos (opcional)</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos alternativos..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="border rounded-lg mt-2 max-h-40 overflow-y-auto">
                  {searchResults.map((item, i) => (
                    <button
                      key={i}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex justify-between items-center"
                      onClick={() => {
                        setSelectedSuggestions(prev => [...prev, item]);
                        setSearchQuery('');
                      }}
                    >
                      <span>{item.name}</span>
                      <span className="text-xs text-primary font-bold">{formatPrice(item.price)}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedSuggestions.length > 0 && (
                <div className="mt-2 space-y-1">
                  {selectedSuggestions.map((s, i) => (
                    <div key={i} className="flex items-center justify-between bg-muted rounded px-3 py-1.5 text-sm">
                      <span>{s.name} — {formatPrice(s.price)}</span>
                      <button className="text-red-500 text-xs" onClick={() => setSelectedSuggestions(prev => prev.filter((_, idx) => idx !== i))}>
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={handleSendUnavailable} variant="destructive" className="w-full">
              Enviar respuesta
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

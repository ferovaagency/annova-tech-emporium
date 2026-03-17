import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Legal() {
  return (
    <main className="py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bebas text-center mb-8">Información <span className="text-primary">Legal</span></h1>

        <Tabs defaultValue="terminos">
          <TabsList className="w-full justify-start flex-wrap">
            <TabsTrigger value="terminos">Términos y Condiciones</TabsTrigger>
            <TabsTrigger value="datos">Tratamiento de Datos</TabsTrigger>
            <TabsTrigger value="cookies">Política de Cookies</TabsTrigger>
          </TabsList>

          <TabsContent value="terminos" className="mt-8 prose prose-slate max-w-none">
            <h2 className="text-2xl font-bebas">Términos y Condiciones — AnnovaSoft</h2>
            <ol className="space-y-4 list-decimal pl-5 text-muted-foreground leading-relaxed">
              <li>Al usar el sitio aceptas estos términos. Titular: <strong className="text-foreground">Annova Software y Accesorios SAS</strong>, Av. Cra 15 #79-65, Bogotá.</li>
              <li><strong className="text-foreground">Proceso de compra:</strong> productos sujetos a confirmación de disponibilidad por asesor comercial. Precios en COP con IVA incluido. Pagos procesados por Wompi (plataforma certificada Bancolombia).</li>
              <li><strong className="text-foreground">Envíos:</strong> 2-5 días hábiles Bogotá, 5-10 días hábiles resto de Colombia. Cliente responsable de suministrar dirección correcta y completa.</li>
              <li><strong className="text-foreground">Devoluciones:</strong> 15 días hábiles desde la entrega. Producto debe estar en perfectas condiciones con empaque original. Solicitar en ventas@annovasoft.co</li>
              <li><strong className="text-foreground">Garantías:</strong> 12 meses directamente con el fabricante sobre factura de compra.</li>
              <li><strong className="text-foreground">Ley aplicable:</strong> legislación colombiana. Jurisdicción: Bogotá, Colombia.</li>
            </ol>
          </TabsContent>

          <TabsContent value="datos" className="mt-8 prose prose-slate max-w-none">
            <h2 className="text-2xl font-bebas">Política de Tratamiento de Datos — AnnovaSoft</h2>
            <p className="text-sm text-muted-foreground italic">Conforme a la Ley 1581 de 2012 y Decreto 1074 de 2015</p>
            <ol className="space-y-4 list-decimal pl-5 text-muted-foreground leading-relaxed">
              <li><strong className="text-foreground">Responsable:</strong> Annova Software y Accesorios SAS, Av. Cra 15 #79-65, Bogotá. ventas@annovasoft.co</li>
              <li><strong className="text-foreground">Datos recopilados:</strong> nombre completo, email, teléfono, dirección de entrega, historial de pedidos.</li>
              <li><strong className="text-foreground">Finalidad:</strong> procesar pedidos, enviar confirmaciones, mejorar el servicio y ejecutar campañas de comunicación comercial.</li>
            </ol>

            <div className="my-6 p-4 rounded-lg border-l-4" style={{ backgroundColor: '#FEFCE8', borderLeftColor: '#CA8A04', color: '#422006' }}>
              <p className="font-bold mb-2">AUTORIZACIÓN EXPRESA</p>
              <p className="text-sm leading-relaxed">
                Al registrarse, cotizar o realizar una compra en este sitio web, el usuario otorga autorización expresa e inequívoca a Annova Software y Accesorios SAS para contactarlo mediante mensajes de texto (SMS), mensajes de WhatsApp y correos electrónicos con información sobre sus pedidos, novedades del catálogo, promociones y comunicaciones comerciales. Esta autorización puede ser revocada en cualquier momento enviando una solicitud a ventas@annovasoft.co
              </p>
            </div>

            <ol start={5} className="space-y-4 list-decimal pl-5 text-muted-foreground leading-relaxed">
              <li><strong className="text-foreground">Derechos del titular:</strong> conocer, actualizar, rectificar y solicitar supresión de sus datos personales.</li>
              <li><strong className="text-foreground">Seguridad:</strong> datos almacenados en servidores seguros. No se venden ni transfieren a terceros sin consentimiento explícito.</li>
            </ol>
          </TabsContent>

          <TabsContent value="cookies" className="mt-8 prose prose-slate max-w-none">
            <h2 className="text-2xl font-bebas">Política de Cookies — AnnovaSoft</h2>
            <ol className="space-y-4 list-decimal pl-5 text-muted-foreground leading-relaxed">
              <li>Usamos <strong className="text-foreground">cookies técnicas esenciales</strong> (carrito de compras, sesión de usuario, preferencias) y <strong className="text-foreground">cookies analíticas</strong> (Google Analytics 4, ID: G-TN29PR2MD9) para medir el tráfico y mejorar la experiencia.</li>
              <li>No utilizamos cookies de publicidad de terceros ni rastreamos datos personales identificables a través de cookies.</li>
              <li>Puedes desactivar las cookies desde la configuración de tu navegador, aunque algunas funcionalidades del sitio pueden verse afectadas.</li>
              <li>Para más información: <strong className="text-foreground">ventas@annovasoft.co</strong></li>
            </ol>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

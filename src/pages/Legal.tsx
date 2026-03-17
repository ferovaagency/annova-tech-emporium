import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Legal() {
  return (
    <main className="py-12">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="prose max-w-none">
          <Tabs defaultValue="terminos">
            <TabsList className="w-full justify-start flex-wrap">
              <TabsTrigger value="terminos">Términos y Condiciones</TabsTrigger>
              <TabsTrigger value="datos">Tratamiento de Datos</TabsTrigger>
              <TabsTrigger value="cookies">Política de Cookies</TabsTrigger>
            </TabsList>

            <TabsContent value="terminos" className="mt-8 prose prose-slate max-w-none">
              <h1>Términos y Condiciones — AnnovaSoft</h1>
              <ol>
                <li>Al usar el sitio aceptas estos términos. Titular: Annova Software y Accesorios SAS, Cra 15 # 76-53 Oficina 204, Bogotá.</li>
                <li>Proceso de compra: productos sujetos a confirmación de disponibilidad por asesor comercial. Precios en COP con IVA incluido. Pagos procesados por Wompi.</li>
                <li>Envíos: 2-5 días hábiles Bogotá, 5-10 días hábiles resto de Colombia. Cliente responsable de suministrar dirección correcta y completa.</li>
                <li>Devoluciones: 15 días hábiles desde la entrega. Producto debe estar en perfectas condiciones con empaque original. Solicitar en ventas@annovasoft.co</li>
                <li>Garantías: 12 meses directamente con el fabricante sobre factura de compra.</li>
                <li>Ley aplicable: legislación colombiana. Jurisdicción: Bogotá, Colombia.</li>
              </ol>
            </TabsContent>

            <TabsContent value="datos" className="mt-8 prose prose-slate max-w-none">
              <h1>Política de Tratamiento de Datos — AnnovaSoft</h1>
              <p>Conforme a la Ley 1581 de 2012 y Decreto 1074 de 2015</p>
              <ol>
                <li>Responsable: Annova Software y Accesorios SAS, Cra 15 # 76-53 Oficina 204, Bogotá. ventas@annovasoft.co</li>
                <li>Datos recopilados: nombre completo, email, teléfono, dirección de entrega, historial de pedidos.</li>
                <li>Finalidad: procesar pedidos, enviar confirmaciones, mejorar el servicio y ejecutar campañas de comunicación comercial.</li>
              </ol>
              <div className="bg-muted border border-primary/30 rounded-lg p-4 my-6">
                <p className="font-semibold">AUTORIZACIÓN EXPRESA</p>
                <p>Al registrarse, cotizar o realizar una compra en este sitio web, el usuario otorga autorización expresa e inequívoca a Annova Software y Accesorios SAS para contactarlo mediante SMS, WhatsApp y correo electrónico con información sobre sus pedidos, novedades del catálogo, promociones y comunicaciones comerciales. Esta autorización puede ser revocada en cualquier momento escribiendo a ventas@annovasoft.co</p>
              </div>
              <ol start={5}>
                <li>Derechos del titular: conocer, actualizar, rectificar y solicitar supresión de sus datos personales.</li>
                <li>Seguridad: datos almacenados en servidores seguros. No se venden ni transfieren a terceros sin consentimiento explícito.</li>
              </ol>
            </TabsContent>

            <TabsContent value="cookies" className="mt-8 prose prose-slate max-w-none">
              <h1>Política de Cookies — AnnovaSoft</h1>
              <ol>
                <li>Usamos cookies técnicas esenciales y cookies analíticas de Google Analytics 4 (G-TN29PR2MD9) para medir tráfico y mejorar la experiencia.</li>
                <li>No utilizamos cookies de publicidad de terceros ni rastreamos datos personales identificables a través de cookies.</li>
                <li>Puedes desactivar las cookies desde la configuración de tu navegador, aunque algunas funcionalidades del sitio pueden verse afectadas.</li>
                <li>Para más información: ventas@annovasoft.co</li>
              </ol>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}

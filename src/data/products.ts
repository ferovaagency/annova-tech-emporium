export type ProductCondition = "Nuevo" | "Reacondicionado";

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  oldPrice?: number;
  image: string;
  images: string[];
  category: string;
  categorySlug: string;
  brand: string;
  condition: ProductCondition;
  badge?: "Oferta" | "Nuevo" | "Reacondicionado" | "Más vendido";
  shortDescription: string;
  description: string;
  specs: Record<string, string>;
  featured?: boolean;
  bestSeller?: boolean;
  rating: number;
  reviews: number;
}

export interface Category {
  name: string;
  slug: string;
  icon: string;
  description: string;
  image: string;
}

export const categories: Category[] = [
  { name: "Software y Licencias", slug: "software-licencias", icon: "💿", description: "Licencias corporativas, Windows, Microsoft 365, antivirus y más", image: "https://images.unsplash.com/photo-1607799279861-4dd421887fc9?w=400&h=300&fit=crop" },
  { name: "Servidores", slug: "servidores", icon: "🖥️", description: "Servidores empresariales y soluciones para datacenter", image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop" },
  { name: "UPS y Energía", slug: "ups-energia", icon: "🔋", description: "UPS empresariales y soluciones de respaldo energético", image: "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=400&h=300&fit=crop" },
  { name: "Infraestructura Tecnológica", slug: "infraestructura", icon: "🌐", description: "Equipos de red y soluciones tecnológicas empresariales", image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=300&fit=crop" },
  { name: "Computadores Nuevos", slug: "computadores-nuevos", icon: "💻", description: "Portátiles y equipos de escritorio nuevos", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop" },
  { name: "Computadores Reacondicionados", slug: "computadores-reacondicionados", icon: "♻️", description: "Equipos reacondicionados con garantía empresarial", image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&h=300&fit=crop" },
];

export const products: Product[] = [
  {
    id: "1", name: "Microsoft 365 Empresa Estándar", slug: "microsoft-365-empresa-estandar", price: 389900, image: "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=400&h=400&fit=crop", images: ["https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=800&h=800&fit=crop"], category: "Software y Licencias", categorySlug: "software-licencias", brand: "Microsoft", condition: "Nuevo", badge: "Más vendido", shortDescription: "Licencia anual Microsoft 365 para empresas con apps de Office completas.", description: "Microsoft 365 Empresa Estándar incluye las versiones de escritorio de Word, Excel, PowerPoint, Outlook, Teams y más. Ideal para equipos empresariales que necesitan productividad y colaboración en la nube.", specs: { "Tipo": "Licencia anual", "Usuarios": "1 usuario", "Apps": "Word, Excel, PowerPoint, Outlook, Teams", "Almacenamiento": "1 TB OneDrive", "Plataforma": "Windows, Mac, Web, Móvil" }, featured: true, bestSeller: true, rating: 4.8, reviews: 124,
  },
  {
    id: "2", name: "Windows 11 Pro - Licencia Digital", slug: "windows-11-pro", price: 599900, image: "https://images.unsplash.com/photo-1624571395775-f5ee77483c2a?w=400&h=400&fit=crop", images: ["https://images.unsplash.com/photo-1624571395775-f5ee77483c2a?w=800&h=800&fit=crop"], category: "Software y Licencias", categorySlug: "software-licencias", brand: "Microsoft", condition: "Nuevo", badge: "Nuevo", shortDescription: "Licencia digital permanente de Windows 11 Pro.", description: "Windows 11 Pro ofrece todas las funciones de Windows 11 Home más herramientas empresariales como BitLocker, escritorio remoto, Hyper-V y gestión de políticas de grupo.", specs: { "Tipo": "Licencia perpetua", "Versión": "Windows 11 Pro", "Arquitectura": "64-bit", "Idioma": "Multiidioma", "Activación": "Digital" }, featured: true, rating: 4.7, reviews: 89,
  },
  {
    id: "3", name: "Kaspersky Endpoint Security", slug: "kaspersky-endpoint-security", price: 189900, oldPrice: 249900, image: "https://images.unsplash.com/photo-1563206767-5b18f218e8de?w=400&h=400&fit=crop", images: ["https://images.unsplash.com/photo-1563206767-5b18f218e8de?w=800&h=800&fit=crop"], category: "Software y Licencias", categorySlug: "software-licencias", brand: "Kaspersky", condition: "Nuevo", badge: "Oferta", shortDescription: "Protección avanzada para endpoints empresariales.", description: "Kaspersky Endpoint Security ofrece protección multicapa contra amenazas avanzadas, ransomware y ataques dirigidos para empresas.", specs: { "Tipo": "Suscripción anual", "Dispositivos": "10 endpoints", "Protección": "Antimalware, firewall, control web", "Consola": "Cloud o local", "Soporte": "24/7" }, featured: true, rating: 4.5, reviews: 67,
  },
  {
    id: "4", name: "Servidor Dell PowerEdge T350", slug: "dell-poweredge-t350", price: 8499900, image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=400&fit=crop", images: ["https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=800&fit=crop"], category: "Servidores", categorySlug: "servidores", brand: "Dell", condition: "Nuevo", badge: "Nuevo", shortDescription: "Servidor torre ideal para PYMES y oficinas remotas.", description: "El Dell PowerEdge T350 es un servidor torre diseñado para cargas de trabajo empresariales con procesador Intel Xeon, ideal para archivos, correo y aplicaciones empresariales.", specs: { "Procesador": "Intel Xeon E-2300", "RAM": "16 GB DDR4 ECC", "Almacenamiento": "2 TB HDD SATA", "RAID": "PERC H355", "Fuente": "600W redundante" }, featured: true, bestSeller: true, rating: 4.9, reviews: 34,
  },
  {
    id: "5", name: "UPS APC Smart-UPS 3000VA", slug: "ups-apc-3000va", price: 3299900, oldPrice: 3799900, image: "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=400&h=400&fit=crop", images: ["https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=800&h=800&fit=crop"], category: "UPS y Energía", categorySlug: "ups-energia", brand: "APC", condition: "Nuevo", badge: "Oferta", shortDescription: "UPS de línea interactiva para servidores y equipos críticos.", description: "El APC Smart-UPS 3000VA proporciona energía de respaldo confiable para servidores, switches y equipos de red críticos en entornos empresariales.", specs: { "Potencia": "3000 VA / 2700 W", "Tipo": "Línea interactiva", "Autonomía": "10 min a media carga", "Conexiones": "8 salidas IEC", "Formato": "Rack/Torre" }, featured: true, rating: 4.6, reviews: 45,
  },
  {
    id: "6", name: "Switch Cisco Catalyst 1000-24T", slug: "cisco-catalyst-1000", price: 2149900, image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=400&fit=crop", images: ["https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&h=800&fit=crop"], category: "Infraestructura Tecnológica", categorySlug: "infraestructura", brand: "Cisco", condition: "Nuevo", shortDescription: "Switch gestionado de 24 puertos para redes empresariales.", description: "El Cisco Catalyst 1000-24T es un switch gestionado de capa 2 con 24 puertos Gigabit Ethernet, ideal para redes empresariales de pequeño y mediano tamaño.", specs: { "Puertos": "24x GbE + 4x SFP", "Tipo": "Gestionado L2", "PoE": "No", "Montaje": "Rack 1U", "Garantía": "Limitada de por vida" }, rating: 4.4, reviews: 28,
  },
  {
    id: "7", name: "Lenovo ThinkPad E14 Gen 5", slug: "lenovo-thinkpad-e14", price: 3899900, image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop", images: ["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop"], category: "Computadores Nuevos", categorySlug: "computadores-nuevos", brand: "Lenovo", condition: "Nuevo", badge: "Más vendido", shortDescription: "Portátil empresarial con procesador Intel Core i5 de 13a generación.", description: "El Lenovo ThinkPad E14 Gen 5 ofrece rendimiento empresarial con diseño duradero, teclado ergonómico y seguridad biométrica. Ideal para profesionales en movimiento.", specs: { "Procesador": "Intel Core i5-1335U", "RAM": "16 GB DDR4", "Almacenamiento": "512 GB SSD NVMe", "Pantalla": "14\" FHD IPS", "SO": "Windows 11 Pro" }, featured: true, bestSeller: true, rating: 4.7, reviews: 156,
  },
  {
    id: "8", name: "HP EliteDesk 800 G6 Mini", slug: "hp-elitedesk-800-g6", price: 4299900, image: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=400&h=400&fit=crop", images: ["https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800&h=800&fit=crop"], category: "Computadores Nuevos", categorySlug: "computadores-nuevos", brand: "HP", condition: "Nuevo", shortDescription: "Mini PC empresarial de alto rendimiento.", description: "El HP EliteDesk 800 G6 Mini es un mini PC compacto y potente diseñado para espacios de trabajo empresariales que demandan rendimiento y seguridad.", specs: { "Procesador": "Intel Core i7-10700", "RAM": "16 GB DDR4", "Almacenamiento": "512 GB SSD", "Gráficos": "Intel UHD 630", "SO": "Windows 11 Pro" }, rating: 4.5, reviews: 42,
  },
  {
    id: "9", name: "Dell Latitude 5420 Reacondicionado", slug: "dell-latitude-5420-reacondicionado", price: 1899900, oldPrice: 3200000, image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&h=400&fit=crop", images: ["https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&h=800&fit=crop"], category: "Computadores Reacondicionados", categorySlug: "computadores-reacondicionados", brand: "Dell", condition: "Reacondicionado", badge: "Reacondicionado", shortDescription: "Portátil empresarial reacondicionado con garantía de 1 año.", description: "Dell Latitude 5420 reacondicionado en excelente estado. Incluye 1 año de garantía empresarial. Ideal para empresas que buscan equipos confiables a precios competitivos.", specs: { "Procesador": "Intel Core i5-1135G7", "RAM": "8 GB DDR4", "Almacenamiento": "256 GB SSD", "Pantalla": "14\" FHD", "Condición": "Grado A - Excelente" }, featured: true, rating: 4.3, reviews: 78,
  },
  {
    id: "10", name: "HP ProBook 450 G8 Reacondicionado", slug: "hp-probook-450-g8-reacondicionado", price: 1649900, oldPrice: 2900000, image: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=400&fit=crop", images: ["https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&h=800&fit=crop"], category: "Computadores Reacondicionados", categorySlug: "computadores-reacondicionados", brand: "HP", condition: "Reacondicionado", badge: "Oferta", shortDescription: "Portátil HP reacondicionado, ideal para oficinas.", description: "HP ProBook 450 G8 en excelente estado de reacondicionamiento. Perfecto para entornos de oficina que necesitan equipos productivos a menor costo.", specs: { "Procesador": "Intel Core i5-1135G7", "RAM": "8 GB DDR4", "Almacenamiento": "256 GB SSD", "Pantalla": "15.6\" FHD", "Condición": "Grado A" }, bestSeller: true, rating: 4.4, reviews: 92,
  },
  {
    id: "11", name: "Windows Server 2022 Standard", slug: "windows-server-2022", price: 2899900, image: "https://images.unsplash.com/photo-1607799279861-4dd421887fc9?w=400&h=400&fit=crop", images: ["https://images.unsplash.com/photo-1607799279861-4dd421887fc9?w=800&h=800&fit=crop"], category: "Software y Licencias", categorySlug: "software-licencias", brand: "Microsoft", condition: "Nuevo", shortDescription: "Licencia de Windows Server 2022 Standard para empresas.", description: "Windows Server 2022 Standard ofrece innovaciones en seguridad, nube híbrida y plataforma de aplicaciones para cargas de trabajo empresariales.", specs: { "Tipo": "Licencia perpetua", "Versión": "Standard", "CALs": "No incluidas", "Cores": "16 cores", "Virtualización": "2 VMs" }, rating: 4.6, reviews: 31,
  },
  {
    id: "12", name: "Servidor HPE ProLiant DL380 Gen10", slug: "hpe-proliant-dl380", price: 12999900, image: "https://images.unsplash.com/photo-1597852074816-d933c7d2b988?w=400&h=400&fit=crop", images: ["https://images.unsplash.com/photo-1597852074816-d933c7d2b988?w=800&h=800&fit=crop"], category: "Servidores", categorySlug: "servidores", brand: "HPE", condition: "Nuevo", badge: "Nuevo", shortDescription: "Servidor rack de alto rendimiento para datacenters.", description: "El HPE ProLiant DL380 Gen10 es el servidor rack más vendido del mundo, ofreciendo rendimiento, seguridad y expansión ideales para datacenters empresariales.", specs: { "Procesador": "2x Intel Xeon Scalable", "RAM": "64 GB DDR4 ECC", "Almacenamiento": "4x 1.2TB SAS", "RAID": "HPE Smart Array", "Formato": "Rack 2U" }, rating: 4.9, reviews: 22,
  },
  {
    id: "13", name: "UPS CyberPower 1500VA", slug: "cyberpower-1500va", price: 899900, image: "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=400&h=400&fit=crop", images: ["https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=800&h=800&fit=crop"], category: "UPS y Energía", categorySlug: "ups-energia", brand: "CyberPower", condition: "Nuevo", shortDescription: "UPS para estaciones de trabajo y equipos de oficina.", description: "CyberPower 1500VA ofrece protección confiable de energía para estaciones de trabajo, equipos de red pequeños y periféricos de oficina.", specs: { "Potencia": "1500 VA / 900 W", "Tipo": "Línea interactiva", "Autonomía": "8 min a plena carga", "Conexiones": "6 salidas", "USB": "Sí" }, rating: 4.3, reviews: 55,
  },
];

export const blogPosts = [
  {
    id: "1", slug: "guia-licencias-microsoft-empresas", title: "Guía Completa: Licencias Microsoft para Empresas en 2025", excerpt: "Descubre cómo elegir el plan de licenciamiento Microsoft ideal para tu empresa. Comparamos Microsoft 365, Windows y Server.", image: "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=800&h=400&fit=crop", date: "2025-02-10", author: "Equipo Annova", content: "El licenciamiento corporativo de Microsoft puede parecer complejo, pero elegir el plan correcto es fundamental para la productividad de tu empresa. En esta guía te explicamos las diferencias entre Microsoft 365 Empresa Básico, Estándar y Premium, así como las opciones de licenciamiento por volumen para Windows y Windows Server.\n\n## Microsoft 365 para Empresas\n\nMicrosoft 365 ofrece tres planes principales para empresas:\n\n- **Empresa Básico**: Versiones web de Office, correo empresarial con Exchange, Teams y 1 TB de almacenamiento en OneDrive.\n- **Empresa Estándar**: Todo lo de Básico más las aplicaciones de escritorio de Office (Word, Excel, PowerPoint, Outlook).\n- **Empresa Premium**: Todo lo de Estándar más seguridad avanzada, gestión de dispositivos con Intune y protección contra amenazas.\n\n## Recomendaciones\n\nPara empresas de menos de 50 empleados, recomendamos Empresa Estándar como el mejor balance entre funcionalidades y costo. Para empresas con requisitos de seguridad estrictos o que manejan datos sensibles, Premium es la opción ideal.",
  },
  {
    id: "2", slug: "ventajas-equipos-reacondicionados", title: "5 Ventajas de Comprar Equipos Reacondicionados para tu Empresa", excerpt: "Los equipos reacondicionados ofrecen una excelente relación costo-beneficio sin sacrificar rendimiento. Conoce por qué cada vez más empresas los eligen.", image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&h=400&fit=crop", date: "2025-01-28", author: "Equipo Annova", content: "Los equipos de cómputo reacondicionados se han convertido en una opción inteligente para empresas que buscan optimizar su presupuesto tecnológico sin sacrificar rendimiento ni confiabilidad.\n\n## 1. Ahorro significativo\n\nLos equipos reacondicionados pueden costar hasta un 60% menos que un equipo nuevo equivalente. Para empresas que necesitan equipar múltiples estaciones de trabajo, esto representa un ahorro considerable.\n\n## 2. Rendimiento comprobado\n\nMarcas como Dell, HP y Lenovo fabrican equipos empresariales diseñados para durar. Un equipo de 2-3 años de antigüedad aún ofrece un rendimiento más que suficiente para tareas de oficina.\n\n## 3. Garantía empresarial\n\nEn Annova, todos nuestros equipos reacondicionados incluyen garantía de 1 año, pruebas de calidad certificadas y soporte técnico dedicado.\n\n## 4. Sostenibilidad\n\nAl reutilizar equipos, tu empresa contribuye a la reducción de residuos electrónicos.\n\n## 5. Disponibilidad inmediata\n\nA diferencia de equipos nuevos que pueden tener semanas de espera, los reacondicionados están disponibles para entrega inmediata.",
  },
  {
    id: "3", slug: "importancia-ups-empresarial", title: "¿Por qué tu Empresa Necesita un UPS? Guía de Protección Eléctrica", excerpt: "Protege tus equipos y datos críticos con la solución de UPS adecuada. Te explicamos cómo elegir el respaldo energético correcto.", image: "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=800&h=400&fit=crop", date: "2025-01-15", author: "Equipo Annova", content: "Los cortes de energía y las fluctuaciones eléctricas pueden causar pérdida de datos, daño a equipos y tiempos de inactividad costosos. Un UPS (Sistema de Alimentación Ininterrumpida) es la primera línea de defensa para tu infraestructura tecnológica.\n\n## Tipos de UPS\n\n- **Standby**: Para estaciones de trabajo individuales. Económico y básico.\n- **Línea Interactiva**: Para servidores pequeños y equipos de red. Ofrece regulación de voltaje.\n- **Online (Doble Conversión)**: Para datacenters y equipos críticos. Protección total.\n\n## ¿Cómo dimensionar tu UPS?\n\nCalcula la potencia total de los equipos que deseas proteger en watts y selecciona un UPS con al menos un 30% de margen adicional.",
  },
];

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);
}

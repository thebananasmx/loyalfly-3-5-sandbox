import React, { useEffect } from 'react';

const FeatureTag: React.FC<{ type: 'new' | 'improvement' }> = ({ type }) => {
    const isNew = type === 'new';
    const bgColor = isNew ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
    const text = isNew ? 'Nuevo' : 'Mejora';
    return (
        <span className={`inline-block px-2 py-0.5 text-sm font-medium rounded-full ${bgColor}`}>
            {text}
        </span>
    );
};

const ChangelogPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Log de Versiones | Docs | Loyalfly';
  }, []);

  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl font-extrabold text-black mb-4 tracking-tight">Log de Versiones</h1>
      <p className="text-lg text-gray-600 mb-12">
        Un historial de todas las mejoras y nuevas funcionalidades que hemos agregado a Loyalfly para ayudarte a crecer.
      </p>

      {/* --- VERSION v3.5.0.20 --- */}
      <section className="mb-12">
        <div className="pb-4 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-black">Versión 3.5.0.20</h2>
          <p className="text-base text-gray-500 mt-1">Lanzada el 30 de Diciembre de 2025</p>
        </div>
        
        <ul className="mt-8 space-y-6">
           <li className="flex items-start gap-4">
              <FeatureTag type="new" />
              <div>
                  <h3 className="font-semibold text-black">Selector de Rango de Fechas Inteligente (Estilo Google Analytics)</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha reemplazado el selector de granularidad fija por un selector de rango de fechas dinámico. El sistema ajusta automáticamente la visualización (por Día o por Mes) basándose en la amplitud del periodo seleccionado para mantener la claridad de los datos.
                  </p>
              </div>
          </li>
           <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Sincronización Total y Eliminación de Deformación en Gráficas</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha implementado un sistema de coordenadas unificado basado en porcentajes que garantiza que los puntos y las líneas de la gráfica coincidan con precisión matemática. Además, se migraron los marcadores a elementos independientes para asegurar que los círculos se mantengan perfectamente redondos y sólidos en cualquier resolución o dispositivo.
                  </p>
              </div>
          </li>
           <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Orden Cronológico Estricto</h3>
                  <p className="text-gray-600 mt-1">
                      Se optimizó la lógica de procesamiento de datos para asegurar que la línea de tiempo siempre fluya correctamente de pasado a presente (izquierda a derecha), eliminando inconsistencias visuales en el eje X.
                  </p>
              </div>
          </li>
        </ul>
      </section>
      
      {/* --- VERSION v3.5.0.19 --- */}
      <section className="mb-12">
        <div className="pb-4 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-black">Versión 3.5.0.19</h2>
          <p className="text-base text-gray-500 mt-1">Lanzada el 25 de Octubre de 2025</p>
        </div>
        
        <ul className="mt-8 space-y-6">
           <li className="flex items-start gap-4">
              <FeatureTag type="new" />
              <div>
                  <h3 className="font-semibold text-black">Banner de Confianza y Estadísticas Globales</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha incorporado un nuevo componente "Trust Banner" en la página de inicio. Este banner muestra en tiempo real estadísticas agregadas de la plataforma (total de negocios, sellos otorgados y recompensas entregadas) para generar confianza y mostrar el crecimiento de la comunidad Loyalfly.
                  </p>
              </div>
          </li>
           <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Internacionalización Completa (ES, EN, PT)</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha completado la traducción de la plataforma. Ahora, las secciones de <strong>Registro</strong>, <strong>Editor de Tarjeta</strong>, el panel de <strong>Métricas</strong>, la gestión de <strong>Encuestas</strong> y el <strong>Pie de Página</strong> están disponibles nativamente en Español, Inglés y Portugués, adaptándose a la preferencia del usuario.
                  </p>
              </div>
          </li>
        </ul>
      </section>

      {/* --- VERSION v3.5.0.18 --- */}
      <section className="mb-12">
        <div className="pb-4 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-black">Versión 3.5.0.18</h2>
          <p className="text-base text-gray-500 mt-1">Lanzada el 24 de Octubre de 2025</p>
        </div>
        
        <ul className="mt-8 space-y-6">
           <li className="flex items-start gap-4">
              <FeatureTag type="new" />
              <div>
                  <h3 className="font-semibold text-black">Vista de Detalle de Negocio para Super Admin</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha habilitado una página de detalle en el panel de administración global. Al seleccionar un negocio, el administrador puede visualizar la configuración de la tarjeta de lealtad renderizada con datos reales del primer cliente, así como consultar la lista completa de clientes registrados (nombre, teléfono, email y sellos) en modo de solo lectura.
                  </p>
              </div>
          </li>
           <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Actualización en Página de Precios</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha actualizado la tarjeta del plan "Entrepreneur" en la página de precios para destacar que este nivel permite eliminar el botón promocional "Únete a Loyalfly" de las tarjetas digitales de los clientes, ofreciendo una apariencia más profesional y exclusiva.
                  </p>
              </div>
          </li>
        </ul>
      </section>

      {/* --- VERSION v3.5.0.17 --- */}
      <section className="mb-12">
        <div className="pb-4 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-black">Versión 3.5.0.17</h2>
          <p className="text-base text-gray-500 mt-1">Lanzada el 23 de Octubre de 2025</p>
        </div>
        
        <ul className="mt-8 space-y-6">
           <li className="flex items-start gap-4">
              <FeatureTag type="new" />
              <div>
                  <h3 className="font-semibold text-black">Nueva Página de Ajustes de Cuenta</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha añadido una nueva sección de "Ajustes de Cuenta", accesible desde el menú desplegable del usuario en la barra lateral. Esta página permite a los dueños de negocios ver la información principal de su cuenta y gestionar la seguridad, incluyendo una funcionalidad segura para cambiar su contraseña de acceso.
                  </p>
              </div>
          </li>
           <li className="flex items-start gap-4">
              <FeatureTag type="new" />
              <div>
                  <h3 className="font-semibold text-black">Página de KPIs para Super Administrador</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha añadido una nueva página de Indicadores Clave de Rendimiento (KPIs) al panel de Super Administración. Esta sección centraliza métricas globales de la plataforma, como el número total de negocios, clientes, sellos y recompensas. Incluye una gráfica de pastel para visualizar la distribución de negocios por plan de suscripción y una tabla con los negocios más destacados para un análisis estratégico.
                  </p>
              </div>
          </li>
           <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Rediseño Interactivo y Funcional de la Gráfica de Crecimiento</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha rediseñado por completo la gráfica en la página de Métricas. Ahora, con un tema blanco y morado alineado a la marca, muestra el "Crecimiento de Nuevos Clientes por Mes". Se mejoró su usabilidad con barras más anchas y un efecto de resaltado al pasar el cursor sobre la columna del mes. Además, se añadió una tarjeta flotante (`tooltip`) que muestra los datos exactos del mes, unificando la interacción para una experiencia más limpia e intuitiva.
                  </p>
              </div>
          </li>
           <li className="flex items-start gap-4">
              <FeatureTag type="new" />
              <div>
                  <h3 className="font-semibold text-black">Panel de Métricas Clave (KPIs)</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha introducido una nueva sección de "Métricas" en el panel de administración. Ahora los dueños de negocios pueden visualizar KPIs fundamentales como el total de clientes, sellos otorgados, recompensas canjeadas y la tasa de redención. Además, incluye una gráfica de crecimiento de clientes y una tabla con los clientes más leales para un análisis rápido y efectivo del programa.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Animaciones Suaves en Navegación</h3>
                  <p className="text-gray-600 mt-1">
                      Para mejorar la experiencia de usuario, se ha implementado un efecto de difuminado ('fade-in') al navegar entre las diferentes secciones del panel de administración. Este cambio proporciona una sensación de carga más fluida y profesional.
                  </p>
              </div>
          </li>
           <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Optimización del Botón de Suscripción en Planes de Pago</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha refinado el proceso de suscripción para el plan "Entrepreneur". El botón, ahora con el texto "Suscribirse", es un enlace directo a la página de pago segura de Stripe, abriéndose en una nueva pestaña para una experiencia de usuario más fluida y sin interrupciones.
                  </p>
              </div>
          </li>
        </ul>
      </section>

      {/* --- VERSION v3.5.0.16 --- */}
      <section className="mb-12">
        <div className="pb-4 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-black">Versión 3.5.0.16</h2>
          <p className="text-base text-gray-500 mt-1">Lanzada el 22 de Octubre de 2025</p>
        </div>
        
        <ul className="mt-8 space-y-6">
           <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Reposicionamiento Estratégico de Notificaciones (Toasts)</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha reubicado el contenedor de notificaciones (toasts) a la esquina superior derecha en escritorio y a la parte superior central en móviles. Este cambio soluciona un problema de usabilidad donde el widget de chat cubría los mensajes importantes, garantizando ahora su total visibilidad.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Validación de Longitud en Campos de Teléfono</h3>
                  <p className="text-gray-600 mt-1">
                      Para mejorar la calidad de los datos y la experiencia de usuario, todos los campos de entrada de número de teléfono en la aplicación ahora están limitados a un máximo de 10 dígitos, previniendo errores de formato desde el inicio.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Mejora de Usabilidad con Scroll Automático</h3>
                  <p className="text-gray-600 mt-1">
                      Al consultar o registrar una tarjeta en la página pública (`/view/:slug`), la vista ahora se desplaza automáticamente a la parte superior de la página. Esto asegura que el cliente vea su tarjeta de lealtad de inmediato, sin necesidad de hacer scroll manual.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Optimización de la Estructura de Slugs en la Base de Datos</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha reestructurado la forma en que se almacenan los 'slugs' (URLs amigables) para negocios y artículos del blog. Ahora residen en colecciones dedicadas (`businessSlugs`, `blogSlugs`), lo que mejora drásticamente la eficiencia de las consultas, garantiza la unicidad de las URLs y optimiza la escalabilidad de la plataforma a largo plazo.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Enrutamiento Condicional para Compatibilidad de Entornos</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha implementado una lógica de enrutamiento "inteligente" para resolver el conflicto entre el entorno de vista previa de AI Studio y el sitio en producción. La aplicación ahora detecta la URL: si es un dominio de producción (`loyalfly.com.mx` o `vercel.app`), utiliza `BrowserRouter` para URLs limpias. Para cualquier otro entorno (como la vista previa), usa `HashRouter` por defecto, garantizando que la vista previa siempre funcione sin afectar las URLs del sitio publicado.
                  </p>
              </div>
          </li>
           <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Corrección en la Carga de Artículos del Blog</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha solucionado un problema que impedía que los artículos publicados se mostrasen en la página del blog. La corrección ajusta la forma en que se consultan los datos en Firestore, garantizando que todos los posts con estado "publicado" se carguen y muestren correctamente sin necesidad de configuraciones manuales en la base de datos.
                  </p>
              </div>
          </li>
           <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Solución de Bucle de Redirección en el Panel de Administración</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha corregido un error crítico que causaba un bucle de redirección infinito al intentar acceder a la ruta `/admin`, lo que impedía la carga del panel. El problema se resolvió ajustando la lógica de las rutas protegidas para dirigir correctamente a los usuarios no autorizados a la página de inicio de sesión del administrador.
                  </p>
              </div>
          </li>
        </ul>
      </section>

      {/* --- VERSION v3.5.0.15 --- */}
      <section className="mb-12">
        <div className="pb-4 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-black">Versión 3.5.0.15</h2>
          <p className="text-base text-gray-500 mt-1">Lanzada el 21 de Octubre de 2025</p>
        </div>
        
        <ul className="mt-8 space-y-6">
           <li className="flex items-start gap-4">
              <FeatureTag type="new" />
              <div>
                  <h3 className="font-semibold text-black">Generación de Códigos QR Dinámicos para Clientes</h3>
                  <p className="text-gray-600 mt-1">
                      Cada tarjeta de cliente ahora incluye un código QR único y personal, generado dinámicamente con su ID. Este QR se crea como una imagen (tipo PNG/JPG), facilitando su guardado o compartición. Esta funcionalidad reemplaza al generador de QR externo y lo integra directamente en la plataforma.
                  </p>
              </div>
          </li>
           <li className="flex items-start gap-4">
              <FeatureTag type="new" />
              <div>
                  <h3 className="font-semibold text-black">Flujo Rápido de Sellos con Escáner QR en el Dashboard</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha introducido un botón "Escanear QR" en el dashboard que activa la cámara del dispositivo. Al escanear el QR de un cliente, el sistema lo identifica al instante y abre directamente el modal para añadir sellos, eliminando la necesidad de buscar manualmente y agilizando el servicio al cliente de forma espectacular.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Ajustes Estéticos al Código QR</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha refinado la apariencia del código QR en la tarjeta del cliente para una mejor integración visual. Se ajustó su tamaño a 120x120px y se encapsuló en un contenedor con un sutil margen y esquinas redondeadas, dándole un aspecto más pulido y estético dentro del diseño de la tarjeta.
                  </p>
              </div>
          </li>
        </ul>
      </section>

      {/* --- VERSION v3.5.0.14 --- */}
      <section className="mb-12">
        <div className="pb-4 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-black">Versión 3.5.0.14</h2>
          <p className="text-base text-gray-500 mt-1">Lanzada el 20 de Octubre de 2025</p>
        </div>
        
        <ul className="mt-8 space-y-6">
           <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Actualización del Widget de Chat en Vivo</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha reemplazado el widget de chat de Botpress por el de Tidio para mejorar la velocidad de respuesta, la fiabilidad y ofrecer una mejor experiencia de soporte en tiempo real a nuestros usuarios.
                  </p>
              </div>
          </li>
           <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Optimización de la Posición del Aviso de Cookies</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha ajustado la posición del banner de consentimiento de cookies. Ahora se muestra en la esquina inferior izquierda en pantallas de escritorio para evitar superponerse con widgets de chat, mientras que en dispositivos móviles mantiene su posición para una experiencia de usuario óptima.
                  </p>
              </div>
          </li>
           <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Rediseño Integral de la Tarjeta de Lealtad</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha rediseñado por completo la previsualización de la tarjeta de lealtad para hacerla más compacta, moderna y efectiva en dispositivos móviles. Los cambios incluyen un encabezado reorganizado, mayor prioridad visual para los sellos, información del cliente estructurada en columnas y un diseño unificado sin separadores para un look más limpio y profesional.
                  </p>
              </div>
          </li>
           <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Mejora Visual en los Sellos de la Tarjeta</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha reemplazado el ícono de "check" en los sellos de la tarjeta de lealtad por una estrella dorada y más grande. Este cambio mejora significativamente la visibilidad y el atractivo visual, haciendo que el progreso del cliente sea más claro, satisfactorio y gratificante.
                  </p>
              </div>
          </li>
           <li className="flex items-start gap-4">
              <FeatureTag type="new" />
              <div>
                  <h3 className="font-semibold text-black">Barra de Información Promocional en la Página de Inicio</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha añadido un banner llamativo en la parte superior de la página de inicio para incentivar el registro de nuevos usuarios. Incluye un mensaje comercial, un botón de llamado a la acción y es completamente descartable por el usuario para no ser intrusivo.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="new" />
              <div>
                  <h3 className="font-semibold text-black">Banner de Consentimiento de Cookies</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha implementado un banner de consentimiento de cookies discreto en la parte inferior del sitio para cumplir con las normativas de privacidad. El banner permite a los usuarios aceptar o rechazar el uso de cookies, y su preferencia se guarda en el navegador para no volver a mostrarlo en futuras visitas.
                  </p>
              </div>
          </li>
           <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Punto de Restauración Estable</h3>
                  <p className="text-gray-600 mt-1">
                      Esta versión marca un punto de restauración consolidado y estable. Se han afianzado todas las funcionalidades implementadas hasta la fecha, incluyendo la gestión de límites de clientes basada en planes de suscripción (Gratis, Entrepreneur) y las herramientas de importación y exportación masiva de clientes mediante archivos CSV. Esta base de código robusta y verificada sirve como un pilar fundamental para el desarrollo de futuras características.
                  </p>
              </div>
          </li>
        </ul>
      </section>

      {/* --- VERSION v3.5.0.13 --- */}
      <section className="mb-12">
        <div className="pb-4 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-black">Versión 3.5.0.13</h2>
          <p className="text-base text-gray-500 mt-1">Lanzada el 19 de Octubre de 2025</p>
        </div>
        
        <ul className="mt-8 space-y-6">
           <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Responsividad del Panel de Administración</h3>
                  <p className="text-gray-600 mt-1">
                      El panel de administración en `/admin/dashboard` ahora es completamente responsivo. Incorpora un menú de hamburguesa en pantallas pequeñas para mostrar y ocultar la barra lateral, replicando el diseño intuitivo del dashboard principal de la aplicación y asegurando una experiencia consistente en todos los dispositivos.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Optimización del Menú Móvil</h3>
                  <p className="text-gray-600 mt-1">
                      El menú de navegación móvil en la página de inicio ha sido completamente rediseñado para ser una experiencia de pantalla completa. Además, ahora muestra la versión compacta del logotipo (`logo_mob.svg`) para una mejor consistencia de marca en dispositivos pequeños.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Mejora del Encabezado de Escritorio</h3>
                  <p className="text-gray-600 mt-1">
                      Para mejorar la presencia de la marca, se ha aumentado la altura del encabezado en la vista de escritorio a 72px. Este cambio permite un logotipo más grande y visible, reforzando la identidad visual de la plataforma.
                  </p>
              </div>
          </li>
        </ul>
      </section>

      {/* --- VERSION v3.5.0.12 --- */}
      <section className="mb-12">
        <div className="pb-4 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-black">Versión 3.5.0.12</h2>
          <p className="text-base text-gray-500 mt-1">Lanzada el 18 de Octubre de 2025</p>
        </div>
        
        <ul className="mt-8 space-y-6">
           <li className="flex items-start gap-4">
              <FeatureTag type="new" />
              <div>
                  <h3 className="font-semibold text-black">Portal de Super Administración Centralizado</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha creado un portal de administración exclusivo y seguro en `/admin`. Este portal cuenta con su propio sistema de registro e inicio de sesión, y un dashboard centralizado que permite al administrador de la plataforma supervisar todos los negocios registrados, ver métricas clave (total de clientes, sellos, recompensas), gestionar planes de suscripción y eliminar negocios de forma segura.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="new" />
              <div>
                  <h3 className="font-semibold text-black">Documentación de Flujos de Usuario</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha añadido una nueva página a la sección de Documentación llamada "Flujos de Usuario". Esta guía mapea y describe en detalle todos los recorridos clave dentro de la plataforma, cubriendo las acciones del dueño del negocio, el cliente final y el super administrador para ofrecer una comprensión completa del funcionamiento de la aplicación.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Carrusel de Industrias Dinámico</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha actualizado el carrusel de la página de inicio para que cada industria muestre una imagen representativa diferente, mejorando el atractivo visual y la relevancia del contenido.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Optimización del Banner Principal para Móviles</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha ajustado el diseño del banner principal en dispositivos móviles para priorizar el mensaje. Ahora el texto y los botones de acción aparecen encima de la imagen en pantallas pequeñas, mejorando la jerarquía de la información.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Ajuste de Espaciado en la Página de Inicio</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha reducido el margen superior del banner principal para disminuir el espacio en blanco entre este y el encabezado, creando un diseño más compacto y visualmente cohesivo.
                  </p>
              </div>
          </li>
           <li className="flex items-start gap-4">
              <FeatureTag type="new" />
              <div>
                  <h3 className="font-semibold text-black">Módulo de Encuestas para Clientes</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha introducido una nueva funcionalidad de encuestas para aumentar la interacción con el cliente. Los dueños de negocios ahora pueden activar una encuesta simple de dos opciones desde el panel de administración. Cuando está activa, los clientes ven un banner en su tarjeta digital que los invita a votar a cambio de un sello extra. El sistema gestiona todo el flujo, desde la votación en una página dedicada hasta la adición automática del sello de recompensa.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Gestión y Análisis de Encuestas</h3>
                  <p className="text-gray-600 mt-1">
                      El nuevo módulo de encuestas en el panel de administración permite una gestión completa. Los negocios pueden personalizar el mensaje del banner, la pregunta y las dos respuestas. Además, se ha añadido una sección de resultados en tiempo real que muestra el total de votos y un desglose porcentual para cada opción, proporcionando información valiosa sobre la opinión del cliente de forma instantánea. La integración con Firestore asegura que las respuestas se almacenen de forma segura y se asocien correctamente con cada encuesta.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Carga de Logos desde Fuente Externa</h3>
                  <p className="text-gray-600 mt-1">
                      Para mejorar la mantenibilidad y agilizar las actualizaciones de marca, los logos de la aplicación ahora se cargan desde una URL externa en lugar de ser archivos locales. Esto asegura que cualquier cambio en el logo se refleje instantáneamente en toda la plataforma sin necesidad de un nuevo despliegue.
                  </p>
              </div>
          </li>
        </ul>
      </section>
      
      {/* --- VERSION v3.5.0.11 --- */}
      <section className="mb-12">
        <div className="pb-4 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-black">Versión 3.5.0.11</h2>
          <p className="text-base text-gray-500 mt-1">Lanzada el 17 de Octubre de 2025</p>
        </div>
        
        <ul className="mt-8 space-y-6">
           <li className="flex items-start gap-4">
              <FeatureTag type="new" />
              <div>
                  <h3 className="font-semibold text-black">Instalación Avanzada de Google Analytics para SPA</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha implementado Google Analytics para rastrear correctamente las navegaciones dentro de la aplicación (Single Page Application). Ahora, cada cambio de vista se registra como una "página vista", permitiendo un análisis detallado del comportamiento del usuario en toda la plataforma, no solo en la carga inicial.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="new" />
              <div>
                  <h3 className="font-semibold text-black">Redención de Recompensas desde el Dashboard</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha implementado un flujo completo para la redención de recompensas. Cuando un cliente alcanza 10 sellos, el botón "Sello" en el dashboard se transforma automáticamente en un botón verde "Redimir". Al hacer clic, un modal de confirmación asegura la acción, y al confirmar, se descuentan 10 sellos y se incrementa el contador de recompensas canjeadas del cliente.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Interfaz de Acciones Contextual</h3>
                  <p className="text-gray-600 mt-1">
                      El botón de acción principal para cada cliente ahora es "inteligente", mostrando la acción más relevante ("Sello" o "Redimir") según el estado del cliente. Esto simplifica la interfaz, reduce la carga cognitiva del cajero y acelera las operaciones diarias.
                  </p>
              </div>
          </li>
        </ul>
      </section>

      {/* --- VERSION v3.5.0.10 --- */}
      <section className="mb-12">
        <div className="pb-4 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-black">Versión 3.5.0.10</h2>
          <p className="text-base text-gray-500 mt-1">Lanzada el 15 de Octubre de 2025</p>
        </div>
        
        <ul className="mt-8 space-y-6">
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Punto de Restauración y Consolidación de Funcionalidades</h3>
                  <p className="text-gray-600 mt-1">
                      Esta versión establece un punto de restauración estable que consolida las últimas mejoras de la plataforma. Se afianza la gestión integral de clientes (búsqueda, edición, eliminación y adición de sellos desde el dashboard), el flujo unificado de registro y consulta de tarjetas para el cliente final, y la robustez general de la interfaz de usuario. Este hito marca una base sólida para futuras innovaciones.
                  </p>
              </div>
          </li>
        </ul>
      </section>

      {/* --- VERSION v3.5.0.9 --- */}
      <section className="mb-12">
        <div className="pb-4 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-black">Versión 3.5.0.9</h2>
          <p className="text-base text-gray-500 mt-1">Lanzada el 14 de Octubre de 2025</p>
        </div>
        
        <ul className="mt-8 space-y-6">
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Eliminación del Resaltado en Búsquedas</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha eliminado la funcionalidad que resaltaba el término de búsqueda en los resultados del dashboard. Esta decisión se tomó con base en la retroalimentación de los usuarios, quienes indicaron que el resaltado amarillo podía ser confuso y parecer un error visual. La funcionalidad de búsqueda por nombre, teléfono y email se mantiene sin cambios.
                  </p>
              </div>
          </li>
        </ul>
      </section>

      {/* --- VERSION v3.5.0.8 --- */}
      <section className="mb-12">
        <div className="pb-4 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-black">Versión 3.5.0.8</h2>
          <p className="text-base text-gray-500 mt-1">Lanzada el 13 de Octubre de 2025</p>
        </div>
        
        <ul className="mt-8 space-y-6">
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Buscador de Clientes Mejorado</h3>
                  <p className="text-gray-600 mt-1">
                      El buscador en el dashboard ahora es más potente. Se ha añadido la capacidad de buscar clientes por su dirección de email, además de por nombre y teléfono. Para mejorar la usabilidad, el término de búsqueda ahora se resalta visualmente en los resultados, facilitando la identificación rápida del cliente correcto.
                  </p>
              </div>
          </li>
        </ul>
      </section>

      {/* --- VERSION v3.5.0.7 --- */}
      <section className="mb-12">
        <div className="pb-4 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-black">Versión 3.5.0.7</h2>
          <p className="text-base text-gray-500 mt-1">Lanzada el 12 de Octubre de 2025</p>
        </div>
        
        <ul className="mt-8 space-y-6">
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Flujo de Sellos Optimizado Directamente desde el Dashboard</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha eliminado la página dedicada de 'Agregar Sello'. Ahora, los cajeros pueden agregar sellos rápidamente a través de un modal directamente desde la lista de clientes, reduciendo el proceso a solo dos clics y mejorando significativamente la eficiencia.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="new" />
              <div>
                  <h3 className="font-semibold text-black">Gestión Completa de Clientes: Editar y Eliminar</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha introducido la capacidad de editar la información de un cliente (nombre, teléfono, email) en una nueva página dedicada. Además, se ha añadido una 'Zona de Peligro' segura para eliminar clientes de forma permanentemente, con una doble confirmación para evitar borrados accidentales.
                  </p>
              </div>
          </li>
        </ul>
      </section>

      {/* --- VERSION v3.5.0.6 --- */}
      <section className="mb-12">
        <div className="pb-4 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-black">Versión 3.5.0.6</h2>
          <p className="text-base text-gray-500 mt-1">Lanzada el 11 de Octubre de 2025</p>
        </div>
        
        <ul className="mt-8 space-y-6">
          <li className="flex items-start gap-4">
              <FeatureTag type="new" />
              <div>
                  <h3 className="font-semibold text-black">Recuperación de Contraseña</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha añadido un enlace "¿Olvidaste tu contraseña?" en la pantalla de inicio de sesión. Esta funcionalidad inicia un flujo seguro gestionado por Firebase, que permite a los dueños de negocios recibir un correo electrónico para restablecer su contraseña, mejorando la accesibilidad y seguridad de la cuenta.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Interfaz de Validación de Formularios Estandarizada</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha implementado un sistema de validación de errores visualmente consistente en todos los formularios de la aplicación. Ahora, los campos con datos incorrectos se marcan con un borde rojo, un ícono de advertencia y un mensaje de error claro debajo, siguiendo las mejores prácticas de diseño para una experiencia de usuario más intuitiva y accesible.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Validación de Formato para Teléfonos de México</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha implementado una validación en todos los campos de número de teléfono de la aplicación (registro de clientes, consulta de tarjeta y adición de sellos) para asegurar que los usuarios ingresen un formato válido de 10 dígitos. Esto mejora la calidad de los datos y prepara la plataforma para futuras integraciones como la verificación por SMS. Se han actualizado también los textos de ayuda (`placeholders`) para guiar al usuario.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Reorganización Visual del Formulario de Inicio de Sesión</h3>
                  <p className="text-gray-600 mt-1">
                      Para mejorar la claridad y el flujo visual, el enlace para restablecer la contraseña se ha reubicado en la parte inferior del formulario, debajo del enlace de registro. Este cambio prioriza las acciones principales de iniciar sesión y registrarse.
                  </p>
              </div>
          </li>
        </ul>
      </section>

      {/* --- VERSION v3.5.0.5 --- */}
      <section className="mb-12">
        <div className="pb-4 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-black">Versión 3.5.0.5</h2>
          <p className="text-base text-gray-500 mt-1">Lanzada el 10 de Octubre de 2025</p>
        </div>
        
        <ul className="mt-8 space-y-6">
          <li className="flex items-start gap-4">
              <FeatureTag type="new" />
              <div>
                  <h3 className="font-semibold text-black">Flujo de Consulta y Registro Unificado para Clientes</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha rediseñado la página pública de la tarjeta para agilizar la experiencia del cliente. Ahora, se presenta un único campo para el número de teléfono. El sistema detecta automáticamente si el cliente ya está registrado para mostrarle su tarjeta o lo guía al formulario de registro si es nuevo.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Términos y Condiciones Actualizados y Visibles</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha reescrito por completo la página de Términos y Condiciones para alinearla con la legislación mexicana, delimitando claramente la responsabilidad de Loyalfly como intermediario. Además, se ha añadido un enlace directo a esta página en la vista pública de la tarjeta para garantizar la transparencia con el cliente final.
                  </p>
              </div>
          </li>
        </ul>
      </section>

      {/* --- VERSION v3.5.0.4 --- */}
      <section className="mb-12">
        <div className="pb-4 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-black">Versión 3.5.0.4</h2>
          <p className="text-base text-gray-500 mt-1">Lanzada el 9 de Octubre de 2025</p>
        </div>
        
        <ul className="mt-8 space-y-6">
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Mejora de Legibilidad en la Recompensa</h3>
                  <p className="text-gray-600 mt-1">
                      Se eliminó un efecto visual que cubría el texto de la recompensa en la previsualización de la tarjeta. Ahora el texto es siempre claro y legible sobre un fondo blanco limpio.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Estilo Actualizado para Sellos Vacíos</h3>
                  <p className="text-gray-600 mt-1">
                      Se ajustó el color de fondo de los sellos no marcados en la tarjeta. En lugar de un gris sólido, ahora utilizan un blanco semi-transparente que permite ver el color de fondo de la tarjeta a través de ellos.
                  </p>
              </div>
          </li>
        </ul>
      </section>

      {/* --- VERSION v3.5.0.3 --- */}
      <section className="mb-12">
        <div className="pb-4 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-black">Versión 3.5.0.3</h2>
          <p className="text-base text-gray-500 mt-1">Lanzada el 8 de Octubre de 2025</p>
        </div>
        
        <ul className="mt-8 space-y-6">
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Simplificación de la Sección "Comparte con tus Clientes"</h3>
                  <p className="text-gray-600 mt-1">
                      Para enfocar la funcionalidad del MVP, se ha rediseñado la sección para compartir en el editor de tarjetas. Se eliminó el código QR y se ajustó el texto para mayor claridad, cambiando el botón de "Ver Tarjeta" a "Ver Registro" para reflejar mejor la acción actual.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Previsualización Dinámica del Texto de Recompensa</h3>
                  <p className="text-gray-600 mt-1">
                      La previsualización de la tarjeta ahora muestra en tiempo real el texto ingresado en el campo "Texto de la Recompensa". Esto proporciona una experiencia de edición más intuitiva y directa, eliminando el texto de ejemplo y mostrando el contenido final exacto.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="new" />
              <div>
                  <h3 className="font-semibold text-black">URL Amigables para Registro de Clientes</h3>
                  <p className="text-gray-600 mt-1">
                      Cada negocio ahora tiene una URL pública única y fácil de compartir (ej: `loyalfly.app/#/view/nombre-negocio`). Este enlace dirige a los nuevos clientes a una página de registro personalizada con el logo y diseño de la tarjeta del negocio, simplificando la inscripción al programa de lealtad.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="new" />
              <div>
                  <h3 className="font-semibold text-black">Flujo de Registro para Nuevos Clientes</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha implementado un formulario de registro público que permite a los clientes inscribirse con su nombre, teléfono y correo (opcional). Al completarlo, ven su nueva tarjeta digital al instante, mejorando la experiencia de incorporación.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="new" />
              <div>
                  <h3 className="font-semibold text-black">Personalización del Logo de la Tarjeta</h3>
                  <p className="text-gray-600 mt-1">
                      Ahora los negocios pueden personalizar completamente su tarjeta de lealtad agregando un logo propio. Se ha añadido un nuevo campo en el editor de la tarjeta que permite ingresar una URL pública de una imagen (JPG o PNG), la cual se mostrará en la previsualización y en la tarjeta pública del cliente.
                  </p>
              </div>
          </li>
           <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Generación Automática de Slugs</h3>
                  <p className="text-gray-600 mt-1">
                     El sistema ahora crea automáticamente un "slug" (una versión del nombre del negocio amigable para URLs) al registrar un nuevo negocio. Esto asegura que los enlaces públicos sean limpios, legibles y profesionales.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Reestructuración de Datos en Firestore para Mejor Escalabilidad</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha refactorizado la estructura de la base de datos en Firestore. La configuración de la tarjeta de lealtad ahora se almacena en una subcolección dedicada (`/businesses/{'{'}businessId{'}'}/config/card`). Este cambio mejora la organización, aísla la configuración de la información principal del negocio y prepara la plataforma para futuras funcionalidades avanzadas sin impactar la experiencia del usuario.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Validación de la Implementación y Reglas de Firebase</h3>
                  <p className="text-gray-600 mt-1">
                      Se realizó una auditoría completa de la integración con Firebase Auth y Firestore, confirmando que la implementación del lado del cliente sigue las mejores prácticas. Adicionalmente, se han configurado las reglas de seguridad del lado del servidor para el entorno de desarrollo y pruebas, permitiendo un acceso flexible para la depuración y manteniendo la seguridad como una prioridad para la producción.
                  </p>
              </div>
          </li>
        </ul>
      </section>

      {/* --- VERSION v3.5.0.2 --- */}
      <section className="mb-12">
        <div className="pb-4 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-black">Versión 3.5.0.2</h2>
          <p className="text-base text-gray-500 mt-1">Lanzada el 7 de Octubre de 2025</p>
        </div>
        
        <ul className="mt-8 space-y-6">
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Implementación de Autenticación Real con Firebase</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha reemplazado el sistema de inicio de sesión simulado por una integración completa con Firebase Authentication. Ahora los negocios pueden registrarse, iniciar sesión y mantener su sesión de forma segura y persistente, utilizando email y contraseña.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Estructura de Base de Datos Escalable con Firestore</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha implementado una arquitectura de datos en Firestore. Cada negocio tiene su propio documento (identificado por su ID de usuario) que contiene la configuración de la tarjeta y una subcolección dedicada para sus clientes. Este modelo asegura que los datos estén organizados, seguros y sean eficientes de consultar.
                  </p>
              </div>
          </li>
        </ul>
      </section>

      {/* --- VERSION v3.5.0.1 --- */}
      <section className="mb-12">
        <div className="pb-4 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-black">Versión 3.5.0.1</h2>
          <p className="text-base text-gray-500 mt-1">Lanzada el 6 de Octubre de 2025</p>
        </div>
        
        <ul className="mt-8 space-y-6">
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Selector de Color RGB en Editor de Tarjeta</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha reemplazado el selector de colores predefinidos por un selector RGB interactivo y optimizado para móviles, ofreciendo control total sobre el color de la tarjeta.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Dashboard Optimizado para Móviles</h3>
                  <p className="text-gray-600 mt-1">
                      La columna 'Teléfono' ahora es visible en la vista móvil del dashboard de clientes para un acceso rápido a la información de contacto clave, ocultando la columna 'Email' en pantallas pequeñas.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="new" />
              <div>
                  <h3 className="font-semibold text-black">Sección de Documentación Unificada</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha creado una nueva sección 'Docs' con navegación lateral para centralizar la 'Guía de Estilo', el 'Log de Versiones' y futura documentación del negocio, mejorando la organización.
                  </p>
              </div>
          </li>
        </ul>
      </section>

      {/* --- VERSION v3.5 --- */}
      <section>
        <div className="pb-4 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-black">Versión 3.5</h2>
          <p className="text-base text-gray-500 mt-1">Lanzada el 6 de Octubre de 2025</p>
        </div>
        
        <ul className="mt-8 space-y-6">
          <li className="flex items-start gap-4">
              <FeatureTag type="new" />
              <div>
                  <h3 className="font-semibold text-black">Gestión de Clientes desde el Dashboard</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha añadido un botón "Nuevo Cliente" en el dashboard para registrar clientes (nombre, teléfono y email opcional) directamente en la plataforma, centralizando la gestión.
                  </p>
              </div>
          </li>
           <li className="flex items-start gap-4">
              <FeatureTag type="new" />
              <div>
                  <h3 className="font-semibold text-black">Función Rápida para Agregar Sellos</h3>
                  <p className="text-gray-600 mt-1">
                      Se implementó un botón flotante en el dashboard que lleva a una nueva pantalla para buscar clientes por teléfono y agregarles sellos de forma rápida y eficiente.
                  </p>
              </div>
          </li>
           <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Selector de Cantidad de Sellos Mejorado</h3>
                  <p className="text-gray-600 mt-1">
                      Ahora es posible agregar múltiples sellos a la vez. El selector de cantidad se ha movido al modal de confirmación y rediseñado con un estilo de e-commerce (+/-) para una mejor experiencia de usuario.
                  </p>
              </div>
          </li>
           <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Optimización de Tipografía para Móviles</h3>
                  <p className="text-gray-600 mt-1">
                      Se ha estandarizado el tamaño de fuente base a 16px en toda la aplicación para cumplir con las directrices de accesibilidad de Google y mejorar la legibilidad en dispositivos móviles.
                  </p>
              </div>
          </li>
          <li className="flex items-start gap-4">
              <FeatureTag type="improvement" />
              <div>
                  <h3 className="font-semibold text-black">Mejoras en la Guía de Estilo y Legibilidad</h3>
                  <p className="text-gray-600 mt-1">
                      Se ajustó el interletrado de los encabezados principales para una mejor legibilidad y se documentó la familia de fuentes utilizada en la guía de estilo de la aplicación.
                  </p>
              </div>
          </li>
        </ul>
      </section>
    </div>
  );
};

export default ChangelogPage;
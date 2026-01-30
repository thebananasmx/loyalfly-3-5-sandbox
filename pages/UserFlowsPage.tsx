import React, { useEffect } from 'react';

interface FlowSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const FlowSection: React.FC<FlowSectionProps> = ({ title, description, children }) => (
  <section className="mb-12">
    <div className="pb-4 border-b border-gray-200">
      <h2 className="text-3xl font-bold text-black">{title}</h2>
      <p className="text-base text-gray-500 mt-1">{description}</p>
    </div>
    <ul className="mt-8 space-y-6 list-disc list-inside text-gray-700">
      {children}
    </ul>
  </section>
);


const UserFlowsPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Flujos de Usuario | Docs | Loyalfly';
  }, []);

  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl font-extrabold text-black mb-4 tracking-tight">Flujos de Usuario</h1>
      <p className="text-lg text-gray-600 mb-12">
        Un mapa completo de los recorridos y funcionalidades clave disponibles en la plataforma Loyalfly para cada tipo de usuario.
      </p>

      <FlowSection title="1. Flujo del Dueño del Negocio" description="Recorrido del usuario que gestiona su programa de lealtad.">
        <li>
          <strong>Registro e Inicio de Sesión</strong>
          <ul className="pl-6 mt-2 space-y-2 list-['-_'] list-inside">
            <li><span className="font-semibold">Registro:</span> El usuario accede a `/register`, completa el formulario con el nombre del negocio, email y contraseña. Al registrarse, se crea la cuenta, un `slug` público único y la configuración inicial de la tarjeta.</li>
            <li><span className="font-semibold">Inicio de Sesión:</span> El usuario accede a `/login`, ingresa sus credenciales y es redirigido a su Dashboard (`/app/dashboard`).</li>
            <li><span className="font-semibold">Recuperación de Contraseña:</span> Desde `/login`, el usuario puede solicitar un enlace para restablecer su contraseña a través de su email.</li>
          </ul>
        </li>
        <li>
          <strong>Dashboard de Clientes (`/app/dashboard`)</strong>
           <ul className="pl-6 mt-2 space-y-2 list-['-_'] list-inside">
            <li><span className="font-semibold">Visualización:</span> Ve una lista de sus clientes registrados, con su nombre, teléfono, sellos y recompensas.</li>
            <li><span className="font-semibold">Búsqueda:</span> Utiliza la barra de búsqueda para filtrar clientes en tiempo real por nombre, teléfono o email.</li>
            <li><span className="font-semibold">Agregar Sellos:</span> Hace clic en "Sello" para un cliente, abre un modal, selecciona la cantidad y confirma para añadir los sellos.</li>
            <li><span className="font-semibold">Canjear Recompensa:</span> Si un cliente tiene 10+ sellos, el botón cambia a "Redimir". Al confirmar en el modal, se restan 10 sellos y se actualiza el contador de recompensas.</li>
            <li><span className="font-semibold">Crear Nuevo Cliente:</span> Accede a `/app/nuevo-cliente` para registrar un nuevo miembro al programa.</li>
            <li><span className="font-semibold">Editar Cliente:</span> Accede a `/app/editar-cliente/:id` para modificar los datos de un cliente o eliminarlo permanentemente (con doble confirmación).</li>
          </ul>
        </li>
         <li>
          <strong>Editor de Tarjeta (`/app/tarjeta`)</strong>
           <ul className="pl-6 mt-2 space-y-2 list-['-_'] list-inside">
            <li><span className="font-semibold">Personalización Visual:</span> Modifica el nombre del negocio, el texto de la recompensa, el color de fondo, el esquema de color del texto (claro/oscuro) y la URL de un logo.</li>
            <li><span className="font-semibold">Previsualización en Vivo:</span> Todos los cambios se reflejan instantáneamente en una vista previa de la tarjeta.</li>
            <li><span className="font-semibold">Compartir:</span> Copia la URL pública única (`/view/:slug`) para compartirla con sus clientes y que puedan registrarse.</li>
          </ul>
        </li>
        <li>
          <strong>Gestión de Encuestas (`/app/vote`)</strong>
           <ul className="pl-6 mt-2 space-y-2 list-['-_'] list-inside">
            <li><span className="font-semibold">Configuración:</span> Activa o desactiva la encuesta, personaliza el mensaje, la pregunta y las dos opciones de respuesta.</li>
            <li><span className="font-semibold">Análisis de Resultados:</span> Revisa en tiempo real el total de votos y el desglose porcentual para cada opción de la encuesta activa.</li>
          </ul>
        </li>
      </FlowSection>

      <FlowSection title="2. Flujo del Cliente Final" description="Recorrido del cliente que se une y participa en un programa de lealtad.">
        <li>
            <strong>Registro y Consulta (`/view/:slug`)</strong>
            <ul className="pl-6 mt-2 space-y-2 list-['-_'] list-inside">
                <li><span className="font-semibold">Acceso:</span> El cliente llega a la URL compartida por el negocio.</li>
                <li><span className="font-semibold">Consulta:</span> Ingresa su número de teléfono. El sistema verifica si ya está registrado.</li>
                <li><span className="font-semibold">Registro (si es nuevo):</span> Si el número no está registrado, se le muestra un formulario para que ingrese su nombre, teléfono y email (opcional).</li>
                <li><span className="font-semibold">Visualización de Tarjeta:</span> Tras consultar o registrarse, ve su tarjeta de lealtad digital con su nombre, sellos y la recompensa.</li>
            </ul>
        </li>
        <li>
            <strong>Participación en Encuesta (`/vote/:slug`)</strong>
            <ul className="pl-6 mt-2 space-y-2 list-['-_'] list-inside">
                <li><span className="font-semibold">Invitación:</span> Si hay una encuesta activa y no ha votado, ve un banner en su tarjeta que lo invita a participar para ganar un sello extra.</li>
                <li><span className="font-semibold">Votación:</span> En la página de la encuesta, elige una de las dos opciones.</li>
                <li><span className="font-semibold">Confirmación:</span> Recibe un mensaje de agradecimiento y se le informa que se ha añadido un sello a su tarjeta. El sistema lo hace automáticamente.</li>
            </ul>
        </li>
      </FlowSection>
      
       <FlowSection title="3. Flujo del Super Administrador" description="Recorrido del dueño de la plataforma para gestionar todos los negocios.">
        <li>
            <strong>Acceso Exclusivo (`/admin`)</strong>
            <ul className="pl-6 mt-2 space-y-2 list-['-_'] list-inside">
                <li><span className="font-semibold">Login/Registro:</span> Accede a un portal de inicio de sesión separado donde puede registrarse o iniciar sesión como administrador. El acceso está protegido y es invisible para los dueños de negocios.</li>
            </ul>
        </li>
        <li>
            <strong>Dashboard de Administración (`/admin/dashboard`)</strong>
            <ul className="pl-6 mt-2 space-y-2 list-['-_'] list-inside">
                <li><span className="font-semibold">Supervisión Global:</span> Ve una tabla con todos los negocios registrados en la plataforma.</li>
                <li><span className="font-semibold">Métricas Clave:</span> Para cada negocio, visualiza el número total de clientes, sellos entregados y recompensas canjeadas.</li>
                <li><span className="font-semibold">Gestión de Planes:</span> Cambia el plan de suscripción de un negocio (Gratis, Entrepreneur, Pro) directamente desde la tabla.</li>
                <li><span className="font-semibold">Eliminación de Negocios:</span> Puede eliminar permanentemente un negocio de la plataforma, incluyendo todos sus datos asociados, con un modal de confirmación.</li>
            </ul>
        </li>
      </FlowSection>

    </div>
  );
};

export default UserFlowsPage;
import React, { useEffect } from 'react';
import CardPreview from '../components/CardPreview';
import ErrorMessage from '../components/ErrorMessage';
import ExclamationCircleIcon from '../components/icons/ExclamationCircleIcon';

const ColorBox: React.FC<{ color: string; name: string; hex: string }> = ({ color, name, hex }) => (
    <div>
        <div className="h-24 rounded-lg border border-gray-200" style={{ backgroundColor: color }}></div>
        <div className="mt-2">
            <p className="font-semibold text-black">{name}</p>
            <p className="text-base text-gray-500 uppercase">{hex}</p>
        </div>
    </div>
);

const StyleGuidePage: React.FC = () => {
  useEffect(() => {
    document.title = 'Guía de Estilo | Docs | Loyalfly';
  }, []);

  return (
    <div className="max-w-4xl">
      <h1 className="text-4xl font-extrabold text-black mb-4 tracking-tight">Guía de Estilo</h1>
      <p className="text-lg text-gray-600 mb-12">
          Esta guía documenta el sistema de diseño de Loyalfly, asegurando consistencia visual y una experiencia de usuario coherente en toda la aplicación.
      </p>

      {/* --- COLORES --- */}
      <section className="mb-12">
          <h2 className="text-2xl font-bold text-black border-b pb-2 mb-6">Paleta de Colores</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <ColorBox color="#FFFFFF" name="Fondo Principal" hex="#FFFFFF" />
              <ColorBox color="#000000" name="Texto Principal" hex="#000000" />
              <ColorBox color="#6B7280" name="Texto Secundario" hex="#6B7280" />
              <ColorBox color="#4D17FF" name="Acento Principal" hex="#4D17FF" />
              <ColorBox color="#00AA00" name="Éxito" hex="#00AA00" />
              <ColorBox color="#DC2626" name="Error" hex="#DC2626" />
              <ColorBox color="#EAB308" name="Alerta" hex="#EAB308" />
          </div>
      </section>

      {/* --- TIPOGRAFÍA --- */}
      <section className="mb-12">
          <h2 className="text-2xl font-bold text-black border-b pb-2 mb-6">Tipografía</h2>
          <div className="mb-6 text-gray-700">
              <h3 className="text-lg font-semibold text-black mb-2">Familia de Fuentes (Font Family)</h3>
              <p>
                  Loyalfly utiliza la pila de fuentes sans-serif predeterminada del sistema operativo del usuario (font-sans). Esto garantiza tiempos de carga rápidos y una apariencia nativa en todos los dispositivos. La pila de fuentes incluye Segoe UI, Roboto, Helvetica Neue, Arial, y otras fuentes sans-serif estándar.
              </p>
          </div>
          <div className="space-y-4">
              <h1 className="text-4xl font-extrabold text-black tracking-tight">Heading 1 (Extrabold)</h1>
              <h2 className="text-3xl font-bold text-black">Heading 2 (Bold)</h2>
              <h3 className="text-xl font-semibold text-black">Heading 3 (Semibold)</h3>
              <p className="text-base text-gray-700">
                  Este es un párrafo de texto normal (p). Se utiliza para la mayoría del contenido textual. <a href="#" className="text-[#4D17FF] underline">Este es un enlace</a>. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>
          </div>
      </section>

      {/* --- BOTONES --- */}
      <section className="mb-12">
          <h2 className="text-2xl font-bold text-black border-b pb-2 mb-6">Botones</h2>
          <div className="flex flex-wrap items-start gap-4">
              <div className="flex flex-col items-center gap-2">
                  <button className="px-6 py-2.5 font-medium text-white bg-[#4D17FF] rounded-md hover:bg-opacity-90 transition-colors">Botón Primario</button>
                  <span className="text-base text-gray-500">Normal</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                  <button className="px-6 py-2.5 font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors">Botón Secundario</button>
                  <span className="text-base text-gray-500">Normal</span>
              </div>
               <div className="flex flex-col items-center gap-2">
                  <button disabled className="px-6 py-2.5 font-medium text-white bg-gray-400 rounded-md cursor-not-allowed">Botón Deshabilitado</button>
                  <span className="text-base text-gray-500">Disabled</span>
              </div>
          </div>
      </section>

      {/* --- LOGOTIPO --- */}
      <section className="mb-12">
          <h2 className="text-2xl font-bold text-black border-b pb-2 mb-6">Logotipo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                  <h3 className="text-lg font-semibold text-black mb-4">Versión de Escritorio</h3>
                  <div className="p-4 bg-white rounded-md inline-block border">
                       <img 
                          src="https://raw.githubusercontent.com/thebananasmx/loyalfly-3-5/refs/heads/main/assets/logo_desk.svg" 
                          alt="Logo de escritorio" 
                          className="h-12" 
                      />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Usado en cabeceras y barras laterales con espacio horizontal.</p>
              </div>
              <div className="text-center">
                  <h3 className="text-lg font-semibold text-black mb-4">Versión Móvil</h3>
                   <div className="p-4 bg-white rounded-md inline-block border">
                      <img 
                          src="https://raw.githubusercontent.com/thebananasmx/loyalfly-3-5/refs/heads/main/assets/logo_mob.svg" 
                          alt="Logo móvil" 
                          className="h-12" 
                      />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Usado en cabeceras móviles y espacios compactos.</p>
              </div>
          </div>
      </section>
      
      {/* --- FORMULARIOS --- */}
      <section className="mb-12">
          <h2 className="text-2xl font-bold text-black border-b pb-2 mb-6">Elementos de Formulario</h2>
          <div className="max-w-sm space-y-4">
               <div>
                  <label htmlFor="name" className="block text-base font-medium text-gray-700">Campo de Texto</label>
                  <input 
                      id="name"
                      type="text"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black"
                      placeholder="Escribe aquí..."
                  />
              </div>
               <div>
                  <label htmlFor="name-error" className="block text-base font-medium text-gray-700">Campo con Error</label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <input 
                        id="name-error"
                        type="text"
                        required
                        className="block w-full px-3 py-2 border border-red-500 rounded-md pr-10 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500"
                        defaultValue="Dato inválido"
                        aria-invalid="true"
                        aria-describedby="name-error-message"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <ExclamationCircleIcon />
                    </div>
                  </div>
                  <ErrorMessage message="Este campo es requerido." id="name-error-message" />
              </div>
          </div>
      </section>

      {/* --- COMPONENTES --- */}
      <section>
          <h2 className="text-2xl font-bold text-black border-b pb-2 mb-6">Componentes Clave</h2>
          <h3 className="text-lg font-semibold text-black mb-4">Tarjeta de Lealtad</h3>
          <div className="p-8 bg-gray-100 rounded-lg flex justify-center">
               <CardPreview 
                  businessName="Nombre del Negocio"
                  rewardText="Tu Recompensa"
                  cardColor="#FFFFFF"
                  stamps={3}
                  textColorScheme="dark"
               />
          </div>
      </section>

    </div>
  );
};

export default StyleGuidePage;
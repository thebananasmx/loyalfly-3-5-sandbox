import React, { useEffect } from 'react';

const TermsPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Términos y Condiciones | Loyalfly';
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-6 tracking-tight">Términos y Condiciones del Servicio</h1>
        <div className="prose prose-lg text-gray-700 space-y-4">
          <p className='text-sm text-gray-500'>Última actualización: 9 de Octubre de 2025</p>
          <p>
            Bienvenido a Loyalfly. Estos Términos y Condiciones rigen el uso de nuestra plataforma tecnológica. Al utilizar nuestros servicios, usted acepta estos términos en su totalidad.
          </p>
          
          <h2 className="text-2xl font-semibold text-black">1. Definiciones</h2>
          <ul>
            <li><strong>"Plataforma"</strong>: Se refiere al software y los servicios proporcionados por Loyalfly, que permiten a los Negocios crear y gestionar programas de lealtad digitales.</li>
            <li><strong>"Negocio"</strong>: Se refiere a cualquier entidad comercial que se registra en Loyalfly para ofrecer un programa de lealtad a sus Clientes.</li>
            <li><strong>"Cliente"</strong>: Se refiere al usuario final que se inscribe en el programa de lealtad de un Negocio a través de la Plataforma.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-black">2. Naturaleza del Servicio</h2>
          <p>
            Loyalfly es un facilitador tecnológico que actúa como intermediario. Nuestra Plataforma proporciona al Negocio las herramientas para administrar un programa de lealtad y al Cliente la interfaz para participar en dicho programa. Loyalfly no forma parte de la transacción o relación comercial entre el Negocio y el Cliente.
          </p>

          <h2 className="text-2xl font-semibold text-black">3. Responsabilidades de las Partes</h2>
          
          <h3 className='text-xl font-semibold text-black'>A. Responsabilidades del Negocio</h3>
          <ul>
            <li>El Negocio es el único y exclusivo responsable de definir, gestionar, comunicar y cumplir con las recompensas, beneficios y ofertas de su programa de lealtad.</li>
            <li>El Negocio es responsable de la veracidad de la información proporcionada y de la calidad de los productos o servicios ofrecidos.</li>
            <li>Cualquier disputa, queja o reclamo relacionado con las recompensas o el servicio del Negocio deberá ser resuelto directamente entre el Cliente y el Negocio.</li>
          </ul>

          <h3 className='text-xl font-semibold text-black'>B. Responsabilidades del Cliente</h3>
          <ul>
            <li>El Cliente se compromete a proporcionar información veraz y precisa durante su registro.</li>
            <li>El Cliente es responsable del uso correcto y personal de su tarjeta de lealtad digital.</li>
          </ul>
          
          <h3 className='text-xl font-semibold text-black'>C. Rol y Limitación de Loyalfly</h3>
          <ul>
            <li>Loyalfly se compromete a mantener la Plataforma operativa y segura.</li>
            <li>Loyalfly no garantiza ni se responsabiliza por el cumplimiento de las recompensas ofrecidas por el Negocio.</li>
            <li>Loyalfly no interviene en la relación comercial entre el Negocio y el Cliente, y se exime de cualquier responsabilidad derivada de dicha relación.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-black">4. Uso de Datos Personales</h2>
          <p>
            De acuerdo con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) de México, se establece que:
          </p>
          <ul>
              <li>El <strong>Negocio</strong> actúa como el <strong>"Responsable"</strong> del tratamiento de los datos personales de sus Clientes, ya que decide sobre la finalidad de su recopilación.</li>
              <li>Loyalfly actúa como el <strong>"Encargado"</strong>, procesando los datos personales únicamente por cuenta y bajo las instrucciones del Negocio para la prestación de los servicios de la Plataforma.</li>
          </ul>
          <p>
            El Negocio es responsable de contar con su propio Aviso de Privacidad y de cumplir con las obligaciones legales correspondientes en materia de protección de datos.
          </p>

          <h2 className="text-2xl font-semibold text-black">5. Modificaciones a los Términos</h2>
          <p>
            Loyalfly se reserva el derecho de modificar estos términos en cualquier momento. Las modificaciones serán efectivas al ser publicadas en nuestro sitio web. Se recomienda revisar esta página periódicamente.
          </p>
          
          <h2 className="text-2xl font-semibold text-black">6. Legislación Aplicable y Jurisdicción</h2>
          <p>
            Estos términos se regirán e interpretarán de acuerdo con las leyes de los Estados Unidos Mexicanos. Para cualquier controversia, las partes se someten a la jurisdicción de los tribunales competentes de la Ciudad de México, renunciando a cualquier otro fuero que pudiera corresponderles.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
import { useState } from 'react';
import { IMAGENS } from '../lib/imagens';

// Logo da adega. Enquanto o arquivo não existir, mostra o círculo com o "R" de antes.
export default function Logo() {
  const [falhou, setFalhou] = useState(false);

  if (falhou) {
    return (
      <span className="w-9 h-9 rounded-full bg-wine flex items-center justify-center font-serif text-lg text-gold-soft">R</span>
    );
  }
  return <img src={IMAGENS.logo} alt="Logo da Adega do Rei" className="h-10 w-auto object-contain" onError={() => setFalhou(true)} />;
}

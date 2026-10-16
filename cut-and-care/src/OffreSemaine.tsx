import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {C} from './theme';
import {Dust, FrameBorder, Paper} from './components/ui';
import {Hook, Offre} from './scenes/Intro';
import {Coupe, NattesTresses, PriceHeader, Tissage, TwistLocks} from './scenes/Prix';
import {Domicile, Etudiant, Soins} from './scenes/Avantages';
import {Adresse, Reseaux, WhatsApp} from './scenes/Contacts';
import {Final} from './scenes/Final';

export const offreSchema = z.object({
  voixOff: z.string(),
  whatsapp: z.string(),
  whatsappPaires: z.array(z.string()).length(5),
  handle: z.string(),
  adresse: z.string(),
  yango: z.string(),
});

export type OffreProps = z.infer<typeof offreSchema>;

export const defaultContent: OffreProps = {
  voixOff: 'voix-off.wav',
  whatsapp: '+225 07 17 22 17 54',
  whatsappPaires: ['07', '17', '22', '17', '54'],
  handle: '@cutcare01',
  adresse: 'Angré Djibi 1',
  yango: 'Cut Care Styling',
};

/** Cut & Care Styling — « Offre semaine · Coiffez-vous au calme » (1080×1920, 45 s). */
export const OffreSemaine: React.FC<OffreProps> = ({voixOff, whatsapp, whatsappPaires, handle, adresse, yango}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: C.cream}}>
      <Paper />
      <Dust frame={frame} seed="global" opacity={0.3} count={16} />
      <Hook frame={frame} />
      <Offre frame={frame} />
      <PriceHeader frame={frame} />
      <Tissage frame={frame} />
      <NattesTresses frame={frame} />
      <TwistLocks frame={frame} />
      <Coupe frame={frame} />
      <Soins frame={frame} />
      <Etudiant frame={frame} />
      <Domicile frame={frame} />
      <Reseaux frame={frame} />
      <Adresse frame={frame} />
      <WhatsApp frame={frame} pairs={whatsappPaires} />
      <Final frame={frame} whatsapp={whatsapp} handle={handle} adresse={adresse} yango={yango} />
      <FrameBorder />
      <Audio src={staticFile(voixOff)} />
    </AbsoluteFill>
  );
};

// Validation des données envoyées par le formulaire de réservation.
import {parseDate} from '../public/js/slots.mjs';
import {normalizePhoneCI} from '../public/js/phone.mjs';

export {normalizePhoneCI};

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export function validateBooking(body, catalog) {
  const errors = {};
  const services = Array.isArray(body?.services) ? body.services.slice(0, 4) : [];
  if (!services.length) errors.services = 'Choisissez au moins une prestation.';
  const cleanServices = services.map((s) => ({id: str(s?.id, 40), ...(s?.option ? {option: str(s.option, 20)} : {})}));

  const mode = body?.mode === 'domicile' ? 'domicile' : body?.mode === 'salon' ? 'salon' : null;
  if (!mode) errors.mode = 'Choisissez le lieu.';
  const zone = mode === 'domicile' ? str(body?.zone, 40) : null;
  const address = mode === 'domicile' ? str(body?.address, 200) : '';
  const landmark = mode === 'domicile' ? str(body?.landmark, 160) : '';
  if (mode === 'domicile' && address.length < 4) errors.address = 'Indiquez votre adresse (quartier, rue, maison).';

  const date = str(body?.date, 10);
  if (!parseDate(date)) errors.date = 'Choisissez une date.';
  const time = str(body?.time, 5);
  if (!/^\d{2}:\d{2}$/.test(time)) errors.time = 'Choisissez un horaire.';

  const name = str(body?.client?.name, 80);
  if (name.length < 2) errors.name = 'Indiquez votre nom.';
  const phone = normalizePhoneCI(body?.client?.phone);
  if (!phone) errors.phone = 'Numéro ivoirien à 10 chiffres (ex. 07 17 22 17 54).';
  const email = str(body?.client?.email, 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'Adresse e-mail invalide.';

  const method = catalog.payments.methods.some((m) => m.id === body?.method) ? body.method : null;
  if (!method) errors.method = 'Choisissez Wave ou Orange Money.';
  if (body?.consent !== true) errors.consent = 'Merci d’accepter les conditions de l’acompte.';

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: {
      services: cleanServices,
      student: body?.student === true,
      mode,
      zone,
      address,
      landmark,
      date,
      time,
      client: {name, phone, email},
      notes: str(body?.notes, 500),
      method,
    },
  };
}

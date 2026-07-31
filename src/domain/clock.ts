// docs/10-Development-Standards.md "Horloge injectable" — calculs temporels
// testables (chronomètres, délais, transitions, expirations) sans dépendre
// de l'heure réelle. Passer `Clock` en paramètre plutôt qu'importer
// `systemClock` globalement dans la logique qui doit rester testable.
export type Clock = {
  now(): Date;
};

export const systemClock: Clock = {
  now: () => new Date(),
};

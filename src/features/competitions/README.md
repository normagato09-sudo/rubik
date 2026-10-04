# competitions

Concursos (`/concursos`): el calendario de los concursos a los que vas.

- `types.ts` — `Competition` y la lista de categorías
  (`COMPETITION_EVENTS`). Para añadir una categoría (p. ej. 4×4) basta con
  añadirla ahí; los concursos guardan los ids, y uno que ya no esté en la
  lista se sigue mostrando con su id.
- `dates.ts` — todo lo de fechas, puro y con tests: días como
  `"YYYY-MM-DD"` (cuentas en UTC, sin sorpresas con el cambio de hora),
  `upcoming` (los que no han terminado, por fecha y hora), `countdownLabel`,
  `registrationWarning` (aviso si no estás inscrito y la inscripción cierra
  en 7 días o menos, o ya cerró), `monthGrid` (semanas de lunes a domingo) y
  la validación del formulario.
- `store.ts` — Zustand con `persist` en `localStorage` (clave
  `rubiko-competitions`), envuelto en try/catch: si el almacenamiento falla
  o los datos están rotos, la pantalla sigue funcionando y empieza vacía.
  `sanitizeCompetitions` limpia lo que se lee. Sin cuentas: cada
  dispositivo tiene sus concursos.
- `use-competitions-hydration.ts` — carga lo guardado después de montar y
  `useToday` (el día del dispositivo, que cambia a medianoche).
- `components/` — `CompetitionsScreen` (cuenta atrás, calendario, día
  elegido y «Próximos»), `MonthCalendar`, `CompetitionCard`,
  `CompetitionForm` y `Modal` (hoja desde abajo en el móvil, centrada en
  pantallas grandes; también para confirmar antes de borrar).

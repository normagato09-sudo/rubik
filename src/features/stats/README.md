# stats

Ao5, Ao12 y estadísticas derivadas de las entradas de `features/history`
(el historial en sí ya vive allí, implementado en el paso 11).

`ao5.ts` es pura: no tiene estado propio ni un segundo historial, solo
lee `HistoryEntry[]` y devuelve un resultado (`notEnoughSolves` | `dnf`
| `timeMs`). Se recalcula en cada render a partir de `historyStore`, así
que siempre refleja el historial real sin necesidad de sincronizarlo a
mano.

Implementado: Ao5. Pendiente: Ao12 y estadísticas generales (paso 13+).

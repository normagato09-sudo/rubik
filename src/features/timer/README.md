# timer

Cronómetro de speedcubing. `engine.ts` es una máquina de estados pura
(idle/running/stopped) basada en timestamps, sin `setInterval` como
fuente de verdad. `inspection.ts` es otra máquina de estados pura,
independiente (idle/running/finished), para la cuenta atrás de 15s.
Cada una vive en su propio store de Zustand (`timerStore.ts`,
`inspectionStore.ts`) para no acoplar inspección y resolución.

`penalty.ts` añade la penalización +2: solo cambia el campo `penalty`
de `TimerState`, nunca `finalTimeMs` (el tiempo base), así que ambos
conceptos quedan distinguibles y `elapsedMs` es quien suma los 2000ms
al mostrar el tiempo — una sola fuente de verdad para "qué tiempo se
ve", sin duplicar el cálculo.

Implementado: inspección de 15s, iniciar/detener/reiniciar el
cronómetro, penalización +2. Pendiente (fase 2): DNF, historial,
Ao5/Ao12, estadísticas, y guardado de tiempos vía `lib/storage`.

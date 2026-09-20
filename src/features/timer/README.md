# timer

Cronómetro de speedcubing. `engine.ts` es una máquina de estados pura
(idle/running/stopped) basada en timestamps, sin `setInterval` como
fuente de verdad. `inspection.ts` es otra máquina de estados pura,
independiente (idle/running/finished), para la cuenta atrás de 15s.
Cada una vive en su propio store de Zustand (`timerStore.ts`,
`inspectionStore.ts`) para no acoplar inspección y resolución.

Implementado: inspección de 15s, iniciar/detener/reiniciar el
cronómetro, tiempo final conservado hasta el siguiente inicio.
Pendiente (fase 2): +2, DNF, historial, Ao5/Ao12, estadísticas, y
guardado de tiempos vía `lib/storage`.

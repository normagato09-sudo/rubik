# timer

Cronómetro de speedcubing. `engine.ts` es una máquina de estados pura
(idle/running/stopped) basada en timestamps, sin `setInterval` como
fuente de verdad. `inspection.ts` es otra máquina de estados pura,
independiente (idle/running/finished), para la cuenta atrás de 15s.
Cada una vive en su propio store de Zustand (`timerStore.ts`,
`inspectionStore.ts`) para no acoplar inspección y resolución.

`penalty.ts` añade +2 y DNF: ambos son valores del mismo campo
`TimerState.penalty` ("none" | "plus2" | "dnf"), nunca de
`finalTimeMs` (el tiempo base), así que el tiempo y el resultado
quedan distinguibles. Solo puede haber un valor a la vez, así que
marcar DNF sobre una resolución con +2 simplemente sobreescribe el
campo — DNF gana siempre como resultado final. `elapsedMs` suma los
2000ms al mostrar un +2; la UI muestra "DNF" en vez de un tiempo
cuando corresponde, sin duplicar esa fuente de verdad.

Implementado: inspección de 15s, iniciar/detener/reiniciar el
cronómetro, penalización +2, DNF. Pendiente (fase 2): historial,
Ao5/Ao12, estadísticas, y guardado de tiempos vía `lib/storage`.

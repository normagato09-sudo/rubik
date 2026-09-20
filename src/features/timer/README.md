# timer

Cronómetro de speedcubing. `engine.ts` es una máquina de estados pura
(idle/running/stopped) basada en timestamps, sin `setInterval` como
fuente de verdad. `store/timerStore.ts` la expone vía Zustand.

Implementado: iniciar/detener/reiniciar, tiempo final conservado hasta
el siguiente inicio. Pendiente (fase 2): inspección, +2, DNF, historial,
Ao5/Ao12, estadísticas, y guardado de tiempos vía `lib/storage`.

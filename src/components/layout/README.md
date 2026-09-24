# layout

Shell de la aplicación: barra lateral de navegación (menú de tres rayas en
móvil) con Inicio y Progreso. Inicio es el centro de la app: Cubo → Método →
Aprender se eligen allí. Sin lógica de negocio del cubo — solo estructura y
navegación, reutilizado por todas las páginas desde `app/layout.tsx`.

`right-panel.tsx` (selectores de Cubo y Método en un panel lateral) se
conserva pero ya no se muestra; esos selectores viven en Inicio. Las rutas
`/entrenar/cross` y `/metodos` siguen existiendo aunque no estén en el menú.

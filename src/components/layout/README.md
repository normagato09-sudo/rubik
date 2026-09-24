# layout

Shell de la aplicación, reutilizado por todas las páginas desde
`app/layout.tsx`. Sin menú, cabecera ni barra lateral: Inicio es la única
pantalla principal (Cubo → Método → Aprender, y Solucionador) y cada pantalla
enlaza de vuelta a ella. El shell solo centra el contenido y deja margen para
la barra de estado cuando RUBIKO está instalado como app.

`sidebar-nav.tsx` y `right-panel.tsx` se conservan pero no se muestran.
`/entrenar/cross` y `/metodos` siguen existiendo aunque no estén enlazados.

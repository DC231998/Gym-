# Mi Negocio 3D - versión catálogo por temporadas

Proyecto web sin React ni Node. Funciona con HTML + CSS + JavaScript y puede publicarse en GitHub Pages.

## Nueva función: Catálogo PDF

En **Catálogo PDF** puedes generar un único PDF para clientes.

Cada producto tiene:
- Temporada
- Descripción comercial
- Colores disponibles
- Foto
- Precio

El generador:
1. Toma todos los productos.
2. Los agrupa por temporada.
3. Mezcla todas las temporadas en un mismo catálogo.
4. Aplica un diseño diferente a cada temporada.
5. Crea una portada.
6. Genera el PDF tamaño A4.

Temas incluidos:
- Todo el año
- Navidad
- Halloween
- Primavera
- Verano
- Otoño
- San Valentín
- Día de Muertos
- Día de la Madre
- Día del Padre
- Regreso a clases
- Personalizados

## Cómo usar

1. Abre `js/firebase-config.js` y pega tu configuración de Firebase.
2. Activa Firestore y Storage en Firebase.
3. Sube la carpeta a GitHub.
4. Activa GitHub Pages.
5. Entra a **Catálogo** y crea tus productos.
6. En cada producto selecciona su temporada.
7. Escribe la descripción y colores que quieres mostrar al cliente.
8. Entra a **Catálogo PDF**.
9. Revisa la vista previa.
10. Pulsa **Generar PDF**.

El PDF de clientes no muestra costos internos, gramos de filamento ni margen.

## Importante sobre Firebase

`firestore.rules` y `storage.rules` son reglas abiertas de desarrollo. No deben dejarse así para un negocio real. La siguiente mejora recomendada es agregar Firebase Authentication y reglas privadas.

## Dependencias del PDF

El navegador carga jsPDF y html2canvas desde CDN. No necesitas instalar Node, npm, React ni ningún servidor.

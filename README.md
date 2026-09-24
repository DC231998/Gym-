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

## Costos de electricidad y guardado

- La P1S usa una estimación configurable de consumo medio para costear cada hora de impresión. El valor inicial es **110 W**, mientras que Bambu Lab especifica 350 W a 110 V y 1000 W a 220 V como requisitos eléctricos máximos de referencia. El valor de costo se puede cambiar en Configuración.
- El cálculo eléctrico del producto es: `horas de impresión × W / 1000 × tarifa CFE efectiva`.
- La app incluye una referencia inicial para Tarifa 1 de septiembre de 2026 y permite modificar tarifa, consumo mensual y precios por bloque.
- Los productos y demás registros se guardan en `localStorage` incluso sin Firebase. Si Firebase está configurado, la carga inicial combina los datos locales con los de Firestore en vez de borrar los datos locales cuando la nube está vacía.

## Costeo eléctrico de la Bambu Lab P1S

El producto permite seleccionar la velocidad **Silencioso, Estándar, Sport o Ludicrous** y calcula el costo eléctrico con base en el tiempo de impresión, el consumo estimado del modo y el precio efectivo de CFE configurado.

La P1S tiene una especificación de potencia máxima de 350 W a 110 V y 1000 W a 220 V. Esa cifra es una potencia máxima de entrada, no un consumo constante durante toda la impresión. Por eso la aplicación usa valores medios estimados y editables por velocidad.

Los valores iniciales son aproximaciones para costeo, no mediciones oficiales de consumo por modo. Para mayor precisión, se pueden sustituir por los valores medidos con un medidor de energía.

CFE publica las cuotas domésticas por tarifa, localidad y mes. La aplicación permite editar los precios por kWh y los límites de consumo para que coincidan con el recibo del usuario.

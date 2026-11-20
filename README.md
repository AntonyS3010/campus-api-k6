# Campus Cursos API: pruebas con k6

Equipo: **Antony Piero Solorzano Zegarra** y **Adriana Rafaela Laos Gonzales**.

API HTTP JSON estática y de solo lectura para consultar un catálogo académico ficticio. Incluye una página que consume el listado con `fetch`. No requiere base de datos, credenciales ni servicios de pago. No implementa creación, modificación, eliminación ni autenticación.

## Contrato

| Método | Ruta relativa | Respuesta |
|---|---|---|
| GET | `/api/estado.json` | Identidad, versión y modo del servicio, HTTP 200 |
| GET | `/api/cursos.json` | Versión y arreglo `cursos`, HTTP 200 |
| GET | `/api/cursos/C01.json` | Código, nombre y créditos de un curso, HTTP 200 |
| GET | `/api/cursos/NO-EXISTE.json` | HTTP 404; el proveedor puede devolver HTML |

Cada curso tiene `codigo` con patrón `C` y dos dígitos, `nombre` no vacío y `creditos` entero de 1 a 10. Los códigos del listado son únicos y el detalle debe coincidir con ese listado.

## Ejecutar pruebas reales

Instalar [Grafana k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) 2.4.0 y Python 3. Desde la raíz:

```sh
python3 tests/run-local.py
```

El servidor local utiliza un puerto libre y se cierra al terminar. La prueba hace una iteración con un usuario virtual; con el catálogo inicial envía seis solicitudes y evalúa 21 comprobaciones. No es una prueba de carga ni permite concluir capacidad o disponibilidad continua.

Para la API publicada:

```sh
k6 run -e BASE_URL=https://antonys3010.github.io/campus-api-k6 tests/api.js
```

`checks` valida cada respuesta. Los umbrales `checks: rate==1` y `http_req_failed: rate==0` hacen que k6 termine con código distinto de cero si hay un fallo. La solicitud negativa declara HTTP 404 como resultado esperado, sin ocultar errores de las rutas válidas. `results.json` conserva resultados medidos, no valores inventados.

## Despliegue automático

El workflow prueba la app en cada PR. En `main`, solo si esa prueba pasa, publica `public/` en GitHub Pages y vuelve a ejecutar k6 contra la URL real. Los resultados se conservan 14 días como artefactos. El despliegue requiere configurar Pages con origen **GitHub Actions** en este repositorio nuevo. No se modifica ningún laboratorio anterior.

La prueba pública comprueba el despliegue en ese momento; un fallo posterior al despliegue no revierte automáticamente la publicación. La duración HTTP es descriptiva: no se impone ni se promete un SLA de latencia.

## Evidencia y publicaciones

La implementación y los ensayos locales se preparan antes de integrar el PR. La URL pública, la ejecución de despliegue y los nuevos artículos y video se incorporarán cuando estén verificados. La existencia del workflow no acredita que el despliegue ya haya ocurrido.

Referencias: [checks](https://grafana.com/docs/k6/latest/using-k6/checks/), [thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/) y [GitHub Pages con workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

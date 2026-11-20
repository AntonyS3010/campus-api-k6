import http from 'k6/http';
import { check, group } from 'k6';

const base = (__ENV.BASE_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
export const options = {
  vus: 1, iterations: 1,
  thresholds: { checks: ['rate==1'], http_req_failed: ['rate==0'] }
};
function get(path, expected = 200) {
  return http.get(base + path, {
    headers: { Accept: 'application/json' }, timeout: '10s', redirects: 0,
    responseCallback: http.expectedStatuses(expected), tags: { name: path }
  });
}
function json(response) { try { return response.json(); } catch { return null; } }
function validCourse(c) {
  return c !== null && typeof c === 'object' && /^C\d{2}$/.test(c.codigo) &&
    typeof c.nombre === 'string' && c.nombre.trim().length > 0 &&
    Number.isInteger(c.creditos) && c.creditos >= 1 && c.creditos <= 10;
}
export default function () {
  group('Servicio', () => {
    const r = get('/api/estado.json'); const body = json(r);
    check(r, { 'estado HTTP 200': r => r.status === 200,
      'estado Content-Type JSON': r => (r.headers['Content-Type'] || '').includes('application/json'),
      'estado contrato válido': () => body?.version === '1.0.0' && body?.modo === 'solo-lectura' && typeof body?.servicio === 'string' });
  });
  group('Listado y detalles', () => {
    const r = get('/api/cursos.json'); const body = json(r);
    const list = Array.isArray(body?.cursos) ? body.cursos : [];
    check(r, { 'listado HTTP 200': r => r.status === 200,
      'listado Content-Type JSON': r => (r.headers['Content-Type'] || '').includes('application/json'),
      'listado versión y colección no vacía': () => body?.version === '1.0.0' && list.length > 0,
      'cursos con campos y valores válidos': () => list.length > 0 && list.every(validCourse),
      'códigos únicos': () => list.length > 0 && new Set(list.map(c => c.codigo)).size === list.length });
    // No se construyen URLs con identificadores que no cumplen el contrato.
    for (const course of list.filter(validCourse)) {
      const detail = get(`/api/cursos/${course.codigo}.json`); const actual = json(detail);
      check(detail, { 'detalle HTTP 200': r => r.status === 200,
        'detalle Content-Type JSON': r => (r.headers['Content-Type'] || '').includes('application/json'),
        'detalle campos válidos': () => validCourse(actual),
        'detalle coherente con listado': () => actual?.codigo === course.codigo && actual?.nombre === course.nombre && actual?.creditos === course.creditos });
    }
  });
  group('Recurso inexistente', () => {
    const r = get('/api/cursos/NO-EXISTE.json', 404);
    check(r, { 'ruta inexistente devuelve HTTP 404': r => r.status === 404 });
  });
}
export function handleSummary(data) {
  const checks = data.metrics.checks.values;
  const report = { objetivo: base, comprobaciones: checks, solicitudes: data.metrics.http_reqs.values.count,
    erroresHttp: data.metrics.http_req_failed.values, duracionHttpMs: data.metrics.http_req_duration.values,
    umbrales: Object.fromEntries(Object.entries(data.metrics).filter(([,m]) => m.thresholds).map(([name,m]) => [name,m.thresholds])) };
  return { [__ENV.RESULTS_FILE || 'results.json']: JSON.stringify(report, null, 2),
    stdout: `\nAPI Testing con k6\nObjetivo: ${base}\nComprobaciones: ${checks.passes} aprobadas / ${checks.fails} fallidas\nSolicitudes: ${report.solicitudes}\nTasa de comprobaciones correctas: ${checks.rate}\nDetalle verificable: ${__ENV.RESULTS_FILE || 'results.json'}\n` };
}

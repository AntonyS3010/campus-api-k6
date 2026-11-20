const status = document.querySelector('#status');
const courses = document.querySelector('#courses');
async function load() {
  try {
    const response = await fetch('api/cursos.json');
    if (!response.ok) throw new Error('No disponible');
    const data = await response.json();
    if (!Array.isArray(data.cursos)) throw new Error('Respuesta inválida');
    for (const course of data.cursos) {
      const card = document.createElement('article'); card.className = 'course';
      const code = document.createElement('span'); code.className = 'code'; code.textContent = course.codigo;
      const title = document.createElement('h3'); title.textContent = course.nombre;
      const credits = document.createElement('p'); credits.textContent = `${course.creditos} créditos`;
      const link = document.createElement('a'); link.href = `api/cursos/${encodeURIComponent(course.codigo)}.json`; link.textContent = 'Consultar JSON ↗';
      card.append(code, title, credits, link); courses.append(card);
    }
    status.textContent = `${data.cursos.length} cursos · API consultada`;
  } catch { status.textContent = 'No se pudo consultar la API. Recarga la página.'; }
}
load();

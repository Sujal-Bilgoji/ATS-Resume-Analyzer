import './style.css';
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { $ } from './utils.js';
import { analyze } from './analyzer.js';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

$('go').onclick = () => {
  try { analyze(); } catch (e) { alert('Something went wrong: ' + e.message); }
};

// Read a PDF in the browser and rebuild its lines from text positions
async function readPdf(file) {
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  let text = '';
  for (let p = 1; p <= doc.numPages; p++) {
    const content = await (await doc.getPage(p)).getTextContent();
    let y = null, line = '';
    content.items.forEach((i) => {
      const yy = Math.round(i.transform[5]);
      if (y !== null && Math.abs(yy - y) > 3) { text += line.trim() + '\n'; line = ''; }
      y = yy;
      line += i.str + (i.hasEOL ? '\n' : ' ');
    });
    text += line.trim() + '\n';
  }
  return { text: text.replace(/\n{3,}/g, '\n\n'), pages: doc.numPages };
}

$('pdf').onchange = async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  $('st').textContent = 'Reading...';
  try {
    if (f.name.endsWith('.txt')) { $('res').value = await f.text(); $('st').textContent = 'Loaded'; return; }
    const { text, pages } = await readPdf(f);
    $('res').value = text;
    $('st').textContent = `Loaded ${pages} page(s). Check the text looks right.`;
  } catch (err) {
    $('st').textContent = 'Could not read this PDF. Please paste the text instead.';
  }
};

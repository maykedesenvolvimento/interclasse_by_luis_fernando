/* horarios.js - Sistema de gerenciamento de horários do Interclasse
 * Corrigido para funcionar com localStorage e fallback embutido
 */

/* DADOS PADRÃO EMBUTIDOS */
const FALLBACK_DATA = {
  "version": "1.2",
  "last_updated": "2025-12-15T15:01:20.845Z",
  "metadata": {
    "description": "Dados do Interclasse IFTM 2025",
    "edit_mode": {
      "enabled_via_query": true,
      "query_parameter": "admin",
      "value_to_enable": "true",
      "example": "horarios.html?admin=true"
    }
  },
  "title": "Tabela de Horários dos Jogos",
  "event": "Interclasse 2025",
  "location": "IFTM Paracatu",
  "schedule": [],
  "info": [
    "Haverá tolerância de 15 minutos somente para o início do primeiro jogo",
    "Jogos de Futsal: 2 tempos de 7 minutos + 1 minuto de intervalo (15 min total)",
    "Jogos de Basquetebol: 2 tempos de 6 minutos + 3 minutos de intervalo (15 min total)",
    "Alunos em recuperação deverão realizar suas provas normalmente conforme programado",
    "É obrigatório o uso de uniforme ou camisa identificadora da equipe",
    "Respeite os adversários, árbitros e organize a torcida",
    "Em caso de dúvidas, procure a coordenação do evento"
  ]
};
/* ========== VARIÁVEIS GLOBAIS ========== */
const LOCALSTORAGE_KEY = 'horarios.interclasse.2025';
let JSON_DATA_PATH = 'Estilos completos/JSON/datasite-data.json';

// Permite trocar o arquivo JSON via querystring: ?data=Estilos%20completos/JSON/00.json
try {
  const dataParam = new URLSearchParams(window.location.search).get('data');
  if (dataParam && typeof dataParam === 'string') {
    JSON_DATA_PATH = dataParam;
    console.log('✓ Caminho JSON definido por querystring:', JSON_DATA_PATH);
  }
} catch (_) {
  // ignora se window/location não estiver disponível
}

let siteData = { schedule: [], info: [], metadata: {} };
let editMode = false;

/* ========== HELPERS ========== */
function ensureSiteData() {
  if (!siteData || typeof siteData !== 'object') {
    siteData = { schedule: [], info: [], metadata: {} };
  }
  if (!Array.isArray(siteData.schedule)) siteData.schedule = [];
  if (!Array.isArray(siteData.info)) siteData.info = [];
  if (!siteData.metadata || typeof siteData.metadata !== 'object') siteData.metadata = {};
  return siteData;
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'class') node.className = attrs[k];
    else if (k === 'html') node.innerHTML = attrs[k];
    else if (k === 'style' && typeof attrs[k] === 'object') {
      Object.assign(node.style, attrs[k]);
    } else if (k.startsWith('on') && typeof attrs[k] === 'function') {
      node.addEventListener(k.substring(2).toLowerCase(), attrs[k]);
    } else {
      node.setAttribute(k, attrs[k]);
    }
  }
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (!c) return;
    if (typeof c === 'string') node.appendChild(document.createTextNode(c));
    else node.appendChild(c);
  });
  return node;
}

/* ========== LOCALSTORAGE ========== */
function saveToLocalStorage(data) {
  try {
    data.metadata = data.metadata || {};
    data.metadata.last_updated = new Date().toISOString();
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(data));
    console.log('✓ Dados salvos no localStorage');
    return true;
  } catch (err) {
    console.error('Erro ao salvar no localStorage:', err);
    alert('Erro ao salvar: ' + err.message);
    return false;
  }
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    console.log('✓ Dados carregados do localStorage');
    return data;
  } catch (err) {
    console.error('Erro ao ler localStorage:', err);
    return null;
  }
}

async function loadFromJSON() {
  try {
    // Quando aberto diretamente via file://, a maioria dos navegadores bloqueia fetch
    // para arquivos locais por motivos de segurança (resulta em TypeError: Failed to fetch).
    // Nesse caso, pulamos a tentativa e seguimos para o localStorage/fallback.
    if (location.protocol === 'file:') {
      console.warn('Execução via file:// detectada. Navegadores bloqueiam fetch de arquivos locais. Inicie um servidor local (ex.: python3 -m http.server) para carregar o JSON externo.');
      return null;
    }
    const response = await fetch(JSON_DATA_PATH, { cache: 'no-store' });
    if (!response.ok) {
      console.warn('Arquivo JSON não encontrado:', JSON_DATA_PATH);
      return null;
    }
    const data = await response.json();
    console.log('✓ Dados carregados do JSON externo');
    return data;
  } catch (err) {
    console.error('Erro ao carregar JSON:', err);
    return null;
  }
}

function persistAndRender() {
  ensureSiteData();
  saveToLocalStorage(siteData);
  renderSchedule(siteData);
}

/* ========== RENDER ========== */
function statusClass(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('final')) return 'status-finalizado';
  if (s.includes('andam') || s.includes('andamento')) return 'status-andamento';
  return 'status-agendado';
}

function iconForModalidade(mod) {
  const m = String(mod || '').toLowerCase();
  if (m.includes('futsal') || m.includes('futebol')) return 'fas fa-futbol';
  if (m.includes('vôlei') || m.includes('volei')) return 'fas fa-volleyball-ball';
  if (m.includes('basquete')) return 'fas fa-basketball-ball';
  if (m.includes('tênis') || m.includes('tenis')) return 'fas fa-table-tennis';
  if (m.includes('xadrez')) return 'fas fa-chess';
  if (m.includes('queimada')) return 'fas fa-dumbbell';
  if (m.includes('atletismo')) return 'fas fa-running';
  if (m.includes('handebol')) return 'fas fa-hand-rock';
  if (m.includes('cerimônia') || m.includes('abertura')) return 'fas fa-bullhorn';
  return 'fas fa-futbol';
}

function renderInfoBox(info) {
  const infoRoot = document.getElementById('info-box-root');
  if (!infoRoot) return;
  infoRoot.style.display = 'block';
  infoRoot.innerHTML = '';
  const h3 = el('h3', { html: '<i class="fas fa-info-circle"></i> Informações Importantes' });
  const ul = el('ul');
  info.forEach(text => {
    const li = el('li', {}, [el('i', { class: 'fas fa-check-circle' }), ' ', text]);
    ul.appendChild(li);
  });
  infoRoot.appendChild(h3);
  infoRoot.appendChild(ul);
}

function renderSchedule(data) {
  const root = document.getElementById('schedule-root');
  if (!root) return;

  const safeData = ensureSiteData();
  const current = data && typeof data === 'object' ? data : safeData;
  const schedule = Array.isArray(current.schedule) ? current.schedule : [];

  // Título e subtítulo dinâmicos a partir do JSON
  try {
    const titleEl = document.getElementById('page-title');
    const subEl = document.getElementById('page-subtitle');
    if (titleEl && current.title) titleEl.innerText = current.title;
    if (subEl) {
      const parts = [];
      if (current.event) parts.push(current.event);
      if (current.location) parts.push(current.location);
      if (parts.length) subEl.innerText = parts.join(' - ');
    }
    if (current.title) document.title = current.title;
  } catch (_) { /* no-op */ }

  root.innerHTML = '';

  schedule.forEach((day, dayIdx) => {
    const section = el('div', { class: 'schedule-section' });
    const h2 = el('h2', { html: `<i class="fas fa-calendar-day"></i> ${day.weekday} - ${day.date}` });
    section.appendChild(h2);

    const tableContainer = el('div', { class: 'table-container' });
    const table = el('table');
    const thead = el('thead');
    thead.innerHTML = `<tr>
      <th>Horário</th>
      <th>Modalidade</th>
      <th>Confronto</th>
      <th>Placar</th>
      <th>Local</th>
      <th>Status</th>
      ${editMode ? '<th style="width:120px">Ações</th>' : ''}
    </tr>`;
    table.appendChild(thead);

    const tbody = el('tbody');
    (day.matches || []).forEach((m, matchIdx) => {
      const tr = el('tr');
      tr.appendChild(el('td', { class: 'time-cell' }, m.time));
      tr.appendChild(el('td', {}, [el('i', { class: iconForModalidade(m.modalidade) }), ' ', m.modalidade]));
      tr.appendChild(el('td', { class: 'team-cell' }, m.confronto));

      const scoreTd = el('td', { class: 'score-cell', style: 'font-weight:bold; color:#1976d2;' });
      if (m.score1 || m.score2) {
        scoreTd.innerText = `${m.score1 || '-'} x ${m.score2 || '-'}`;
      } else {
        scoreTd.innerText = '-';
      }
      tr.appendChild(scoreTd);

      tr.appendChild(el('td', { class: 'location-cell' }, m.local));
      tr.appendChild(el('td', {}, [el('span', { class: `status-badge ${statusClass(m.status)}` }, m.status)]));

      if (editMode) {
        const actionsTd = el('td');
        const editBtn = el('button', {
          class: 'back-button',
          style: 'background:#3ea14c; padding:6px 8px; margin-right:6px;',
          onclick: () => openEditMatchForm(dayIdx, matchIdx)
        }, [el('i', { class: 'fas fa-pen' }), ' Editar']);

        const delBtn = el('button', {
          class: 'back-button',
          style: 'background:#c62828; padding:6px 8px;',
          onclick: () => {
            if (!confirm('Remover essa partida?')) return;
            siteData.schedule[dayIdx].matches.splice(matchIdx, 1);
            persistAndRender();
          }
        }, [el('i', { class: 'fas fa-trash' }), ' Excluir']);

        actionsTd.appendChild(editBtn);
        actionsTd.appendChild(delBtn);
        tr.appendChild(actionsTd);
      }

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    tableContainer.appendChild(table);
    section.appendChild(tableContainer);

    if (editMode) {
      const dayControls = el('div', { style: { display: 'flex', gap: '8px', marginBottom: '1.25rem', flexWrap: 'wrap' } });

      dayControls.appendChild(el('button', {
        class: 'back-button',
        style: 'background:#1976d2;',
        onclick: () => openAddMatchForm(dayIdx)
      }, [el('i', { class: 'fas fa-plus' }), ' Adicionar Jogo']));

      dayControls.appendChild(el('button', {
        class: 'back-button',
        style: 'background:#928f90;',
        onclick: () => openEditDayForm(dayIdx)
      }, [el('i', { class: 'fas fa-edit' }), ' Editar Dia']));

      dayControls.appendChild(el('button', {
        class: 'back-button',
        style: 'background:#c62828;',
        onclick: () => {
          if (!confirm('Remover este dia e todos os jogos nele?')) return;
          siteData.schedule.splice(dayIdx, 1);
          persistAndRender();
        }
      }, [el('i', { class: 'fas fa-trash' }), ' Remover Dia']));

      section.appendChild(dayControls);
    }

    root.appendChild(section);
  });

  renderInfoBox(current.info || safeData.info || []);

  const modeLabel = document.getElementById('mode-label');
  if (modeLabel) modeLabel.innerText = editMode ? 'Edição' : 'Visualização';
}

/* ========== FORMS ========== */
function openMatchForm(title, dataObj, onSave) {
  const modal = el('div', { class: 'modal', style: 'display:block; z-index:3000;' });
  const content = el('div', { class: 'modal-content' });

  const closeBtn = el('span', {
    class: 'close',
    style: 'cursor:pointer;',
    onclick: () => document.body.removeChild(modal)
  }, '×');

  content.appendChild(closeBtn);
  content.appendChild(el('h2', {}, [el('i', { class: 'fas fa-edit' }), ' ', title]));

  const form = el('div');
  const inputs = {};

  ['time', 'modalidade', 'confronto', 'local', 'status', 'score1', 'score2'].forEach(key => {
    let displayKey = key;
    if (key === 'score1') displayKey = 'Placar - Time 1';
    if (key === 'score2') displayKey = 'Placar - Time 2';
    else displayKey = key.charAt(0).toUpperCase() + key.slice(1);

    const label = el('label', { style: 'display:block; margin-top:8px; font-weight:600;' }, displayKey);
    const input = el('input', {
      type: key.includes('score') ? 'number' : 'text',
      value: dataObj[key] || '',
      style: 'width:100%; padding:8px; margin-top:4px; border-radius:6px; border:1px solid #ddd;'
    });
    inputs[key] = input;
    form.appendChild(label);
    form.appendChild(input);
  });

  const btnBar = el('div', { style: { marginTop: '12px', display: 'flex', gap: '8px' } });

  btnBar.appendChild(el('button', {
    class: 'back-button',
    style: 'background:#3ea14c;',
    onclick: () => {
      const newMatch = {
        time: inputs.time.value.trim(),
        modalidade: inputs.modalidade.value.trim(),
        confronto: inputs.confronto.value.trim(),
        local: inputs.local.value.trim(),
        status: inputs.status.value.trim() || 'Agendado',
        score1: inputs.score1.value.trim() || '',
        score2: inputs.score2.value.trim() || ''
      };
      onSave(newMatch);
      document.body.removeChild(modal);
    }
  }, 'Salvar'));

  btnBar.appendChild(el('button', {
    class: 'back-button',
    style: 'background:#c62828;',
    onclick: () => document.body.removeChild(modal)
  }, 'Cancelar'));

  content.appendChild(form);
  content.appendChild(btnBar);
  modal.appendChild(content);
  document.body.appendChild(modal);
}

function openAddMatchForm(dayIdx) {
  ensureSiteData();
  if (!siteData.schedule[dayIdx]) {
    siteData.schedule[dayIdx] = { weekday: '', date: '', matches: [] };
  }
  const template = { time: '', modalidade: '', confronto: '', local: '', status: 'Agendado', score1: '', score2: '' };
  openMatchForm('Adicionar Jogo', template, (newMatch) => {
    siteData.schedule[dayIdx].matches.push(newMatch);
    persistAndRender();
  });
}

function openEditMatchForm(dayIdx, matchIdx) {
  ensureSiteData();
  if (!siteData.schedule[dayIdx] || !siteData.schedule[dayIdx].matches) {
    alert('Não há partidas para editar neste dia.');
    return;
  }
  const existing = Object.assign({}, siteData.schedule[dayIdx].matches[matchIdx]);
  openMatchForm('Editar Jogo', existing, (updated) => {
    siteData.schedule[dayIdx].matches[matchIdx] = updated;
    persistAndRender();
  });
}

function openDayForm(title, defaultDay, onSave) {
  const modal = el('div', { class: 'modal', style: 'display:block; z-index:3000;' });
  const content = el('div', { class: 'modal-content' });

  const closeBtn = el('span', {
    class: 'close',
    style: 'cursor:pointer;',
    onclick: () => document.body.removeChild(modal)
  }, '×');

  content.appendChild(closeBtn);
  content.appendChild(el('h2', {}, [el('i', { class: 'fas fa-calendar-plus' }), ' ', title]));

  const form = el('div');

  const weekdayInput = el('input', {
    type: 'text',
    value: defaultDay.weekday || '',
    placeholder: 'Segunda-feira',
    style: 'width:100%; padding:8px; margin-top:4px; border-radius:6px; border:1px solid #ddd;'
  });

  const dateInput = el('input', {
    type: 'text',
    value: defaultDay.date || '',
    placeholder: 'YYYY-MM-DD',
    style: 'width:100%; padding:8px; margin-top:8px; border-radius:6px; border:1px solid #ddd;'
  });

  form.appendChild(el('label', { style: 'display:block; margin-top:8px; font-weight:600;' }, 'Dia da semana'));
  form.appendChild(weekdayInput);
  form.appendChild(el('label', { style: 'display:block; margin-top:8px; font-weight:600;' }, 'Data'));
  form.appendChild(dateInput);

  const btnBar = el('div', { style: { marginTop: '12px', display: 'flex', gap: '8px' } });

  btnBar.appendChild(el('button', {
    class: 'back-button',
    style: 'background:#3ea14c;',
    onclick: () => {
      const newDay = {
        weekday: weekdayInput.value.trim() || 'Dia',
        date: dateInput.value.trim() || '',
        matches: defaultDay.matches || []
      };
      onSave && onSave(newDay);
      document.body.removeChild(modal);
    }
  }, 'Salvar'));

  btnBar.appendChild(el('button', {
    class: 'back-button',
    style: 'background:#c62828;',
    onclick: () => document.body.removeChild(modal)
  }, 'Cancelar'));

  content.appendChild(form);
  content.appendChild(btnBar);
  modal.appendChild(content);
  document.body.appendChild(modal);
}

function openEditDayForm(dayIdx) {
  ensureSiteData();
  const day = JSON.parse(JSON.stringify(siteData.schedule[dayIdx]));
  openDayForm('Editar Dia', day, (updatedDay) => {
    siteData.schedule[dayIdx].weekday = updatedDay.weekday;
    siteData.schedule[dayIdx].date = updatedDay.date;
    persistAndRender();
  });
}

function addDayHandler() {
  ensureSiteData();
  openDayForm('Adicionar Dia', {}, (newDay) => {
    siteData.schedule.push(newDay);
    persistAndRender();
  });
}

/* ========== IMPORT/EXPORT ========== */
function exportJSON() {
  ensureSiteData();
  siteData.metadata = siteData.metadata || {};
  siteData.metadata.last_updated = new Date().toISOString();
  saveToLocalStorage(siteData);

  const blob = new Blob([JSON.stringify(siteData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'horarios.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  alert('JSON exportado com sucesso!');
}

function importJSONFile(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!parsed.schedule || !Array.isArray(parsed.schedule)) {
        alert('Arquivo JSON inválido: falta a propriedade "schedule".');
        return;
      }
      siteData = parsed;
      saveToLocalStorage(siteData);
      renderSchedule(siteData);
      alert('Importação concluída e salva localmente!');
    } catch (err) {
      alert('Erro ao ler JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
}

/* ========== EDIT MODE ========== */
function setEditMode(on) {
  editMode = !!on;
  ensureSiteData();
  const modeLabel = document.getElementById('mode-label');
  if (modeLabel) modeLabel.innerText = editMode ? 'Edição' : 'Visualização';
  renderSchedule(siteData);
}

/* ========== INITIALIZATION ========== */
function initPage() {
  const initialAdmin = new URLSearchParams(window.location.search).get('admin') === 'true';
  const controlsBar = document.getElementById('controls-bar');

  if (!initialAdmin) {
    if (controlsBar) controlsBar.style.display = 'none';
  } else {
    if (controlsBar) controlsBar.style.display = 'flex';
  }

  // Wire buttons
  const toggleBtn = document.getElementById('toggle-edit-btn');
  const addDayBtn = document.getElementById('add-day-btn');
  const exportBtn = document.getElementById('export-btn');
  const importBtn = document.getElementById('import-btn');
  const importFile = document.getElementById('import-file');

  if (toggleBtn) toggleBtn.addEventListener('click', () => setEditMode(!editMode));
  if (addDayBtn) addDayBtn.addEventListener('click', () => {
    if (!editMode) {
      alert('Ative o modo de edição antes de adicionar um dia.');
      return;
    }
    addDayHandler();
  });
  if (exportBtn) exportBtn.addEventListener('click', exportJSON);
  if (importBtn) importBtn.addEventListener('click', () => { if (importFile) importFile.click(); });
  if (importFile) importFile.addEventListener('change', (ev) => {
    const f = ev.target.files[0];
    if (!f) return;
    importJSONFile(f);
    ev.target.value = '';
  });

  // Load data priority: JSON externo > localStorage > FALLBACK
  (async () => {
    let jsonData = await loadFromJSON();
    if (jsonData && jsonData.schedule && Array.isArray(jsonData.schedule)) {
      siteData = jsonData;
      saveToLocalStorage(siteData);
      renderSchedule(siteData);
      setEditMode(initialAdmin);
      return;
    }

    const stored = loadFromLocalStorage();
    if (stored && stored.schedule && Array.isArray(stored.schedule)) {
      siteData = stored;
      console.log('✓ Usando dados do localStorage');
    } else {
      siteData = JSON.parse(JSON.stringify(FALLBACK_DATA));
      console.log('✓ Usando dados embutidos (fallback)');
      saveToLocalStorage(siteData);
    }

    renderSchedule(siteData);
    setEditMode(initialAdmin);
  })();

  // ESC to close modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal').forEach(m => {
        if (m.parentNode === document.body && m.style.display === 'block') {
          document.body.removeChild(m);
        }
      });
    }
  });
}

/* Run when DOM ready */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPage);
} else {
  initPage();
}
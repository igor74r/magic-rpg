// Runtime diagnostics: captures uncaught errors, rejected promises and failed resources.
const MAX_DIAGNOSTICS = 100;
const captured = [];
let initialized = false;

function describeResource(target) {
  const tag = target?.tagName?.toLowerCase() || 'resource';
  const url = target?.src || target?.href || '';
  return `Не удалось загрузить ресурс <${tag}> ${url}`.trim();
}

function normalizeError(type, message, details = {}) {
  return {
    type,
    message: String(message || type).slice(0, 1000),
    source: String(details.source || '').slice(0, 500),
    line: Number(details.line) || 0,
    column: Number(details.column) || 0,
    time: new Date().toISOString()
  };
}

function record(entry) {
  captured.push(entry);
  if (captured.length > MAX_DIAGNOSTICS) captured.shift();
  window.__GAME_DIAGNOSTICS__ = captured;
  try {
    console.error('[Game diagnostics]', entry.type, entry.message, entry.source, entry.line || '');
  } catch {}
  updateIndicator();
}

function updateIndicator() {
  const button = document.getElementById('game-diagnostics-button');
  if (!button) return;
  button.hidden = captured.length === 0;
  button.textContent = `⚠ Ошибки: ${captured.length}`;
  button.setAttribute('aria-label', `Открыть журнал ошибок: ${captured.length}`);
}

function showReport() {
  let dialog = document.getElementById('game-diagnostics-dialog');
  if (!dialog) {
    dialog = document.createElement('section');
    dialog.id = 'game-diagnostics-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'game-diagnostics-title');
    dialog.style.cssText = 'position:fixed;z-index:100000;inset:8% 5%;overflow:auto;padding:20px;background:#17151d;color:#f4e9d8;border:1px solid #a85b61;border-radius:12px;box-shadow:0 12px 60px #000c;font:14px/1.5 system-ui;';
    document.body.appendChild(dialog);
  }
  const rows = captured.map((item, index) => {
    const details = [item.source, item.line ? `строка ${item.line}:${item.column}` : '', item.time].filter(Boolean).join(' · ');
    return `<article style="padding:10px 0;border-bottom:1px solid #49414d"><strong>${index + 1}. ${escapeText(item.type)}</strong><p>${escapeText(item.message)}</p><small>${escapeText(details)}</small></article>`;
  }).join('');
  dialog.innerHTML = `<h2 id="game-diagnostics-title">Журнал ошибок игры</h2><p>Ошибки выполнения и неудачной загрузки ресурсов. Данные хранятся только в памяти текущей вкладки.</p>${rows || '<p>Ошибок нет.</p>'}<button id="game-diagnostics-close" type="button" style="padding:10px 18px;margin-top:12px">Закрыть</button> <button id="game-diagnostics-copy" type="button" style="padding:10px 18px;margin-top:12px">Скопировать журнал</button>`;
  dialog.hidden = false;
  dialog.querySelector('#game-diagnostics-close').onclick = () => { dialog.hidden = true; };
  dialog.querySelector('#game-diagnostics-copy').onclick = async () => {
    const text = captured.map(e => `[${e.type}] ${e.message} ${e.source}:${e.line}:${e.column} ${e.time}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      dialog.querySelector('#game-diagnostics-copy').textContent = 'Скопировано';
    } catch {
      dialog.querySelector('#game-diagnostics-copy').textContent = 'Копирование недоступно';
    }
  };
}

function escapeText(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

export function initDiagnostics() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  // Reuse errors captured by the tiny head bootstrap (before game modules loaded).
  const early = Array.isArray(window.__GAME_DIAGNOSTICS_EARLY__) ? window.__GAME_DIAGNOSTICS_EARLY__ : [];
  early.forEach(entry => record(entry));
  window.__GAME_DIAGNOSTICS_EARLY__ = [];

  window.addEventListener('error', event => {
    if (event.target && event.target !== window && (event.target.src || event.target.href)) {
      record(normalizeError('resource-load', describeResource(event.target), {
        source: event.target.src || event.target.href
      }));
      return;
    }
    record(normalizeError('uncaught-error', event.message || 'Необработанная ошибка JavaScript', {
      source: event.filename, line: event.lineno, column: event.colno
    }));
  });

  window.addEventListener('unhandledrejection', event => {
    const reason = event.reason;
    const message = reason?.stack || reason?.message || String(reason ?? 'Promise отклонён без причины');
    record(normalizeError('unhandled-rejection', message));
  });

  const button = document.createElement('button');
  button.id = 'game-diagnostics-button';
  button.type = 'button';
  button.hidden = true;
  button.style.cssText = 'position:fixed;z-index:99999;right:12px;bottom:12px;padding:9px 13px;border:1px solid #d77b72;border-radius:8px;background:#381d22;color:#fff;font:600 13px system-ui;cursor:pointer;';
  button.addEventListener('click', showReport);
  document.body.appendChild(button);
  updateIndicator();
}

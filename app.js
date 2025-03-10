(function() {
  'use strict';

  // ==============================
  // Solicitação de permissão para notificações
  // ==============================
  function requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('Este navegador não suporta notificações.');
      return;
    }
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Permissão para notificações:', permission);
      });
    }
  }

  // Chama a função ao iniciar o script
  requestNotificationPermission();

  // ==============================
  // Função para disparar a notificação nativa de um novo evento
  // ==============================
  function notifyEvent(event) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    new Notification('Novo Evento Adicionado', {
      body: `Evento: ${event.title}\n${event.desc ? event.desc : ''}`,
      icon: 'icone.png' // Opcional: caminho para um ícone
    });
  }

  // ==============================
  // Função para notificar que o dia do evento chegou
  // ==============================
  function notifyTodayEvent(event) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    new Notification('Hoje é o dia do seu evento!', {
      body: `Evento: ${event.title}\n${event.desc ? event.desc : ''}`,
      icon: 'icone.png'
    });
  }

  // ==============================
  // Função que verifica se há eventos para o dia atual
  // ==============================
  function checkTodayEvents() {
    const todayDateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const events = getEvents();
    if (events[todayDateStr] && events[todayDateStr].length > 0) {
      events[todayDateStr].forEach(evt => {
        notifyTodayEvent(evt);
      });
    }
  }

  // Variável para garantir que a notificação dos eventos do dia seja disparada apenas uma vez por dia
  let lastNotifiedDate = '';

  // Função para atualizar a data atual e disparar notificações se o dia mudou
  function updateCurrentDateAndNotify() {
    const now = new Date();
    const todayStr = formatDate(now.getFullYear(), now.getMonth(), now.getDate());
    // Se o dia mudou em relação à última notificação, atualiza e verifica eventos
    if (todayStr !== lastNotifiedDate) {
      currentDate = now;
      currentMonth = now.getMonth();
      currentYear = now.getFullYear();
      renderCalendar(currentMonth, currentYear);
      checkTodayEvents();
      lastNotifiedDate = todayStr;
    }
  }

  // Verifica a cada 60 segundos se o dia mudou
  setInterval(updateCurrentDateAndNotify, 60000);

  // ========================
  // Seletores
  // ========================
  const monthYearEl = document.getElementById('monthYear');
  const calendarDaysEl = document.getElementById('calendarDays');
  const prevMonthBtn = document.getElementById('prevMonth');
  const nextMonthBtn = document.getElementById('nextMonth');
  const todayBtn = document.getElementById('todayBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const clearBtn = document.getElementById('clearBtn');
  const modalOverlay = document.getElementById('modalOverlay');
  const closeModalBtn = document.getElementById('closeModal');
  const modalDateTitle = document.getElementById('modalDateTitle');
  const eventForm = document.getElementById('eventForm');
  const eventTitleInput = document.getElementById('eventTitle');
  const eventDescInput = document.getElementById('eventDesc');
  const eventListEl = document.getElementById('eventList');

  let currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();
  let selectedDateStr = '';

  // ========================
  // Função para formatar a data (YYYY-MM-DD)
  // ========================
  function formatDate(year, month, day) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }

  // ========================
  // Manipulação segura do localStorage
  // ========================
  function getEvents() {
    try {
      return JSON.parse(localStorage.getItem('calendarEvents')) || {};
    } catch (e) {
      console.error('Erro ao ler eventos:', e);
      return {};
    }
  }

  function saveEvents(events) {
    try {
      localStorage.setItem('calendarEvents', JSON.stringify(events));
    } catch (e) {
      console.error('Erro ao salvar eventos:', e);
    }
  }

  // ========================
  // Renderiza o calendário e insere indicadores de evento
  // ========================
  function renderCalendar(month, year) {
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    monthYearEl.textContent = `${monthNames[month]} ${year}`;
    calendarDaysEl.innerHTML = '';

    const firstDay = new Date(year, month, 1);
    const totalDays = new Date(year, month + 1, 0).getDate();
    const startDayIndex = firstDay.getDay();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    const events = getEvents();

    // Dias do mês anterior (inativos)
    for (let i = startDayIndex; i > 0; i--) {
      const dayEl = document.createElement('div');
      dayEl.classList.add('calendar__days__item', 'calendar__days__item--inactive');
      dayEl.textContent = prevMonthTotalDays - i + 1;
      calendarDaysEl.appendChild(dayEl);
    }

    // Dias do mês atual
    for (let day = 1; day <= totalDays; day++) {
      const dayEl = document.createElement('div');
      dayEl.classList.add('calendar__days__item');
      dayEl.textContent = day;
      const dateStr = formatDate(year, month, day);

      // Exibe indicador se houver evento
      if (events[dateStr] && events[dateStr].length > 0) {
        const indicator = document.createElement('div');
        indicator.classList.add('calendar__event-indicator');
        dayEl.appendChild(indicator);
      }

      // Destaque para o dia atual
      if (year === currentDate.getFullYear() &&
          month === currentDate.getMonth() &&
          day === currentDate.getDate()) {
        dayEl.classList.add('calendar__days__item--active');
      }

      dayEl.tabIndex = 0;
      dayEl.addEventListener('click', () => openModal(dateStr));
      dayEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') openModal(dateStr);
      });
      calendarDaysEl.appendChild(dayEl);
    }

    // Preenche a última linha se necessário
    const cellsFilled = startDayIndex + totalDays;
    const remainingCells = (7 - (cellsFilled % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      const dayEl = document.createElement('div');
      dayEl.classList.add('calendar__days__item', 'calendar__days__item--inactive');
      dayEl.textContent = i;
      calendarDaysEl.appendChild(dayEl);
    }
  }

  // ========================
  // Modal para eventos
  // ========================
  function openModal(dateStr) {
    selectedDateStr = dateStr;
    modalDateTitle.textContent = `Eventos para ${dateStr}`;
    eventTitleInput.value = '';
    eventDescInput.value = '';
    loadEventList();
    modalOverlay.classList.add('active');
    eventTitleInput.focus();
  }

  function closeModal() {
    modalOverlay.classList.remove('active');
  }

  function loadEventList() {
    const events = getEvents();
    eventListEl.innerHTML = '';

    if (events[selectedDateStr] && events[selectedDateStr].length > 0) {
      events[selectedDateStr].forEach((evt, index) => {
        const item = document.createElement('div');
        item.classList.add('modal__event-item');
        item.innerHTML = `<span><strong>${evt.title}</strong> - ${evt.desc || ''}</span>
                          <button class="modal__event-item-btn" title="Excluir" data-index="${index}">&times;</button>`;
        item.querySelector('button').addEventListener('click', () => deleteEvent(selectedDateStr, index));
        eventListEl.appendChild(item);
      });
    } else {
      eventListEl.innerHTML = '<p>Nenhum evento cadastrado para este dia.</p>';
    }
  }

  eventForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = eventTitleInput.value.trim();
    const desc = eventDescInput.value.trim();
    if (!title) return;

    const events = getEvents();
    if (!events[selectedDateStr]) {
      events[selectedDateStr] = [];
    }
    const newEvent = { title, desc };
    events[selectedDateStr].push(newEvent);
    saveEvents(events);
    loadEventList();
    renderCalendar(currentMonth, currentYear);

    // Dispara a notificação nativa do novo evento
    notifyEvent(newEvent);
  });

  function deleteEvent(dateStr, index) {
    const events = getEvents();
    if (events[dateStr]) {
      events[dateStr].splice(index, 1);
      saveEvents(events);
      loadEventList();
      renderCalendar(currentMonth, currentYear);
    }
  }

  // ========================
  // Controles de exportação, importação e limpeza dos eventos
  // ========================
  exportBtn.addEventListener('click', () => {
    const events = getEvents();
    const dataStr = JSON.stringify(events, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'calendarEvents.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  importBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const importedEvents = JSON.parse(evt.target.result);
          if (typeof importedEvents === 'object' && importedEvents !== null) {
            saveEvents(importedEvents);
            renderCalendar(currentMonth, currentYear);
          }
        } catch (error) {
          console.error('Erro ao importar o arquivo.', error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });

  clearBtn.addEventListener('click', () => {
    if (confirm('Você deseja realmente limpar todos os eventos? Essa ação não pode ser desfeita.')) {
      localStorage.removeItem('calendarEvents');
      renderCalendar(currentMonth, currentYear);
    }
  });

  // ========================
  // Navegação do calendário
  // ========================
  prevMonthBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar(currentMonth, currentYear);
  });

  nextMonthBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar(currentMonth, currentYear);
  });

  todayBtn.addEventListener('click', () => {
    currentDate = new Date();
    currentMonth = currentDate.getMonth();
    currentYear = currentDate.getFullYear();
    renderCalendar(currentMonth, currentYear);
  });

  closeModalBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // ========================
  // Renderiza o calendário inicialmente e verifica eventos do dia
  // ========================
  renderCalendar(currentMonth, currentYear);
  // Notifica os eventos do dia atual assim que a página carrega
  lastNotifiedDate = formatDate(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  checkTodayEvents();
})();


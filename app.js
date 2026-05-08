document.addEventListener('DOMContentLoaded', () => {
    const noteTitle = document.getElementById('noteTitle');
    const noteInput = document.getElementById('noteInput');
    const categorySelect = document.getElementById('categorySelect');
    const saveBtn = document.getElementById('saveBtn');
    const notesList = document.getElementById('notesList');
    const searchInput = document.getElementById('searchInput');
    const micBtn = document.getElementById('micBtn');

    let notes = [];

    // Inicialização
    loadNotesFromStorage();
    renderNotes(notes);

    // --- SALVAR NOTA ---
    saveBtn.addEventListener('click', () => {
        const text = noteInput.value.trim();
        const title = noteTitle.value.trim();
        const category = categorySelect.value;
        
        // Captura a data e hora atual no formato brasileiro
        const now = new Date();
        const timestamp = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});

        if (text || title) { // Permite salvar se tiver título OU texto
            const newNote = {
                id: Date.now(),
                title: title,
                text: text,
                category: category,
                timestamp: timestamp
            };
            
            notes.push(newNote);
            saveToStorage();
            
            // Limpa os campos
            noteInput.value = ''; 
            noteTitle.value = '';
            searchInput.value = ''; 
            renderNotes(notes);
        }
    });

    // --- BUSCA E FILTRO ---
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredNotes = notes.filter(note => {
            const tText = note.text ? note.text.toLowerCase() : '';
            const tTitle = note.title ? note.title.toLowerCase() : '';
            return tText.includes(searchTerm) || 
                   tTitle.includes(searchTerm) || 
                   note.category.toLowerCase().includes(searchTerm);
        });
        renderNotes(filteredNotes);
    });

    // --- RENDERIZAÇÃO ---
    function renderNotes(notesToRender) {
        notesList.innerHTML = '';
        
        if(notesToRender.length === 0) {
            notesList.innerHTML = '<p style="text-align:center; color:#999; margin-top:10px;">Nenhuma anotação encontrada.</p>';
            return;
        }

        // Ícone SVG de lixeira (FontAwesome Base)
        const trashIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>`;

        [...notesToRender].reverse().forEach(note => {
            const li = document.createElement('li');
            const tagClass = `tag-${note.category.toLowerCase()}`;
            
            // Tratamento para notas antigas que não tinham esses campos
            const displayTitle = note.title || '';
            const displayTime = note.timestamp || 'Data desconhecida';

            // O atributo contenteditable="true" é o que permite a edição inline.
            // O evento onblur aciona a função de atualização quando o usuário clica fora do texto.
            li.innerHTML = `
                <div class="note-header-card">
                    <div class="note-meta">
                        <span class="tag ${tagClass}">${note.category}</span>
                        <span class="note-date">${displayTime}</span>
                    </div>
                    <button class="delete-btn" onclick="removeNoteById(${note.id})" aria-label="Excluir Nota">${trashIcon}</button>
                </div>
                <div class="note-body">
                    <div class="note-title-display" contenteditable="true" onblur="updateNoteField(${note.id}, 'title', this.innerText)" data-placeholder="Sem título">${displayTitle}</div>
                    <div class="note-text-display" contenteditable="true" onblur="updateNoteField(${note.id}, 'text', this.innerText)">${note.text}</div>
                </div>
            `;
            
            notesList.appendChild(li);
        });
    }

    // --- FUNÇÕES GLOBAIS DE DADOS ---
    function saveToStorage() {
        localStorage.setItem('myNotesApp', JSON.stringify(notes));
    }

    function loadNotesFromStorage() {
        const stored = localStorage.getItem('myNotesApp');
        if (stored) {
            let parsed = JSON.parse(stored);
            notes = parsed.map(item => {
                if (typeof item === 'string') {
                    return { id: Date.now() + Math.random(), text: item, category: 'Geral', title: '', timestamp: '' };
                }
                return item;
            });
        }
    }

    // Função para deletar nota
    window.removeNoteById = function(id) {
        notes = notes.filter(note => note.id !== id);
        saveToStorage();
        renderNotes(notes);
    };

    // Função de Edição Inline
    window.updateNoteField = function(id, field, newValue) {
        const noteIndex = notes.findIndex(n => n.id === id);
        if (noteIndex > -1) {
            notes[noteIndex][field] = newValue.trim();
            saveToStorage();
        }
    };

    // --- RECONHECIMENTO DE VOZ (API) ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'pt-BR';
        recognition.interimResults = false;

        let isRecording = false;

        recognition.onstart = () => {
            isRecording = true;
            micBtn.classList.add('recording');
            micBtn.textContent = '🛑';
            noteInput.placeholder = "Ouvindo... Fale agora.";
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const currentText = noteInput.value;
            noteInput.value = currentText ? currentText + ' ' + transcript : transcript;
        };

        recognition.onerror = () => {
            resetMicBtn();
            noteInput.placeholder = "Erro ao capturar áudio.";
        };

        recognition.onend = () => resetMicBtn();

        micBtn.addEventListener('click', () => {
            isRecording ? recognition.stop() : recognition.start();
        });

        function resetMicBtn() {
            isRecording = false;
            micBtn.classList.remove('recording');
            micBtn.textContent = '🎤';
            noteInput.placeholder = "Escreva sua anotação aqui...";
        }
    } else {
        micBtn.style.display = 'none';
    }
});
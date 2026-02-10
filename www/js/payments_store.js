/**
 * payments_store.js
 * Capa de Datos (Model).
 * Responsabilidad: Gestión del estado (State Management) y persistencia (DB).
 */
(function() {
    
    const STORE_KEY = 'app_events_store';

    const PaymentsStore = {
        state: {
            allEvents: [],
            currentEventId: null
        },
        db: null,

        // --- INICIALIZACIÓN ---
        init: async (databaseInstance) => {
            PaymentsStore.db = databaseInstance;
            try {
                const data = await PaymentsStore.db.find(STORE_KEY);
                if (data && data.list) {
                    PaymentsStore.state.allEvents = data.list;
                }
            } catch (e) {
                console.warn("Store: Sin datos previos o error DB", e);
                PaymentsStore.state.allEvents = [];
            }
        },

        save: async () => {
            const payload = { 
                email: STORE_KEY, 
                list: PaymentsStore.state.allEvents, 
                lastUpdate: Date.now() 
            };
            try {
                await PaymentsStore.db.update(STORE_KEY, payload);
            } catch (err) {
                await PaymentsStore.db.insert(payload);
            }
        },

        // --- GETTERS (Lectura) ---
        getAllEvents: () => PaymentsStore.state.allEvents,
        
        getCurrentEvent: () => {
            return PaymentsStore.state.allEvents.find(e => e.id === PaymentsStore.state.currentEventId);
        },

        getWalker: (walkerId) => {
            const ev = PaymentsStore.getCurrentEvent();
            if (!ev) return null;
            return ev.walkers.find(w => w.id === walkerId);
        },

        setCurrentEvent: (id) => { PaymentsStore.state.currentEventId = id; },

        // --- ACCIONES DE EVENTOS ---
        addEvent: async (eventData) => {
            PaymentsStore.state.allEvents.unshift(eventData);
            await PaymentsStore.save();
            return eventData;
        },

        deleteEvent: async (id) => {
            PaymentsStore.state.allEvents = PaymentsStore.state.allEvents.filter(e => e.id !== id);
            if (PaymentsStore.state.currentEventId === id) PaymentsStore.state.currentEventId = null;
            await PaymentsStore.save();
        },

        updateCurrentEvent: async (updates) => {
            const ev = PaymentsStore.getCurrentEvent();
            if (!ev) return;
            Object.assign(ev, updates); // Mezcla los cambios
            await PaymentsStore.save();
        },

        replaceData: async (newData) => {
            if(Array.isArray(newData)) {
                PaymentsStore.state.allEvents = newData;
                await PaymentsStore.save();
            }
        },

        // --- ACCIONES DE CAMINANTES ---
        addWalker: async (walkerData) => {
            const ev = PaymentsStore.getCurrentEvent();
            if (!ev) return;
            ev.walkers.push(walkerData);
            await PaymentsStore.save();
        },

        updateWalker: async (walkerId, field, value) => {
            const walker = PaymentsStore.getWalker(walkerId);
            if (!walker) return;
            
            if (field === 'nombre') {
                // Lógica de formateo de nombre dentro del Store
                walker.nombre = value.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join(' ');
            } else {
                walker[field] = value;
            }
            await PaymentsStore.save(); // Nota: Podríamos hacer debounce en el controlador para no llamar esto tanto
        },

        deleteWalker: async (walkerId) => {
            const ev = PaymentsStore.getCurrentEvent();
            if (!ev) return;
            ev.walkers = ev.walkers.filter(w => w.id !== walkerId);
            await PaymentsStore.save();
        },

        // --- ACCIONES DE PAGOS ---
        addPayment: async (walkerId, paymentData) => {
            const walker = PaymentsStore.getWalker(walkerId);
            if (!walker) return;
            walker.pagos.push(paymentData);
            await PaymentsStore.save();
        },

        updatePayment: async (walkerId, paymentId, field, value, extraLogicCallback) => {
            const walker = PaymentsStore.getWalker(walkerId);
            if (!walker) return;
            const p = walker.pagos.find(x => x.id === paymentId);
            if (!p) return;

            if (field === 'monto' || field === 'exchangeRate') {
                p[field] = parseFloat(value) || 0;
            } else {
                p[field] = value;
            }
            
            // Si necesitamos retornar algo específico (como nuevo exchangeRate global)
            if (extraLogicCallback) extraLogicCallback(p);
            
            await PaymentsStore.save();
        },

        togglePaymentExpand: async (walkerId, paymentId) => {
            const walker = PaymentsStore.getWalker(walkerId);
            if (!walker) return;
            const p = walker.pagos.find(x => x.id === paymentId);
            if (p) {
                p.expanded = !p.expanded;
                await PaymentsStore.save();
            }
        },

        deletePayment: async (walkerId, paymentId) => {
            const walker = PaymentsStore.getWalker(walkerId);
            if (!walker) return;
            walker.pagos = walker.pagos.filter(x => x.id !== paymentId);
            await PaymentsStore.save();
        }
    };

    window.PaymentsStore = PaymentsStore;
})();
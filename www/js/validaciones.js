// --- VALIDADORES ---
const validators = {
    nameInput: (e) => {
        let val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '');
        if (val.length > 0) val = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
        e.target.value = val;
    },
    numberInput: (e) => { 
        e.target.value = e.target.value.replace(/\D/g, ''); 
    },
    userInput: (e) => { 
        e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, ''); 
    },
    isValidPhone: (str) => /^\d{8}$/.test(str)
};
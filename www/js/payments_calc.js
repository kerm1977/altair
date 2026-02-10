/**
 * payments_calc.js
 * Motor de cálculos financieros.
 * Responsabilidad: Matemáticas puras y conversiones de moneda.
 */
(function() {
    const PaymentsCalc = {
        
        /**
         * Calcula el total recaudado de un evento sumando todos los pagos de todos los caminantes.
         * Normaliza todo a la moneda del evento.
         */
        getEventTotal: (event, lastExchangeRate) => {
            if (!event || !event.walkers) return 0;

            return event.walkers.reduce((totalEvent, walker) => {
                const walkerTotal = PaymentsCalc.getWalkerTotal(walker, event.currency, lastExchangeRate);
                return totalEvent + walkerTotal;
            }, 0);
        },

        /**
         * Calcula cuánto ha pagado un caminante específico.
         */
        getWalkerTotal: (walker, eventCurrency, lastExchangeRate) => {
            if (!walker.pagos) return 0;

            return walker.pagos.reduce((sum, p) => {
                const monto = parseFloat(p.monto) || 0;
                // Si el pago no tiene TC guardado, usar el global
                const rate = parseFloat(p.exchangeRate) || lastExchangeRate; 
                
                // Si la moneda coincide, sumar directo
                if (p.payCurrency === eventCurrency) return sum + monto;
                
                // Conversión: 
                // Si evento es Colones (¢) y pago Dólares ($) -> Multiplicar
                // Si evento es Dólares ($) y pago Colones (¢) -> Dividir
                return sum + (eventCurrency === '¢' ? (monto * rate) : (monto / rate));
            }, 0);
        },

        /**
         * Calcula deuda y equivalentes para la ficha de detalle
         */
        getWalkerFinancials: (walker, event, lastExchangeRate) => {
            const cur = event.currency;
            const totalPagado = PaymentsCalc.getWalkerTotal(walker, cur, lastExchangeRate);
            const deuda = Math.max(0, event.price - totalPagado);

            // Equivalentes (Si el evento es en $, mostramos cuánto sería en ¢ y viceversa)
            const equivAbonado = cur === '$' 
                ? (totalPagado * lastExchangeRate) 
                : (totalPagado / lastExchangeRate);

            const equivPendiente = cur === '$'
                ? (deuda * lastExchangeRate)
                : (deuda / lastExchangeRate);

            return {
                totalPagado,
                deuda,
                equivAbonado,
                equivPendiente
            };
        }
    };

    window.PaymentsCalc = PaymentsCalc;
})();
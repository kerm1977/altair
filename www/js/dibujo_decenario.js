// ==============================================================================
// ARCHIVO: www/js/dibujo_decenario.js
// ROL: Motor de Dibujo Exclusivo (Cruz original, posiciones y SVG intacto)
// ==============================================================================

window.blendRGB = function(c1, c2, factor) {
    return [
        Math.round(c1[0] + (c2[0] - c1[0]) * factor),
        Math.round(c1[1] + (c2[1] - c1[1]) * factor),
        Math.round(c1[2] + (c2[2] - c1[2]) * factor)
    ];
};

// 🟢 VERDE TRANSITORIO A ROJISO 🔴
window.getBeadColors = function(physicalId, devotionType) {
    const r1 = [255, 179, 179], r2 = [255, 26, 26], r3 = [204, 0, 0], r4 = [102, 0, 0]; // Rojo
    const b1 = [179, 230, 255], b2 = [26, 179, 255], b3 = [0, 102, 204], b4 = [0, 51, 102]; // Azul
    
    if (devotionType === 'misericordia') {
        if (physicalId < 5) return { c1: r1.join(','), c2: r2.join(','), c3: r3.join(','), c4: r4.join(',') };
        const factor = (physicalId - 5) / 9; 
        return {
            c1: blendRGB(r1, b1, factor).join(','),
            c2: blendRGB(r2, b2, factor).join(','),
            c3: blendRGB(r3, b3, factor).join(','),
            c4: blendRGB(r4, b4, factor).join(',')
        };
    } else if (devotionType === 'nino') {
        const g1 = [200, 240, 200], g2 = [46, 204, 113], g3 = [39, 174, 96], g4 = [25, 111, 61]; 
        if (physicalId < 5) return { c1: g1.join(','), c2: g2.join(','), c3: g3.join(','), c4: g4.join(',') };
        const factor = (physicalId - 5) / 9; 
        return {
            c1: blendRGB(g1, r1, factor).join(','),
            c2: blendRGB(g2, r2, factor).join(','),
            c3: blendRGB(g3, r3, factor).join(','),
            c4: blendRGB(g4, r4, factor).join(',')
        };
    } else {
        return { c1: r1.join(','), c2: r2.join(','), c3: r3.join(','), c4: r4.join(',') };
    }
};

// --- CÁLCULO DE POSICIONES (TU MATEMÁTICA ORIGINAL INTACTA) ---
window.calculatePositions = function() {
    const pos = new Array(15);
    
    pos[0] = { x: 50, y: 97, type: 'cross' };   
    pos[1] = { x: 50, y: 81, type: 'small-bead' }; 
    pos[2] = { x: 50, y: 69, type: 'small-bead' }; 
    pos[3] = { x: 50, y: 57, type: 'small-bead' }; 
    pos[4] = { x: 50, y: 44, type: 'medal' };      

    const cx = 50, cy = 21, radiusX = 35, radiusY = 23; 
    const startAngle = Math.PI * 0.75; 
    const endAngle = Math.PI * 2.25;   
    
    for (let i = 0; i < 10; i++) {
        const angle = startAngle + (i / 9) * (endAngle - startAngle);
        pos[i + 5] = { 
            x: cx + radiusX * Math.cos(angle), 
            y: cy + radiusY * Math.sin(angle), 
            type: 'small-bead' 
        };
    }
    return pos;
};

window.renderRosary = function() {
    const rosaryContainer = document.getElementById('rosary-container');
    if (!rosaryContainer) return;
    
    rosaryContainer.innerHTML = '';
    window.beadPositions = window.calculatePositions();

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");
    
    // 🔥 ESTA ES LA CLAVE: Permite que la línea superior respire sin alterar NINGÚN número tuyo
    svg.style.overflow = "visible"; 

    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("fill", "none"); 
    path.setAttribute("stroke", "#c08a53"); 
    path.setAttribute("stroke-width", "1.8");
    path.setAttribute("stroke-dasharray", "4 2"); 

    let d = `M ${window.beadPositions[0].x} ${window.beadPositions[0].y} `; 
    for (let i = 1; i <= 4; i++) { d += `L ${window.beadPositions[i].x} ${window.beadPositions[i].y} `; } 
    
    d += `L ${window.beadPositions[5].x} ${window.beadPositions[5].y} `; 
    for (let i = 6; i <= 14; i++) { d += `L ${window.beadPositions[i].x} ${window.beadPositions[i].y} `; } 
    d += `L ${window.beadPositions[4].x} ${window.beadPositions[4].y} `; 

    path.setAttribute("d", d);
    svg.appendChild(path);
    rosaryContainer.appendChild(svg);

    window.beadPositions.forEach((pos, pId) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'bead-wrapper';
        wrapper.style.left = `${pos.x}%`;
        wrapper.style.top = `${pos.y}%`;
        wrapper.id = `wrapper-${pId}`;

        const btn = document.createElement('button');
        btn.className = `bead`;
        btn.onclick = () => { if(window.handlePhysicalClick) window.handlePhysicalClick(pId); };
        
        if (pos.type === 'cross') {
            btn.classList.add('realistic-cross');
            // INYECCIÓN DIRECTA DE LA CRUZ: Ya no depende del HTML, se dibuja sí o sí.
            btn.innerHTML = `
            <svg viewBox="0 0 100 150" style="width:100%; height:100%; filter: drop-shadow(2px 4px 3px rgba(0,0,0,0.4));">
                <path d="M 38 0 L 62 0 L 62 40 L 100 40 L 100 64 L 62 64 L 62 150 L 38 150 L 38 64 L 0 64 L 0 40 L 38 40 Z" fill="#8c9298" />
                <path d="M 41 3 L 59 3 L 59 43 L 97 43 L 97 61 L 59 61 L 59 147 L 41 147 L 41 61 L 3 61 L 3 43 L 41 43 Z" fill="#ffffff" />
                <path d="M 44 6 L 56 6 L 56 46 L 94 46 L 94 58 L 56 58 L 56 144 L 44 144 L 44 58 L 6 58 L 6 46 L 44 46 Z" fill="#cfd4d9" />
            </svg>`;
        } else if (pos.type === 'medal') {
            btn.classList.add('realistic-medal');
            if (window.currentDevotion === 'misericordia') btn.classList.add('medal-misericordia');
            else btn.classList.add('medal-rosario'); 
        } else {
            btn.classList.add('realistic-bead');
            const colors = window.getBeadColors(pId, window.currentDevotion);
            btn.style.setProperty('--b-c1', `rgb(${colors.c1})`);
            btn.style.setProperty('--b-c2', `rgb(${colors.c2})`);
            btn.style.setProperty('--b-c3', `rgb(${colors.c3})`);
            btn.style.setProperty('--b-c4', `rgb(${colors.c4})`);
        }

        wrapper.appendChild(btn);
        rosaryContainer.appendChild(wrapper);
    });
};
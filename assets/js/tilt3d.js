/**
 * Curafy Digitech - 3D Perspective & Physics Engine
 * Powers real-time 3D card tilt, specular cursor light reflection,
 * 3D hero stage parallax, and interactive 3D particle lattice canvas.
 */

(function () {
  'use strict';

  // 1. Interactive 3D Card Parallax & Specular Light Sheen
  function init3DCardTilt() {
    const cards = document.querySelectorAll('.card-3d, .tilt-3d');

    cards.forEach((card) => {
      // Ensure sheen overlay exists
      if (!card.querySelector('.sheen-3d')) {
        const sheen = document.createElement('div');
        sheen.className = 'sheen-3d';
        card.appendChild(sheen);
      }

      let isHovered = false;
      let rafId = null;
      let currentRotateX = 0;
      let currentRotateY = 0;
      let targetRotateX = 0;
      let targetRotateY = 0;

      function updateTilt() {
        if (!isHovered) {
          // Smooth return to zero
          currentRotateX += (0 - currentRotateX) * 0.12;
          currentRotateY += (0 - currentRotateY) * 0.12;
          card.style.transform = `perspective(1000px) rotateX(${currentRotateX.toFixed(2)}deg) rotateY(${currentRotateY.toFixed(2)}deg) scale3d(1, 1, 1)`;

          if (Math.abs(currentRotateX) > 0.05 || Math.abs(currentRotateY) > 0.05) {
            rafId = requestAnimationFrame(updateTilt);
          } else {
            card.style.transform = '';
            rafId = null;
          }
          return;
        }

        // Interpolate toward target
        currentRotateX += (targetRotateX - currentRotateX) * 0.18;
        currentRotateY += (targetRotateY - currentRotateY) * 0.18;
        card.style.transform = `perspective(1000px) rotateX(${currentRotateX.toFixed(2)}deg) rotateY(${currentRotateY.toFixed(2)}deg) scale3d(1.025, 1.025, 1.025)`;

        rafId = requestAnimationFrame(updateTilt);
      }

      card.addEventListener('mouseenter', () => {
        isHovered = true;
        if (!rafId) rafId = requestAnimationFrame(updateTilt);
      });

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Max tilt: 10deg X, 12deg Y
        targetRotateX = ((mouseY - centerY) / centerY) * -10;
        targetRotateY = ((mouseX - centerX) / centerX) * 12;

        // Update sheen position
        const percentX = (mouseX / rect.width) * 100;
        const percentY = (mouseY / rect.height) * 100;
        card.style.setProperty('--mouse-x', `${percentX}%`);
        card.style.setProperty('--mouse-y', `${percentY}%`);

        if (!rafId) rafId = requestAnimationFrame(updateTilt);
      });

      card.addEventListener('mouseleave', () => {
        isHovered = false;
        targetRotateX = 0;
        targetRotateY = 0;
      });
    });
  }

  // 2. Interactive 3D Hero Stage Parallax
  function init3DHeroStage() {
    const heroStage = document.getElementById('hero-3d-stage');
    if (!heroStage) return;

    let targetRotX = 8;
    let targetRotY = -10;
    let currentRotX = 8;
    let currentRotY = -10;
    let isTracking = false;

    window.addEventListener('mousemove', (e) => {
      const normX = e.clientX / window.innerWidth;
      const normY = e.clientY / window.innerHeight;

      // Base rotation + dynamic mouse tracking
      targetRotX = 8 + (normY - 0.5) * -16;
      targetRotY = -10 + (normX - 0.5) * 20;

      if (!isTracking) {
        isTracking = true;
        requestAnimationFrame(renderHero3D);
      }
    });

    function renderHero3D() {
      currentRotX += (targetRotX - currentRotX) * 0.08;
      currentRotY += (targetRotY - currentRotY) * 0.08;

      heroStage.style.transform = `rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg) rotateZ(1deg)`;

      if (Math.abs(targetRotX - currentRotX) > 0.02 || Math.abs(targetRotY - currentRotY) > 0.02) {
        requestAnimationFrame(renderHero3D);
      } else {
        isTracking = false;
      }
    }
  }

  // 3. Interactive 3D Particle Sphere / Cyber Grid Canvas
  function init3DCanvas() {
    const canvas = document.getElementById('hero-3d-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = canvas.parentElement.offsetWidth || 500);
    let height = (canvas.height = canvas.parentElement.offsetHeight || 500);

    window.addEventListener('resize', () => {
      if (canvas.parentElement) {
        width = canvas.width = canvas.parentElement.offsetWidth;
        height = canvas.height = canvas.parentElement.offsetHeight;
      }
    });

    // Generate 3D nodes on a sphere
    const nodeCount = 55;
    const radius = Math.min(width, height) * 0.38;
    const nodes = [];

    for (let i = 0; i < nodeCount; i++) {
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = Math.sqrt(nodeCount * Math.PI) * theta;
      nodes.push({
        x: radius * Math.sin(theta) * Math.cos(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(theta),
        baseSize: Math.random() * 2.2 + 1.2
      });
    }

    let angleX = 0.003;
    let angleY = 0.005;
    let mouseSpeedX = 0;
    let mouseSpeedY = 0;

    window.addEventListener('mousemove', (e) => {
      const normX = (e.clientX / window.innerWidth) - 0.5;
      const normY = (e.clientY / window.innerHeight) - 0.5;
      mouseSpeedX = normY * 0.02;
      mouseSpeedY = normX * 0.02;
    });

    const fov = 350;

    function render3D() {
      ctx.clearRect(0, 0, width, height);

      const rotX = angleX + mouseSpeedX;
      const rotY = angleY + mouseSpeedY;

      // Cos & Sin for rotations
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      // Transform & project all nodes
      const projected = [];
      const centerX = width / 2;
      const centerY = height / 2;

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        // Rotate Y
        let x1 = n.x * cosY - n.z * sinY;
        let z1 = n.z * cosY + n.x * sinY;

        // Rotate X
        let y1 = n.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + n.y * sinX;

        n.x = x1;
        n.y = y1;
        n.z = z2;

        // Perspective projection
        const scale = fov / (fov + z2);
        const pX = x1 * scale + centerX;
        const pY = y1 * scale + centerY;
        const alpha = Math.max(0.1, Math.min(0.95, (z2 + radius) / (2 * radius)));

        projected.push({
          x: pX,
          y: pY,
          z: z2,
          scale: scale,
          size: n.baseSize * scale,
          alpha: alpha
        });
      }

      // Draw connecting lines between close nodes
      ctx.lineWidth = 0.75;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i];
          const p2 = projected[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

          if (dist < 85) {
            const lineAlpha = (1 - dist / 85) * Math.min(p1.alpha, p2.alpha) * 0.45;
            ctx.strokeStyle = `rgba(0, 240, 255, ${lineAlpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        ctx.fillStyle = `rgba(0, 240, 255, ${p.alpha.toFixed(2)})`;
        ctx.shadowColor = '#00F0FF';
        ctx.shadowBlur = p.alpha > 0.6 ? 10 : 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      requestAnimationFrame(render3D);
    }

    requestAnimationFrame(render3D);
  }

  // Initialize all 3D subsystems on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init3DCardTilt();
      init3DHeroStage();
      init3DCanvas();
    });
  } else {
    init3DCardTilt();
    init3DHeroStage();
    init3DCanvas();
  }
})();

import * as THREE from 'three';

export class Pet3D {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.expression = 'default'; // default, happy, working, surprised, sleep, love
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.blinkTimer = 0;
    this.isBlinking = false;
    this.time = 0;

    // Animation states
    this.actionAnimation = null;
    this.actionProgress = 0;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 65;
    const height = this.container.clientHeight || 70;

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 100);
    this.camera.position.set(0, 0.1, 4.8);

    // Renderer with transparency & antialiasing
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xddeeff, 2.0);
    mainLight.position.set(3, 5, 4);
    this.scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight(0x00d4ff, 1.5);
    rimLight.position.set(-3, -2, -2);
    this.scene.add(rimLight);

    const bottomGlow = new THREE.PointLight(0x00f0ff, 2, 4);
    bottomGlow.position.set(0, -1.5, 0);
    this.scene.add(bottomGlow);

    // Build the Pet Rig
    this.buildPet();

    // Mouse tracking with clamp to prevent perspective zooming
    window.addEventListener('mousemove', (e) => {
      const rect = this.container.getBoundingClientRect();
      const rawX = (e.clientX - rect.left) / rect.width - 0.5;
      const rawY = (e.clientY - rect.top) / rect.height - 0.5;
      this.mouse.targetX = Math.max(-0.8, Math.min(0.8, rawX * 1.5));
      this.mouse.targetY = Math.max(-0.6, Math.min(0.6, -rawY * 1.5));
    });

    // Handle Resize strictly
    window.addEventListener('resize', () => {
      const w = 65;
      const h = 70;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  createVisorTexture() {
    this.visorCanvas = document.createElement('canvas');
    this.visorCanvas.width = 512;
    this.visorCanvas.height = 256;
    this.visorCtx = this.visorCanvas.getContext('2d');
    this.visorTexture = new THREE.CanvasTexture(this.visorCanvas);
    this.drawVisor();
  }

  drawVisor() {
    const ctx = this.visorCtx;
    const w = this.visorCanvas.width;
    const h = this.visorCanvas.height;

    // Dark sleek visor base
    ctx.fillStyle = '#080d1a';
    ctx.fillRect(0, 0, w, h);

    const eyeColor = '#00f2fe';
    const glowColor = 'rgba(0, 242, 254, 0.4)';

    ctx.shadowBlur = 24;
    ctx.shadowColor = eyeColor;
    ctx.strokeStyle = eyeColor;
    ctx.fillStyle = eyeColor;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';

    const lx = w * 0.35;
    const rx = w * 0.65;
    const ey = h * 0.5;

    if (this.isBlinking && this.expression !== 'sleep') {
      // Blink line
      ctx.beginPath();
      ctx.moveTo(lx - 25, ey);
      ctx.lineTo(lx + 25, ey);
      ctx.moveTo(rx - 25, ey);
      ctx.lineTo(rx + 25, ey);
      ctx.stroke();
    } else {
      switch (this.expression) {
        case 'happy':
          // Upward happy arches ^ ^
          ctx.beginPath();
          ctx.arc(lx, ey + 10, 30, Math.PI * 1.15, Math.PI * 1.85, false);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(rx, ey + 10, 30, Math.PI * 1.15, Math.PI * 1.85, false);
          ctx.stroke();
          // Cute blush
          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(255, 90, 160, 0.45)';
          ctx.beginPath();
          ctx.ellipse(lx - 35, ey + 40, 16, 8, 0, 0, Math.PI * 2);
          ctx.ellipse(rx + 35, ey + 40, 16, 8, 0, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'working':
          // Rotating cyber targeting HUD
          const angle = this.time * 4;
          [lx, rx].forEach((cx) => {
            ctx.save();
            ctx.translate(cx, ey);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.arc(0, 0, 28, 0, Math.PI * 1.4);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          });
          break;

        case 'surprised':
          // Wide open curious circles
          ctx.beginPath();
          ctx.arc(lx, ey, 32, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(rx, ey, 32, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'sleep':
          // Closed peaceful eyes - -
          ctx.beginPath();
          ctx.moveTo(lx - 25, ey + 5);
          ctx.lineTo(lx + 25, ey + 5);
          ctx.moveTo(rx - 25, ey + 5);
          ctx.lineTo(rx + 25, ey + 5);
          ctx.stroke();
          break;

        case 'love':
          // Hearts
          ctx.fillStyle = '#ff2a75';
          ctx.shadowColor = '#ff2a75';
          [lx, rx].forEach((cx) => {
            ctx.beginPath();
            const topY = ey - 15;
            ctx.moveTo(cx, topY + 12);
            ctx.bezierCurveTo(cx - 24, topY - 18, cx - 40, topY + 18, cx, topY + 42);
            ctx.bezierCurveTo(cx + 40, topY + 18, cx + 24, topY - 18, cx, topY + 12);
            ctx.fill();
          });
          break;

        case 'default':
        default:
          // Smooth expressive rounded pill eyes with pupil highlights
          [lx, rx].forEach((cx) => {
            ctx.beginPath();
            ctx.roundRect(cx - 22, ey - 32, 44, 64, 22);
            ctx.fill();

            // Specular glint inside eye
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(cx - 6, ey - 14, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = eyeColor;
          });
          break;
      }
    }

    if (this.visorTexture) {
      this.visorTexture.needsUpdate = true;
    }
  }

  buildPet() {
    this.petGroup = new THREE.Group();
    this.scene.add(this.petGroup);

    // Materials
    const shellMaterial = new THREE.MeshStandardMaterial({
      color: 0xf2f7fc,
      roughness: 0.22,
      metalness: 0.1,
    });

    const darkAccent = new THREE.MeshStandardMaterial({
      color: 0x1b2333,
      roughness: 0.35,
      metalness: 0.2,
    });

    const neonGlow = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
    });

    // --- BODY TORSO ---
    this.torso = new THREE.Group();
    this.petGroup.add(this.torso);

    // Torso pod (Capsule-like egg)
    const torsoGeo = new THREE.SphereGeometry(0.72, 32, 28);
    torsoGeo.scale(0.9, 1.05, 0.85);
    const torsoMesh = new THREE.Mesh(torsoGeo, shellMaterial);
    this.torso.add(torsoMesh);

    // Glowing core ring on chest
    const coreRingGeo = new THREE.TorusGeometry(0.24, 0.045, 16, 32);
    const coreMesh = new THREE.Mesh(coreRingGeo, neonGlow);
    coreMesh.position.set(0, 0.08, 0.62);
    this.torso.add(coreMesh);

    // Base Thruster / Ring
    const thrusterGeo = new THREE.TorusGeometry(0.38, 0.05, 16, 32);
    const thrusterMesh = new THREE.Mesh(thrusterGeo, neonGlow);
    thrusterMesh.rotation.x = Math.PI / 2;
    thrusterMesh.position.set(0, -0.72, 0);
    this.torso.add(thrusterMesh);

    // --- FLOATING HEAD ---
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.95, 0);
    this.petGroup.add(this.headGroup);

    // Head shell
    const headGeo = new THREE.SphereGeometry(0.78, 32, 28);
    headGeo.scale(1.08, 0.95, 0.95);
    const headMesh = new THREE.Mesh(headGeo, shellMaterial);
    this.headGroup.add(headMesh);

    // Visor Texture & Mesh
    this.createVisorTexture();
    const visorGeo = new THREE.SphereGeometry(0.68, 32, 24, 0, Math.PI);
    visorGeo.scale(1.02, 0.82, 0.5);
    const visorMaterial = new THREE.MeshBasicMaterial({
      map: this.visorTexture,
      transparent: true,
    });
    const visorMesh = new THREE.Mesh(visorGeo, visorMaterial);
    visorMesh.position.set(0, 0.04, 0.52);
    visorMesh.rotation.y = -Math.PI / 2;
    this.headGroup.add(visorMesh);

    // Holographic Cyber Ears / Antennae
    this.leftEar = this.createEar(1, neonGlow, darkAccent);
    this.rightEar = this.createEar(-1, neonGlow, darkAccent);
    this.headGroup.add(this.leftEar);
    this.headGroup.add(this.rightEar);

    // --- FLOATING HANDS / PAWS ---
    this.leftHand = this.createHand(1, shellMaterial, neonGlow);
    this.rightHand = this.createHand(-1, shellMaterial, neonGlow);
    this.petGroup.add(this.leftHand);
    this.petGroup.add(this.rightHand);
  }

  createEar(side, glowMat, accentMat) {
    const earGroup = new THREE.Group();
    earGroup.position.set(side * 0.85, 0.38, -0.05);

    // Sleek fin
    const finGeo = new THREE.ConeGeometry(0.18, 0.65, 16);
    finGeo.scale(0.4, 1, 0.8);
    const finMesh = new THREE.Mesh(finGeo, accentMat);
    finMesh.rotation.z = side * -0.55;
    finMesh.rotation.x = -0.15;
    earGroup.add(finMesh);

    // Glowing tip
    const tipGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const tipMesh = new THREE.Mesh(tipGeo, glowMat);
    tipMesh.position.set(side * 0.18, 0.32, 0);
    earGroup.add(tipMesh);

    return earGroup;
  }

  createHand(side, shellMat, glowMat) {
    const handGroup = new THREE.Group();
    handGroup.position.set(side * 1.08, 0.05, 0.2);

    const palmGeo = new THREE.SphereGeometry(0.2, 16, 16);
    palmGeo.scale(1, 0.8, 1.2);
    const palm = new THREE.Mesh(palmGeo, shellMat);
    handGroup.add(palm);

    const padGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const pad = new THREE.Mesh(padGeo, glowMat);
    pad.position.set(0, -0.08, 0.08);
    handGroup.add(pad);

    return handGroup;
  }

  setExpression(name) {
    this.expression = name;
    this.drawVisor();
  }

  spin() {
    this.actionAnimation = 'spin';
    this.actionProgress = 0;
    this.setExpression('happy');
  }

  nod() {
    this.actionAnimation = 'nod';
    this.actionProgress = 0;
  }

  shake() {
    this.actionAnimation = 'shake';
    this.actionProgress = 0;
  }

  bounce() {
    this.actionAnimation = 'bounce';
    this.actionProgress = 0;
    this.setExpression('happy');
  }

  animate() {
    requestAnimationFrame(this.animate);
    this.time += 0.025;

    // Smooth Mouse Following
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.06;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.06;

    // Idle floating bob
    const floatY = Math.sin(this.time * 2.2) * 0.12;
    this.petGroup.position.y = floatY;

    // Torso gentle breathing & tilt
    this.torso.rotation.y = this.mouse.x * 0.35;
    this.torso.rotation.x = -this.mouse.y * 0.25;

    // Head tracks mouse with natural spring dampening
    if (this.headGroup) {
      this.headGroup.rotation.y = this.mouse.x * 0.65;
      this.headGroup.rotation.x = -this.mouse.y * 0.55;
      this.headGroup.rotation.z = -this.mouse.x * 0.15;
    }

    // Ear twitch idle
    if (this.leftEar && this.rightEar) {
      this.leftEar.rotation.z = Math.sin(this.time * 3) * 0.08;
      this.rightEar.rotation.z = -Math.sin(this.time * 3) * 0.08;
    }

    // Floating hands bobbing
    if (this.leftHand && this.rightHand) {
      this.leftHand.position.y = 0.05 + Math.cos(this.time * 2.5) * 0.08;
      this.rightHand.position.y = 0.05 + Math.sin(this.time * 2.5) * 0.08;
    }

    // Blink Logic
    this.blinkTimer += 0.025;
    if (this.blinkTimer > 3.5 && !this.isBlinking) {
      this.isBlinking = true;
      this.drawVisor();
      setTimeout(() => {
        this.isBlinking = false;
        this.drawVisor();
        this.blinkTimer = 0;
      }, 160);
    }

    // Continuous visor updates if working
    if (this.expression === 'working') {
      this.drawVisor();
    }

    // Custom Action Animations
    if (this.actionAnimation === 'spin') {
      this.actionProgress += 0.07;
      this.petGroup.rotation.y = this.actionProgress * Math.PI * 2;
      this.petGroup.position.y = floatY + Math.sin(this.actionProgress * Math.PI) * 0.45;
      if (this.actionProgress >= 1) {
        this.actionAnimation = null;
        this.petGroup.rotation.y = 0;
        setTimeout(() => this.setExpression('default'), 800);
      }
    } else if (this.actionAnimation === 'bounce') {
      this.actionProgress += 0.08;
      this.petGroup.position.y = floatY + Math.abs(Math.sin(this.actionProgress * Math.PI * 2)) * 0.35;
      if (this.actionProgress >= 1) {
        this.actionAnimation = null;
        setTimeout(() => this.setExpression('default'), 600);
      }
    } else if (this.actionAnimation === 'nod') {
      this.actionProgress += 0.12;
      this.headGroup.rotation.x += Math.sin(this.actionProgress * Math.PI * 2) * 0.3;
      if (this.actionProgress >= 1) {
        this.actionAnimation = null;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}

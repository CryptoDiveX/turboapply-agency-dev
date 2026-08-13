(() => {
  'use strict';

  const VERSION = 'fluid-holographic-sphere-owner-gradient-20260813-1';
  const LOOP_MS = 10000;
  const PULSE_MS = 900;
  const LATITUDES = 64;
  const LONGITUDES = 64;
  const TAU = Math.PI * 2;
  const surfaces = [...document.querySelectorAll('[data-fluid-holographic-loop]')];

  if (!surfaces.length) return;

  const vertexSource = `
    precision highp float;
    attribute vec3 a_position;
    attribute vec3 a_normal;
    attribute vec2 a_uv;

    uniform mat4 u_projection;
    uniform mat4 u_modelView;
    uniform float u_phase;
    uniform float u_hover;
    uniform float u_pulse;
    uniform vec2 u_pointer;
    uniform vec3 u_hitDirection;

    varying vec3 v_normal;
    varying vec3 v_viewPosition;
    varying vec2 v_uv;
    varying float v_displacement;

    const float PI = 3.14159265359;
    const float TAU = 6.28318530718;

    vec3 orthogonal(vec3 vector) {
      return normalize(abs(vector.x) > abs(vector.z)
        ? vec3(-vector.y, vector.x, 0.0)
        : vec3(0.0, -vector.z, vector.y));
    }

    float organicField(vec3 direction) {
      float broad = sin(dot(direction, vec3(2.4, 1.1, 1.7)) + u_phase);
      broad += sin(dot(direction, vec3(-1.3, 3.2, 2.1)) - u_phase * 2.0);
      broad += sin(dot(direction, vec3(2.8, -2.2, 3.6)) + u_phase * 3.0);
      broad *= 0.3333333;

      float folds = sin(direction.x * 7.0 + direction.y * 3.0 + u_phase * 2.0);
      folds *= sin(direction.z * 6.0 - direction.y * 4.0 - u_phase);

      vec3 pointerDirection = normalize(vec3(u_pointer * vec2(0.9, 0.75), 1.0));
      float pointerFacing = dot(direction, pointerDirection);
      float localMask = smoothstep(0.55, 0.96, pointerFacing) * u_hover;
      float localFold = sin(pointerFacing * 34.0 - u_phase * 4.0) * localMask;

      float angularDistance = acos(clamp(dot(direction, normalize(u_hitDirection)), -1.0, 1.0)) / PI;
      float ringCenter = u_pulse * 1.25;
      float ringDistance = abs(angularDistance - ringCenter);
      float pulseEnvelope = exp(-ringDistance * 24.0) * sin((angularDistance - ringCenter) * 42.0);
      pulseEnvelope *= (1.0 - smoothstep(0.72, 1.0, u_pulse));

      return broad * 0.078 + folds * 0.022 + localFold * 0.045 + pulseEnvelope * 0.052;
    }

    vec3 distort(vec3 point) {
      vec3 direction = normalize(point);
      float radius = length(point) + organicField(direction);
      return direction * radius;
    }

    void main() {
      vec3 displaced = distort(a_position);
      vec3 tangentA = orthogonal(a_normal);
      vec3 tangentB = normalize(cross(a_normal, tangentA));
      vec3 displacedA = distort(a_position + tangentA * 0.018);
      vec3 displacedB = distort(a_position + tangentB * 0.018);
      vec3 dynamicNormal = normalize(cross(displacedA - displaced, displacedB - displaced));

      vec4 viewPosition = u_modelView * vec4(displaced, 1.0);
      v_viewPosition = viewPosition.xyz;
      v_normal = normalize(mat3(u_modelView) * dynamicNormal);
      v_uv = a_uv;
      v_displacement = clamp(abs(length(displaced) - length(a_position)) * 7.0, 0.0, 1.0);
      gl_Position = u_projection * viewPosition;
    }
  `;

  const fragmentSource = `
    precision highp float;

    uniform sampler2D u_material;
    uniform vec2 u_resolution;
    uniform float u_phase;

    varying vec3 v_normal;
    varying vec3 v_viewPosition;
    varying vec2 v_uv;
    varying float v_displacement;

    const float TAU = 6.28318530718;

    void main() {
      vec3 normal = normalize(v_normal);
      vec3 viewDirection = normalize(-v_viewPosition);
      float facing = clamp(dot(normal, viewDirection), 0.0, 1.0);
      float fresnel = pow(1.0 - facing, 2.25);

      vec3 refracted = refract(-viewDirection, normal, 1.0 / 1.18);
      vec2 flow = vec2(
        sin(u_phase + normal.y * 2.8),
        cos(u_phase - normal.x * 3.1)
      ) * 0.012;
      vec2 environmentUv = vec2(
        fract(v_uv.x * 2.0 + refracted.x * 0.08 + flow.x),
        clamp(v_uv.y + refracted.y * 0.08 + flow.y, 0.002, 0.998)
      );
      vec2 dispersion = normal.xy * (0.004 + fresnel * 0.018);

      float red = texture2D(u_material, clamp(environmentUv + dispersion, 0.002, 0.998)).r;
      float green = texture2D(u_material, environmentUv).g;
      float blue = texture2D(u_material, clamp(environmentUv - dispersion, 0.002, 0.998)).b;
      vec3 environment = vec3(red, green, blue);
      environment = mix(vec3(0.97, 0.985, 1.0), environment, 0.97);
      vec3 ownerPearlPalette = mix(
        vec3(0.95, 0.985, 1.0),
        vec3(0.98, 0.72, 0.94),
        smoothstep(0.05, 0.34, v_uv.y)
      );
      ownerPearlPalette = mix(
        ownerPearlPalette,
        vec3(0.72, 0.95, 0.91),
        smoothstep(0.26, 0.58, v_uv.y) * (0.5 + 0.5 * sin(v_uv.x * 6.0 + u_phase))
      );
      ownerPearlPalette = mix(
        ownerPearlPalette,
        vec3(1.0, 0.93, 0.46),
        smoothstep(0.46, 0.76, v_uv.x) * smoothstep(0.38, 0.72, v_uv.y) * 0.54
      );
      ownerPearlPalette = mix(
        ownerPearlPalette,
        vec3(0.66, 0.84, 1.0),
        smoothstep(0.68, 1.0, v_uv.y) * 0.58
      );
      environment = mix(environment, ownerPearlPalette, 0.34);

      vec3 iridescence = 0.62 + 0.38 * cos(
        TAU * (fresnel * 1.4 + dot(normal, vec3(0.21, 0.43, 0.36)) * 0.36)
        + vec3(0.0, 2.05, 4.1)
      );
      iridescence = pow(iridescence, vec3(0.78));
      iridescence = mix(vec3(0.93, 0.95, 1.0), iridescence, 0.54);

      vec3 lightDirection = normalize(vec3(-0.38, 0.72, 0.58));
      vec3 halfVector = normalize(lightDirection + viewDirection);
      float diffuse = 0.84 + max(dot(normal, lightDirection), 0.0) * 0.15;
      float specular = pow(max(dot(normal, halfVector), 0.0), 42.0);
      float foldShadow = smoothstep(0.05, 0.78, facing) * 0.04;
      vec3 reflected = reflect(-viewDirection, normal);
      float highlightLoop = (1.0 - cos(u_phase)) * 0.50265482457;
      float creaseLoop = (1.0 - cos(u_phase)) * 0.37699111843;
      float studioHighlight = pow(abs(sin(reflected.y * 5.5 + reflected.x * 3.2 + highlightLoop)), 18.0);
      float studioCrease = pow(abs(sin(reflected.x * 7.0 - reflected.z * 4.0 - creaseLoop)), 28.0);

      vec3 color = environment * diffuse;
      color = mix(color, iridescence, clamp(0.12 + fresnel * 0.92 + v_displacement * 0.18, 0.0, 0.78));
      color += vec3(specular * 0.42);
      color += vec3(0.91, 0.96, 1.0) * studioHighlight * 0.18;
      color -= vec3(0.08, 0.06, 0.11) * studioCrease * 0.05;
      color -= vec3(foldShadow * (0.08 + v_displacement * 0.10));
      color += vec3(0.01, 0.03, 0.04) * fresnel;
      color = mix(vec3(0.94, 0.95, 1.0), color, 0.96);

      gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
    }
  `;

  const compileShader = (gl, type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader) || 'Unknown shader compilation error';
      gl.deleteShader(shader);
      throw new Error(message);
    }
    return shader;
  };

  const createProgram = (gl) => {
    const program = gl.createProgram();
    const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const message = gl.getProgramInfoLog(program) || 'Unknown shader link error';
      gl.deleteProgram(program);
      throw new Error(message);
    }
    return program;
  };

  const createSphere = () => {
    const vertexStride = 8;
    const vertices = [];
    const indices = [];
    for (let latitude = 0; latitude <= LATITUDES; latitude += 1) {
      const v = latitude / LATITUDES;
      const theta = v * Math.PI;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      for (let longitude = 0; longitude <= LONGITUDES; longitude += 1) {
        const u = longitude / LONGITUDES;
        const phi = u * TAU;
        const atPole = latitude === 0 || latitude === LATITUDES;
        const x = atPole ? 0 : sinTheta * Math.cos(phi);
        const y = cosTheta;
        const z = atPole ? 0 : sinTheta * Math.sin(phi);
        vertices.push(x, y, z, x, y, z, u, 1 - v);
      }
    }
    for (let latitude = 0; latitude < LATITUDES; latitude += 1) {
      for (let longitude = 0; longitude < LONGITUDES; longitude += 1) {
        const first = latitude * (LONGITUDES + 1) + longitude;
        const second = first + LONGITUDES + 1;
        indices.push(first, second, first + 1, second, second + 1, first + 1);
      }
    }
    return {
      vertices: new Float32Array(vertices),
      indices: new Uint16Array(indices),
      vertexStride,
    };
  };

  const perspective = (fieldOfView, aspect, near, far) => {
    const f = 1 / Math.tan(fieldOfView / 2);
    const rangeInv = 1 / (near - far);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0,
    ]);
  };

  const modelView = (scale, x, y) => new Float32Array([
    scale, 0, 0, 0,
    0, scale, 0, 0,
    0, 0, scale, 0,
    x, y, -4.0, 1,
  ]);

  const mount = (surface) => {
    const canvas = surface.querySelector('[data-fluid-holographic-canvas]');
    const image = surface.querySelector('img');
    const toggle = surface.querySelector('[data-fluid-animation-toggle]');
    const status = surface.querySelector('[data-fluid-animation-status]');
    const badge = surface.querySelector('.fluid-holographic-label strong');
    const materialUrl = surface.dataset.fluidMaterialSource;
    if (!canvas || !image || !toggle || !status || !badge || !materialUrl) return null;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const saveData = Boolean(connection && connection.saveData);
    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      depth: true,
      premultipliedAlpha: true,
      powerPreference: 'high-performance',
    });

    if (!gl) {
      surface.dataset.fluidHolographicState = 'static-fallback';
      status.textContent = 'Static artwork: WebGL is unavailable.';
      badge.textContent = 'Static artwork';
      toggle.hidden = true;
      return null;
    }

    let program;
    try {
      program = createProgram(gl);
    } catch (error) {
      surface.dataset.fluidHolographicState = 'static-fallback';
      status.textContent = 'Static artwork: animation could not start.';
      badge.textContent = 'Static artwork';
      toggle.hidden = true;
      console.warn('Fluid holographic sphere fallback:', error.message);
      return null;
    }

    gl.useProgram(program);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.clearColor(0, 0, 0, 0);

    const sphere = createSphere();
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sphere.vertices, gl.STATIC_DRAW);
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.indices, gl.STATIC_DRAW);

    const stride = sphere.vertexStride * Float32Array.BYTES_PER_ELEMENT;
    const attributes = {
      position: gl.getAttribLocation(program, 'a_position'),
      normal: gl.getAttribLocation(program, 'a_normal'),
      uv: gl.getAttribLocation(program, 'a_uv'),
    };
    gl.enableVertexAttribArray(attributes.position);
    gl.vertexAttribPointer(attributes.position, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(attributes.normal);
    gl.vertexAttribPointer(attributes.normal, 3, gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(attributes.uv);
    gl.vertexAttribPointer(attributes.uv, 2, gl.FLOAT, false, stride, 6 * Float32Array.BYTES_PER_ELEMENT);

    const uniforms = {
      projection: gl.getUniformLocation(program, 'u_projection'),
      modelView: gl.getUniformLocation(program, 'u_modelView'),
      phase: gl.getUniformLocation(program, 'u_phase'),
      hover: gl.getUniformLocation(program, 'u_hover'),
      pulse: gl.getUniformLocation(program, 'u_pulse'),
      pointer: gl.getUniformLocation(program, 'u_pointer'),
      hitDirection: gl.getUniformLocation(program, 'u_hitDirection'),
      material: gl.getUniformLocation(program, 'u_material'),
      resolution: gl.getUniformLocation(program, 'u_resolution'),
    };

    const texture = gl.createTexture();
    let textureReady = false;
    let running = false;
    let manualPaused = false;
    let intersecting = true;
    let documentVisible = !document.hidden;
    let raf = 0;
    let elapsed = 0;
    let startedAt = performance.now();
    let currentPhase = 0;
    let frameCount = 0;
    let backingScale = 1;
    let hoverTarget = 0;
    let hoverStrength = 0;
    let pointerX = 0;
    let pointerY = 0;
    let springX = 0;
    let springY = 0;
    let velocityX = 0;
    let velocityY = 0;
    let pulseStartedAt = -Infinity;
    const hitDirection = new Float32Array([0, 0, 1]);

    const reduce = () => reducedMotion.matches || saveData;
    const shouldAnimate = () => textureReady && !reduce() && !manualPaused && intersecting && documentVisible;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const cap = window.innerWidth <= 760 ? 1 : 1.5;
      backingScale = Math.min(window.devicePixelRatio || 1, cap);
      const width = Math.max(1, Math.round(rect.width * backingScale));
      const height = Math.max(1, Math.round(rect.height * backingScale));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      gl.uniform2f(uniforms.resolution, width, height);
      gl.uniformMatrix4fv(uniforms.projection, false, perspective(Math.PI / 4, width / height, 0.1, 100));
      canvas.dataset.backingScale = String(backingScale);
    };

    const currentPulse = (now) => Math.max(0, Math.min(1, (now - pulseStartedAt) / PULSE_MS));

    const updateSpring = () => {
      const targetX = -pointerX * hoverStrength * 0.18;
      const targetY = -pointerY * hoverStrength * 0.11;
      velocityX = (velocityX + (targetX - springX) * 0.022) * 0.88;
      velocityY = (velocityY + (targetY - springY) * 0.022) * 0.88;
      springX += velocityX;
      springY += velocityY;
      hoverStrength += (hoverTarget - hoverStrength) * 0.075;
    };

    const draw = (phase, options = {}) => {
      if (!textureReady) return;
      resize();
      if (!options.qa) updateSpring();
      const now = options.now || performance.now();
      const compactScale = window.innerWidth <= 760 ? 0.92 : 1.15;
      const pulse = options.qa ? 1 : currentPulse(now);
      const pulseValue = pulse >= 1 ? 1 : pulse;

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(uniforms.material, 0);
      gl.uniform1f(uniforms.phase, phase);
      gl.uniform1f(uniforms.hover, options.qa ? 0 : hoverStrength);
      gl.uniform1f(uniforms.pulse, pulseValue);
      gl.uniform2f(uniforms.pointer, options.qa ? 0 : pointerX, options.qa ? 0 : pointerY);
      gl.uniform3fv(uniforms.hitDirection, hitDirection);
      gl.uniformMatrix4fv(uniforms.modelView, false, modelView(compactScale, options.qa ? 0 : springX, options.qa ? 0 : springY));
      gl.drawElements(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0);

      currentPhase = phase;
      frameCount += 1;
      canvas.dataset.renderMode = 'webgl-sphere';
      surface.dataset.fluidHolographicReady = 'true';
    };

    const stopClock = () => {
      if (running) {
        const now = performance.now();
        elapsed = (elapsed + now - startedAt) % LOOP_MS;
      }
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const syncUi = () => {
      if (!textureReady) {
        toggle.hidden = true;
        badge.textContent = 'Static artwork';
        status.textContent = 'Static artwork while the animation prepares.';
        surface.dataset.fluidHolographicState = 'loading';
        return;
      }
      if (reduce()) {
        toggle.hidden = true;
        badge.textContent = 'Static artwork';
        status.textContent = saveData
          ? 'Static artwork because data-saving mode is active.'
          : 'Static artwork because reduced motion is active.';
      } else {
        toggle.hidden = false;
        badge.textContent = 'Live animation';
        toggle.textContent = manualPaused ? 'Resume animation' : 'Pause animation';
        toggle.setAttribute('aria-pressed', manualPaused ? 'true' : 'false');
        status.textContent = manualPaused
          ? 'Fluid holographic sphere paused.'
          : 'Fluid holographic sphere · 10-second seamless loop · hover or tap the shape';
      }
      surface.dataset.fluidHolographicState = reduce()
        ? 'reduced-motion'
        : manualPaused
          ? 'paused'
          : running
            ? 'running'
            : 'idle';
    };

    const reconcile = () => {
      if (!textureReady) {
        stopClock();
        syncUi();
        return;
      }
      if (reduce()) {
        stopClock();
        elapsed = 0;
        currentPhase = 0;
        draw(0, { qa: true });
      } else if (shouldAnimate()) {
        if (!running) {
          startedAt = performance.now();
          running = true;
          raf = requestAnimationFrame(frame);
        }
      } else {
        stopClock();
        draw(currentPhase, { now: performance.now() });
      }
      syncUi();
    };

    const frame = (now) => {
      if (!running) return;
      if (!shouldAnimate()) {
        reconcile();
        return;
      }
      const loopElapsed = (elapsed + now - startedAt) % LOOP_MS;
      draw((loopElapsed / LOOP_MS) * TAU, { now });
      raf = requestAnimationFrame(frame);
    };

    const observer = new IntersectionObserver((entries) => {
      intersecting = entries[0].isIntersecting;
      reconcile();
    }, { threshold: 0, rootMargin: '160px' });

    const updatePointer = (event) => {
      if (reduce() || manualPaused) return;
      const rect = surface.getBoundingClientRect();
      pointerX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerY = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      const ellipticalDistance = Math.sqrt((pointerX / 0.72) ** 2 + (pointerY / 0.88) ** 2);
      const hit = ellipticalDistance <= 1;
      hoverTarget = hit ? 1 : 0;
      surface.dataset.fluidPointerHit = hit ? 'true' : 'false';
      if (hit) {
        const z = Math.sqrt(Math.max(0.05, 1 - Math.min(1, pointerX * pointerX + pointerY * pointerY) * 0.68));
        const length = Math.hypot(pointerX, pointerY, z) || 1;
        hitDirection[0] = pointerX / length;
        hitDirection[1] = pointerY / length;
        hitDirection[2] = z / length;
      }
    };

    const leavePointer = () => {
      hoverTarget = 0;
      surface.dataset.fluidPointerHit = 'false';
    };

    const triggerPulse = (event) => {
      if (event.target.closest('[data-fluid-animation-toggle]') || reduce() || manualPaused) return;
      updatePointer(event);
      if (surface.dataset.fluidPointerHit !== 'true') return;
      pulseStartedAt = performance.now();
    };

    const onVisibility = () => {
      documentVisible = !document.hidden;
      reconcile();
    };

    const useStaticFallback = () => {
      stopClock();
      textureReady = false;
      surface.dataset.fluidHolographicState = 'static-fallback';
      surface.dataset.fluidHolographicReady = 'false';
      toggle.hidden = true;
      badge.textContent = 'Static artwork';
      status.textContent = 'Static artwork: material texture could not load.';
    };

    const uploadTexture = (materialImage) => {
      try {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, materialImage);
        textureReady = true;
        draw(0, { qa: true });
        reconcile();
      } catch (error) {
        console.warn('Fluid holographic material fallback:', error.message);
        useStaticFallback();
      }
    };

    toggle.addEventListener('click', () => {
      manualPaused = !manualPaused;
      reconcile();
    });
    surface.addEventListener('pointermove', updatePointer, { passive: true });
    surface.addEventListener('pointerleave', leavePointer, { passive: true });
    surface.addEventListener('pointercancel', leavePointer, { passive: true });
    surface.addEventListener('pointerdown', triggerPulse, { passive: true });
    reducedMotion.addEventListener('change', reconcile);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', () => draw(currentPhase, { now: performance.now() }));
    observer.observe(surface);
    reconcile();

    if (saveData) {
      useStaticFallback();
    } else {
      const materialImage = new Image();
      materialImage.decoding = 'async';
      materialImage.src = materialUrl;
      if (materialImage.complete && materialImage.naturalWidth > 0) {
        uploadTexture(materialImage);
      } else {
        materialImage.addEventListener('load', () => uploadTexture(materialImage), { once: true });
        materialImage.addEventListener('error', useStaticFallback, { once: true });
      }
    }

    const api = {
      version: VERSION,
      periodMs: LOOP_MS,
      geometry: `sphere-${LATITUDES}x${LONGITUDES}`,
      materialSource: materialUrl,
      get running() { return running; },
      get frameCount() { return frameCount; },
      get phase() { return currentPhase; },
      get manualPaused() { return manualPaused; },
      get manuallyPaused() { return manualPaused; },
      get reducedMotion() { return reduce(); },
      get backingScale() { return backingScale; },
      get renderMode() { return canvas.dataset.renderMode || 'fallback'; },
      get hoverStrength() { return hoverStrength; },
      get pulseProgress() { return currentPulse(performance.now()); },
      get canvasWidth() { return canvas.width; },
      get canvasHeight() { return canvas.height; },
      renderProgressForQa(progress) {
        if (!manualPaused || reduce() || !textureReady) return false;
        const requested = Number(progress);
        if (!Number.isFinite(requested)) return false;
        draw(Math.max(0, Math.min(1, requested)) * TAU, { qa: true });
        return currentPhase;
      },
      sampleFrameForQa(progress) {
        if (!manualPaused || reduce() || !textureReady) return false;
        const requested = Number(progress);
        if (!Number.isFinite(requested)) return false;
        draw(Math.max(0, Math.min(1, requested)) * TAU, { qa: true });
        const pixels = new Uint8Array(canvas.width * canvas.height * 4);
        gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        const samples = [];
        const grid = 24;
        for (let row = 0; row < grid; row += 1) {
          const y = Math.min(canvas.height - 1, Math.round((row / (grid - 1)) * (canvas.height - 1)));
          for (let column = 0; column < grid; column += 1) {
            const x = Math.min(canvas.width - 1, Math.round((column / (grid - 1)) * (canvas.width - 1)));
            const offset = (y * canvas.width + x) * 4;
            samples.push(pixels[offset], pixels[offset + 1], pixels[offset + 2]);
          }
        }
        return { phase: currentPhase, samples };
      },
      reconcile,
    };

    surface.__fluidHolographicLoop = api;
    return api;
  };

  const instances = surfaces.map(mount).filter(Boolean);
  window.__turboapplyFluidHolographicLoop = {
    version: VERSION,
    periodMs: LOOP_MS,
    geometry: `sphere-${LATITUDES}x${LONGITUDES}`,
    instances,
  };
})();

class LetterEmitter {
  constructor(font, letters, springOptions, particleOptions, location, force) {
    this.font = loadFont(`fonts/${font}`);
    //Spring Scaffold settings
    this.springOptions = springOptions;

    //particle options
    this.sampleFactor = particleOptions.sampleFactor;
    this.particleRadius = particleOptions.particleRadius;
    this.particleOptions = {
      friction: particleOptions.options.friction,
      restitution: particleOptions.options.restitution,
      frictionAir: particleOptions.options.frictionAir,
      density: particleOptions.options.density,
    };

    this.location = location;
    this.force = force;

    this.letters = letters;
    this.nextLetterIndex = 0;
    this.letterObjs = [];
    this.emitSpeed = setTimeout(() => {
      setInterval(() => {
        this.randomLetter();
      }, 600);
    }, 800);
  }

  run() {
    this.removeLetters();

    for (let letter of this.letterObjs) {
      letter.show();
    }
  }
  wholePhrase(margin) {
    const layoutWidth = width - margin * 2;
    const step =
      this.letters.length > 1 ? layoutWidth / (this.letters.length - 1) : 0;
    const baselineY = -size * 0.3;

    for (let i = 0; i < this.letters.length; i++) {
      const x = margin + i * step;
      const y = baselineY;
      this.letterObjs.push(
        new Letter(
          x,
          y,
          size,
          this.font,
          this.letters[i],
          {
            ...this.springOptions,
          },
          this.sampleFactor,
          { ...this.particleOptions },
          this.particleRadius,
          this.force,
        ),
      );
      this.nextLetterIndex++;
    }
  }
  randomLetter() {
    if (!this.font) {
      return;
    }

    const letter = this.letters[this.nextLetterIndex % this.letters.length];
    this.nextLetterIndex++;

    const spawnX = width + 20;
    const spawnY = height / 2;

    this.letterObjs.push(
      new Letter(
        spawnX,
        spawnY,
        size,
        this.font,
        letter,
        {
          ...this.springOptions,
        },
        this.sampleFactor,
        { ...this.particleOptions },
        this.particleRadius,
        this.force,
      ),
    );
  }

  removeLetters() {
    for (let i = this.letterObjs.length - 1; i >= 0; i--) {
      const letter = this.letterObjs[i];
      if (letter.isOffscreen(height + size)) {
        letter.remove();
        this.letterObjs.splice(i, 1);
      }
    }
  }

  createUI() {
    // ── Shared style constants (mirror the p5 bottom bar) ──────────────────
    const BG = "rgba(12, 12, 12, 0.88)";
    const FG_HINT = "rgba(122, 122, 122, 0.85)";
    const FG_VALUE = "rgb(245, 245, 245)";
    const FONT = "monospace";
    const RADIUS = "4px";

    const applyBase = (el) => {
      el.style("font-family", FONT);
      el.style("font-size", "12px");
      el.style("color", FG_VALUE);
    };

    const makeRow = (parent, labelText) => {
      const row = createDiv();
      row.parent(parent);
      row.style("display", "flex");
      row.style("align-items", "center");
      row.style("gap", "10px");
      row.style("margin-bottom", "5px");
      const lbl = createSpan(labelText);
      lbl.parent(row);
      lbl.style("min-width", "110px");
      lbl.style("font-family", FONT);
      lbl.style("font-size", "12px");
      lbl.style("color", FG_HINT);
      return { row, lbl };
    };

    const styleSlider = (sl) => {
      sl.style("flex", "1");
      sl.style("accent-color", FG_VALUE);
    };

    // ── Persistent toggle button ───────────────────────────────────────────
    const toggleBtn = createButton("⚙  SETTINGS");
    toggleBtn.position(10, 10);
    applyBase(toggleBtn);
    toggleBtn.style("background", BG);
    toggleBtn.style("border", "none");
    toggleBtn.style("border-radius", RADIUS);
    toggleBtn.style("padding", "5px 10px");
    toggleBtn.style("cursor", "pointer");
    toggleBtn.style("letter-spacing", "0.08em");

    // ── Panel ──────────────────────────────────────────────────────────────
    const panel = createDiv();
    panel.position(10, 42);
    applyBase(panel);
    panel.style("background", BG);
    panel.style("border-radius", RADIUS);
    panel.style("padding", "12px 16px");
    panel.style("min-width", "260px");
    panel.style("line-height", "1.6");

    toggleBtn.mousePressed(() => {
      if (panel.elt.style.display === "none") {
        panel.show();
      } else {
        panel.hide();
      }
    });

    // ── Font dropdown ──────────────────────────────────────────────────────
    const { row: fontRow, lbl: fontLbl } = makeRow(panel, "FONT");
    const fontSelect = createSelect();
    fontSelect.parent(fontRow);
    fontSelect.style("flex", "1");
    fontSelect.style("background", "rgba(255,255,255,0.08)");
    fontSelect.style("color", FG_VALUE);
    fontSelect.style("border", "1px solid rgba(255,255,255,0.15)");
    fontSelect.style("border-radius", RADIUS);
    fontSelect.style("font-family", FONT);
    fontSelect.style("font-size", "12px");
    fontSelect.style("padding", "2px 4px");
    const availableFonts = [
      "C64_Pro_Mono-STYLE.otf",
      "Courier New.ttf",
      "PartyLET-plain.ttf",
    ];
    for (const f of availableFonts) fontSelect.option(f, f);
    fontSelect.selected(availableFonts[0]);
    fontSelect.changed(() => this.handleFontChange(fontSelect.value()));

    // ── Stiffness slider ───────────────────────────────────────────────────
    const stiffnessInit = this.springOptions.CENTER_STIFFNESS;
    const { lbl: stiffLbl } = makeRow(
      panel,
      `STIFFNESS  ${stiffnessInit.toFixed(2)}`,
    );
    const stiffSlider = createSlider(0, 1, stiffnessInit, 0.01);
    stiffSlider.parent(stiffLbl.elt.parentNode);
    styleSlider(stiffSlider);
    stiffSlider.input(() => {
      const v = stiffSlider.value();
      stiffLbl.html(`STIFFNESS  ${v.toFixed(2)}`);
      const MIN = 0.005;
      const stiff = MIN + v * (1 - MIN);
      const damp = v * v;
      this.springOptions.CENTER_STIFFNESS = stiff;
      this.springOptions.CENTER_DAMPING = damp;
      this.springOptions.EDGE_STIFFNESS = stiff;
      this.springOptions.EDGE_DAMPING = damp;
      this.springOptions.SUPPORT_STIFFNESS = stiff * 0.6;
      this.springOptions.SUPPORT_DAMPING = damp;
    });

    // ── Font size slider ───────────────────────────────────────────────────
    const { lbl: sizeLbl } = makeRow(panel, `SIZE  ${size}`);
    const sizeSlider = createSlider(30, 300, size, 1);
    sizeSlider.parent(sizeLbl.elt.parentNode);
    styleSlider(sizeSlider);
    sizeSlider.input(() => {
      size = sizeSlider.value();
      sizeLbl.html(`SIZE  ${size}`);
    });

    // ── Particle radius slider ─────────────────────────────────────────────
    const { lbl: radLbl } = makeRow(panel, `RADIUS  ${this.particleRadius}`);
    const radSlider = createSlider(2, 20, this.particleRadius, 1);
    radSlider.parent(radLbl.elt.parentNode);
    styleSlider(radSlider);
    radSlider.input(() => {
      const v = radSlider.value();
      this.particleRadius = v;
      radLbl.html(`RADIUS  ${v}`);
    });

    // ── Max support links slider ───────────────────────────────────────────
    const initLinks = this.springOptions.MAX_SUPPORT_LINKS;
    const { lbl: linksLbl } = makeRow(panel, `SUPPORT LINKS  ${initLinks}`);
    const linksSlider = createSlider(0, 10, initLinks, 1);
    linksSlider.parent(linksLbl.elt.parentNode);
    styleSlider(linksSlider);
    linksSlider.input(() => {
      const v = linksSlider.value();
      this.springOptions.MAX_SUPPORT_LINKS = v;
      linksLbl.html(`SUPPORT LINKS  ${v}`);
    });

    // ── Sample factor slider ───────────────────────────────────────────────
    const { lbl: sfLbl } = makeRow(
      panel,
      `SAMPLE FACTOR  ${this.sampleFactor.toFixed(2)}`,
    );
    const sfSlider = createSlider(0.1, 1.5, this.sampleFactor, 0.01);
    sfSlider.parent(sfLbl.elt.parentNode);
    styleSlider(sfSlider);
    sfSlider.input(() => {
      const v = sfSlider.value();
      this.sampleFactor = v;
      sfLbl.html(`SAMPLE FACTOR  ${v.toFixed(2)}`);
    });

    // ── Emit speed slider ──────────────────────────────────────────────────
    const initSpeed = 400;
    const { lbl: speedLbl } = makeRow(panel, `SPEED  ${initSpeed}ms`);
    const speedSlider = createSlider(100, 2000, initSpeed, 50);
    speedSlider.parent(speedLbl.elt.parentNode);
    styleSlider(speedSlider);
    speedSlider.input(() => {
      const v = speedSlider.value();
      speedLbl.html(`SPEED  ${v}ms`);
      if (typeof emitIntervalId !== "undefined" && emitIntervalId !== null) {
        clearInterval(emitIntervalId);
        emitIntervalId = setInterval(() => emitter.randomLetter(), v);
      }
      emitter._emitDelay = v;
    });
    this._emitDelay = initSpeed;
  }
  handleFontChange(newFont) {
    this.font = loadFont(`fonts/${newFont}`);
  }
}

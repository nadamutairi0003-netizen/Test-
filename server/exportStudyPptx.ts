import PptxGenJS from 'pptxgenjs';

const C_EMERALD_DARK = '064E3B';
const C_EMERALD = '047857';
const C_EMERALD_BRIGHT = '10B981';
const C_EMERALD_LIGHT = 'ECFDF5';
const C_EMERALD_BORDER = 'A7F3D0';
const C_GOLD = 'B45309';
const C_GOLD_LIGHT = 'FEF3C7';
const C_GOLD_BORDER = 'FCD34D';
const C_SLATE_DARK = '0F172A';
const C_SLATE_TEXT = '334155';
const C_SLATE_MUTED = '64748B';
const C_BG = 'F8FAF9';
const C_WHITE = 'FFFFFF';
const C_BORDER = 'CBD5E1';

const FONT_AR = 'Tahoma';

function addSlideHeader(
  pptx: PptxGenJS,
  slide: PptxGenJS.Slide,
  sectionLabel: string,
  title: string,
  slideNumber: number
) {
  slide.background = { color: C_BG };

  // Top emerald accent bar
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.1,
    fill: { color: C_EMERALD },
    line: { color: C_EMERALD, pt: 0 },
  });

  // Thin gold highlight strip under emerald bar on right side
  slide.addShape(pptx.ShapeType.rect, {
    x: 10.2,
    y: 0.1,
    w: 3.133,
    h: 0.04,
    fill: { color: 'D97706' },
    line: { color: 'D97706', pt: 0 },
  });

  // Section label (right-aligned for RTL)
  slide.addText(sectionLabel, {
    x: 0.65,
    y: 0.28,
    w: 12.03,
    h: 0.28,
    fontFace: FONT_AR,
    fontSize: 11,
    bold: true,
    color: C_EMERALD,
    align: 'right',
    rtlMode: true,
  });

  // Slide Title
  slide.addText(title, {
    x: 0.65,
    y: 0.56,
    w: 12.03,
    h: 0.5,
    fontFace: FONT_AR,
    fontSize: 21,
    bold: true,
    color: C_SLATE_DARK,
    align: 'right',
    rtlMode: true,
  });

  // Thin divider line
  slide.addShape(pptx.ShapeType.line, {
    x: 0.65,
    y: 1.14,
    w: 12.03,
    h: 0,
    line: { color: C_BORDER, pt: 1 },
  });

  // Footer
  slide.addText('منصة «مُعتمَد» · العرض التنفيذي ودراسة الجدوى الشاملة', {
    x: 5.5,
    y: 7.08,
    w: 7.18,
    h: 0.28,
    fontFace: FONT_AR,
    fontSize: 9,
    color: C_SLATE_MUTED,
    align: 'right',
    rtlMode: true,
  });

  slide.addText(`${slideNumber} / 10`, {
    x: 0.65,
    y: 7.08,
    w: 1.2,
    h: 0.28,
    fontFace: FONT_AR,
    fontSize: 9,
    bold: true,
    color: C_EMERALD,
    align: 'left',
  });
}

function addCard(
  pptx: PptxGenJS,
  slide: PptxGenJS.Slide,
  x: number,
  y: number,
  w: number,
  h: number,
  options?: { fill?: string; border?: string; pt?: number }
) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.08,
    fill: { color: options?.fill || C_WHITE },
    line: { color: options?.border || C_BORDER, pt: options?.pt ?? 1 },
  });
}

function addBadge(
  pptx: PptxGenJS,
  slide: PptxGenJS.Slide,
  x: number,
  y: number,
  label: string,
  fillColor = C_EMERALD_DARK
) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w: 0.44,
    h: 0.44,
    rectRadius: 0.08,
    fill: { color: fillColor },
    line: { color: fillColor, pt: 0 },
  });
  slide.addText(label, {
    x,
    y: y + 0.02,
    w: 0.44,
    h: 0.4,
    fontFace: FONT_AR,
    fontSize: 13,
    bold: true,
    color: C_WHITE,
    align: 'center',
    valign: 'middle',
  });
}

export async function buildStudyPptxBuffer(): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.333" x 7.5" true widescreen
  pptx.rtlMode = true;
  pptx.title = 'دراسة الجدوى وخطة التنفيذ الشاملة — منصة مُعتمَد';
  pptx.subject = 'الفرصة السوقية، الميزانية التأسيسية والتشغيلية، وخارطة الإطلاق لمنصة مُعتمَد';
  pptx.author = 'منصة مُعتمَد';

  // =========================================================
  // SLIDE 1: Executive Cover Slide
  // =========================================================
  const s1 = pptx.addSlide();
  s1.background = { color: C_EMERALD_DARK };

  // Top emerald & gold accent lines
  s1.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.14,
    fill: { color: C_EMERALD_BRIGHT },
    line: { color: C_EMERALD_BRIGHT, pt: 0 },
  });
  s1.addShape(pptx.ShapeType.rect, {
    x: 9.0,
    y: 0.14,
    w: 4.333,
    h: 0.06,
    fill: { color: 'F59E0B' },
    line: { color: 'F59E0B', pt: 0 },
  });

  // Subtle decorative left-side geometric accent panel
  s1.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0.14,
    w: 0.45,
    h: 7.36,
    fill: { color: '053B2D' },
    line: { color: '053B2D', pt: 0 },
  });

  s1.addText('ملف عرض تنفيذي · دراسة جدوى متكاملة وخطة إطلاق', {
    x: 0.9,
    y: 1.05,
    w: 11.53,
    h: 0.42,
    fontFace: FONT_AR,
    fontSize: 14,
    bold: true,
    color: 'FCD34D',
    align: 'right',
    rtlMode: true,
  });

  s1.addText('منصة «مُعتمَد» للتعليم الخصوصي\nوالكلاسات الجماعية الموثوقة', {
    x: 0.9,
    y: 1.62,
    w: 11.53,
    h: 1.7,
    fontFace: FONT_AR,
    fontSize: 36,
    bold: true,
    color: C_WHITE,
    align: 'right',
    rtlMode: true,
  });

  s1.addText(
    'رؤية سعودية واعدة لتحويل سوق الدروس الخصوصية إلى منظومة رقمية مرخّصة ومربحة، تجمع بين الثقة والأمان للأسر، والعائد المجزي للمعلمين المعتمدين.',
    {
      x: 0.9,
      y: 3.5,
      w: 11.53,
      h: 0.85,
      fontFace: FONT_AR,
      fontSize: 15,
      color: 'D1FAE5',
      align: 'right',
      rtlMode: true,
    }
  );

  const coverMetrics = [
    { label: 'عمولة المنصة الثابتة', value: '10%' },
    { label: 'المدة للإطلاق التجاري', value: '12–14 أسبوعاً' },
    { label: 'التأسيس المبدئي السريع', value: '40,000 ر.س' },
    { label: 'نقطة التعادل الشهرية', value: 'نحو 110 طلاب' },
  ];
  coverMetrics.forEach((item, idx) => {
    const cardW = 2.68;
    const gap = 0.27;
    const x = 12.43 - cardW * (idx + 1) - gap * idx;
    s1.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 4.82,
      w: cardW,
      h: 1.4,
      rectRadius: 0.08,
      fill: { color: '065F46' },
      line: { color: C_EMERALD_BRIGHT, pt: 1.2 },
    });
    s1.addText(item.value, {
      x: x + 0.15,
      y: 5.02,
      w: cardW - 0.3,
      h: 0.55,
      fontFace: FONT_AR,
      fontSize: 20,
      bold: true,
      color: C_WHITE,
      align: 'center',
      rtlMode: true,
    });
    s1.addText(item.label, {
      x: x + 0.15,
      y: 5.66,
      w: cardW - 0.3,
      h: 0.42,
      fontFace: FONT_AR,
      fontSize: 11,
      color: 'A7F3D0',
      align: 'center',
      rtlMode: true,
    });
  });

  s1.addText('المملكة العربية السعودية · مواءمة مع مستهدفات رؤية 2030 في التعليم الرقمي', {
    x: 0.9,
    y: 6.76,
    w: 11.53,
    h: 0.35,
    fontFace: FONT_AR,
    fontSize: 11,
    color: 'A7F3D0',
    align: 'right',
    rtlMode: true,
  });

  // =========================================================
  // SLIDE 2: Real Saudi Market Opportunity & Motivation
  // =========================================================
  const s2 = pptx.addSlide();
  addSlideHeader(
    pptx,
    s2,
    '01 · الفرصة السوقية الحقيقية',
    'لماذا يمتلك مشروع «مُعتمَد» مقوّمات نجاح عالية في السوق السعودي؟',
    2
  );

  // Right Panel: Market Reality
  addCard(pptx, s2, 6.8, 1.38, 5.88, 3.65, { fill: C_WHITE, border: C_BORDER });
  s2.addText('حقائق السوق والطلب التعليمي القائم', {
    x: 7.05,
    y: 1.56,
    w: 5.38,
    h: 0.4,
    fontFace: FONT_AR,
    fontSize: 15,
    bold: true,
    color: C_GOLD,
    align: 'right',
    rtlMode: true,
  });
  s2.addText(
    '• قاعدة طلابية ضخمة تتجاوز 6 ملايين طالب وطالبة في التعليم العام، إضافةً إلى طلاب الجامعات والمتقدمين لاختبارات قياس (القدرات والتحصيلي وSTEP).\n' +
      '• الأسر تبحث عن معلمين مؤهلين وموثوقين؛ إذ يفتقر السوق غير المنظم إلى التحقق من الرخصة المهنية والمؤهلات.\n' +
      '• تكاليف الحصص الفردية التقليدية مرتفعة على كثير من الأسر، ما يخلق طلباً حقيقياً على بدائل جماعية منظمة وبسعر مناسب.\n' +
      '• غياب الضمان المالي وتقارير المتابعة الدورية في التعاملات العشوائية عبر تطبيقات المحادثة.',
    {
      x: 7.05,
      y: 2.04,
      w: 5.38,
      h: 2.85,
      fontFace: FONT_AR,
      fontSize: 12,
      color: C_SLATE_TEXT,
      align: 'right',
      valign: 'top',
      rtlMode: true,
      paraSpaceAfter: 9,
    }
  );

  // Left Panel: Strategic Value of Mutamad
  addCard(pptx, s2, 0.65, 1.38, 5.88, 3.65, { fill: C_EMERALD_LIGHT, border: C_EMERALD_BORDER, pt: 1.2 });
  s2.addText('القيمة التنافسية لمنصة «مُعتمَد»', {
    x: 0.9,
    y: 1.56,
    w: 5.38,
    h: 0.4,
    fontFace: FONT_AR,
    fontSize: 15,
    bold: true,
    color: C_EMERALD_DARK,
    align: 'right',
    rtlMode: true,
  });
  s2.addText(
    '• معيار جودة صارم: قبول المعلمين بعد مراجعة الرخصة المهنية والشهادات الأكاديمية وتوقيع اتفاقية الاعتماد إلكترونياً.\n' +
      '• نموذج مزدوج ذكي: حصص فردية مخصّصة + كلاسات جماعية يومية (7 أيام بالأسبوع) توفّر على الأسرة حتى 70%.\n' +
      '• حفظ حقوق الجميع: دفع إلكتروني موثّق عبر مدى وApple Pay، وجدولة ذكية تمنع تعارض المواعيد تماماً.\n' +
      '• تجربة مستقبلية متفوقة: مساعد ذكي فوري في كل الصفحات وتقارير أداء آلية تصل لولي الأمر بعد الحصة.',
    {
      x: 0.9,
      y: 2.04,
      w: 5.38,
      h: 2.85,
      fontFace: FONT_AR,
      fontSize: 12,
      color: C_SLATE_DARK,
      align: 'right',
      valign: 'top',
      rtlMode: true,
      paraSpaceAfter: 9,
    }
  );

  // Bottom KPI Strip
  const s2Kpis = [
    { title: '6+ ملايين', sub: 'طالب وطالبة في التعليم العام بالمملكة' },
    { title: 'توفير حتى 70%', sub: 'للأسر عبر الكلاسات الجماعية اليومية' },
    { title: 'الأحد – السبت', sub: 'تغطية مستمرة طوال أيام الأسبوع' },
    { title: 'نموذج جاهز', sub: 'يختصر نصف زمن التطوير وكلفة البدء' },
  ];
  s2Kpis.forEach((k, idx) => {
    const w = 2.82;
    const gap = 0.25;
    const x = 12.68 - w * (idx + 1) - gap * idx;
    addCard(pptx, s2, x, 5.3, w, 1.45, { fill: C_WHITE, border: C_BORDER });
    s2.addShape(pptx.ShapeType.rect, {
      x: x + 0.6,
      y: 5.3,
      w: w - 1.2,
      h: 0.06,
      fill: { color: idx === 3 ? 'D97706' : C_EMERALD },
      line: { color: idx === 3 ? 'D97706' : C_EMERALD, pt: 0 },
    });
    s2.addText(k.title, {
      x: x + 0.15,
      y: 5.5,
      w: w - 0.3,
      h: 0.48,
      fontFace: FONT_AR,
      fontSize: 15.5,
      bold: true,
      color: idx === 3 ? C_GOLD : C_EMERALD,
      align: 'center',
      rtlMode: true,
    });
    s2.addText(k.sub, {
      x: x + 0.15,
      y: 6.06,
      w: w - 0.3,
      h: 0.5,
      fontFace: FONT_AR,
      fontSize: 11,
      color: C_SLATE_MUTED,
      align: 'center',
      rtlMode: true,
    });
  });

  // =========================================================
  // SLIDE 3: Tangible Proof — What Is Already Built Today
  // =========================================================
  const s3 = pptx.addSlide();
  addSlideHeader(
    pptx,
    s3,
    '02 · نقطة الانطلاق القوية',
    'ما تم إنجازه فعلياً في المنصة حتى الآن (نحن لا نبدأ من الصفر)',
    3
  );

  const pillars = [
    {
      num: '1',
      title: 'منظومة الحصص الفردية الخاصة (1-1)',
      body: '• تغطية 3 مسارات تعليمية: المراحل الدراسية، اختبارات قياس (القدرات والتحصيلي وSTEP)، والمرحلة الجامعية.\n• نظام 5 باقات مرنة بخصومات متدرجة حتى 20%، إضافةً إلى شرائح ولاء للأسر (عادي، مميز، نخبوي).',
    },
    {
      num: '2',
      title: 'الكلاسات الجماعية اليومية المخفضة',
      body: '• متاحة لكل المواد في 3 مواعيد ثابتة يومياً (4:00 عصراً، 7:00 مساءً، 9:30 مساءً) طوال أيام الأسبوع السبعة.\n• سعر المقعد يبدأ من 39 إلى 55 ر.س فقط (أو باقة 7 أيام متكاملة)، ما يوسع شريحة العملاء بشكل هائل.',
    },
    {
      num: '3',
      title: 'بوابات متكاملة للطالب وولي الأمر والمدرس',
      body: '• استعراض ملفات الأبناء من حساب واحد لولي الأمر، ومتابعة التقارير والواجبات والمدفوعات بوضوح تام.\n• بوابة مستقلة للمدرس لإدارة المواعيد والمحفظة المالية وسحب الأرباح (IBAN) وتوقيع اتفاقية الاعتماد.',
    },
    {
      num: '4',
      title: 'المساعد الذكي والفصل الافتراضي المدمج',
      body: '• مساعد ذكي متاح في جميع الصفحات: يجيب عن الاستفسارات فوراً، يحسب التكاليف، وينفّذ الحجز مباشرةً.\n• ربط فوري بالفصول الافتراضية (Microsoft Teams أو الفصل المدمج) وإصدار تقارير أداء تلقائية بعد الحصة.',
    },
  ];

  pillars.forEach((p, idx) => {
    const col = idx % 2; // 0 right, 1 left
    const row = Math.floor(idx / 2);
    const w = 5.88;
    const h = 2.25;
    const x = col === 0 ? 6.8 : 0.65;
    const y = row === 0 ? 1.38 : 3.82;
    addCard(pptx, s3, x, y, w, h, { fill: C_WHITE, border: C_BORDER });
    addBadge(pptx, s3, x + w - 0.66, y + 0.18, p.num, C_EMERALD);

    s3.addText(p.title, {
      x: x + 0.25,
      y: y + 0.2,
      w: w - 1.05,
      h: 0.4,
      fontFace: FONT_AR,
      fontSize: 14,
      bold: true,
      color: C_EMERALD_DARK,
      align: 'right',
      rtlMode: true,
    });
    s3.addText(p.body, {
      x: x + 0.25,
      y: y + 0.72,
      w: w - 0.5,
      h: 1.38,
      fontFace: FONT_AR,
      fontSize: 11.5,
      color: C_SLATE_TEXT,
      align: 'right',
      valign: 'top',
      rtlMode: true,
      paraSpaceAfter: 7,
    });
  });

  // Bottom Motivation Banner
  addCard(pptx, s3, 0.65, 6.24, 12.03, 0.66, { fill: C_GOLD_LIGHT, border: C_GOLD_BORDER });
  s3.addText(
    'أثر الجاهزية الحالية: وجود هذا النموذج الحي المتكامل يوفّر على المشروع نحو 40% إلى 60% من التكلفة وزمن التطوير المبدئي.',
    {
      x: 0.9,
      y: 6.36,
      w: 11.53,
      h: 0.42,
      fontFace: FONT_AR,
      fontSize: 12.5,
      bold: true,
      color: C_GOLD,
      align: 'center',
      rtlMode: true,
    }
  );

  // =========================================================
  // SLIDE 4: Unit Economics — Why Both Families and Tutors Win
  // =========================================================
  const s4 = pptx.addSlide();
  addSlideHeader(
    pptx,
    s4,
    '03 · نموذج الإيرادات واقتصاديات الوحدة',
    'معادلة ربحية متوازنة: وفر كبير للأسرة، وعائد مضاعف للمعلم والمنصة',
    4
  );

  // Right card: Private 1-on-1
  addCard(pptx, s4, 6.8, 1.38, 5.88, 3.45, { fill: C_WHITE, border: C_BORDER });
  s4.addText('نموذج الدرس الفردي الخاص (1-1)', {
    x: 7.05,
    y: 1.56,
    w: 5.38,
    h: 0.4,
    fontFace: FONT_AR,
    fontSize: 15,
    bold: true,
    color: C_SLATE_DARK,
    align: 'right',
    rtlMode: true,
  });
  s4.addText(
    '• متوسط سعر الحصة الفردية: 140 ر.س / ساعة.\n' +
      '• نصيب المعلم الصافي (90%): 126 ر.س في الساعة.\n' +
      '• عمولة المنصة (10%): 14 ر.س في الساعة.\n' +
      '• الباقة الشهرية (12 حصة ≈ 1,480 ر.س): تحقق عمولة قدرها 148 ر.س شهرياً من الطالب الواحد.',
    {
      x: 7.05,
      y: 2.08,
      w: 5.38,
      h: 2.55,
      fontFace: FONT_AR,
      fontSize: 12,
      color: C_SLATE_TEXT,
      align: 'right',
      valign: 'top',
      rtlMode: true,
      paraSpaceAfter: 10,
    }
  );

  // Left card: Group Classes (High Margin Multiplier)
  addCard(pptx, s4, 0.65, 1.38, 5.88, 3.45, { fill: C_EMERALD_LIGHT, border: C_EMERALD_BORDER, pt: 1.2 });
  s4.addText('نموذج الكلاس الجماعي اليومي (محرّك النمو والربحية)', {
    x: 0.9,
    y: 1.56,
    w: 5.38,
    h: 0.4,
    fontFace: FONT_AR,
    fontSize: 15,
    bold: true,
    color: C_EMERALD_DARK,
    align: 'right',
    rtlMode: true,
  });
  s4.addText(
    '• سعر المقعد للطالب: 39 – 55 ر.س (أوفر بنسبة تقارب 70% للأسرة).\n' +
      '• عند حضور 10 طلاب فقط في الكلاس = إجمالي 490 ر.س للساعة الواحدة.\n' +
      '• نصيب المعلم الصافي (90%): 441 ر.س في الساعة (أعلى بـ 3.5 أضعاف!).\n' +
      '• عمولة المنصة (10%): 49 ر.س في الساعة نفسها، ما يضاعف ربحية الساعة ثلاث مرات ونصف.',
    {
      x: 0.9,
      y: 2.08,
      w: 5.38,
      h: 2.55,
      fontFace: FONT_AR,
      fontSize: 12,
      color: C_SLATE_DARK,
      align: 'right',
      valign: 'top',
      rtlMode: true,
      paraSpaceAfter: 10,
    }
  );

  // Bottom summary highlight
  addCard(pptx, s4, 0.65, 5.08, 12.03, 1.7, { fill: C_EMERALD_DARK, border: C_EMERALD_DARK });
  s4.addText('لماذا ينجذب المعلمون المتميزون للبقاء داخل «مُعتمَد»؟', {
    x: 0.95,
    y: 5.26,
    w: 11.43,
    h: 0.4,
    fontFace: FONT_AR,
    fontSize: 15,
    bold: true,
    color: 'FCD34D',
    align: 'right',
    rtlMode: true,
  });
  s4.addText(
    'عمولة المنصة 10% فقط (الأقل مقارنةً بالمنصات المشابهة التي تتقاضى 20% إلى 30%)، مع تسويق مستمر يجلب طلاباً جدداً للمعلم، وإتاحة الكلاسات الجماعية التي ترفع دخله الساعي إلى 441 ر.س وأكثر، مع ضمان تحصيل حقوقه المالية بانتظام.',
    {
      x: 0.95,
      y: 5.74,
      w: 11.43,
      h: 0.85,
      fontFace: FONT_AR,
      fontSize: 12.5,
      color: C_WHITE,
      align: 'right',
      valign: 'top',
      rtlMode: true,
    }
  );

  // =========================================================
  // SLIDE 5: Technical Requirements for Production
  // =========================================================
  const s5 = pptx.addSlide();
  addSlideHeader(
    pptx,
    s5,
    '04 · الاحتياجات التقنية الفعلية',
    'البنية التحتية والتكاملات المعتمدة للانتقال إلى التشغيل التجاري',
    5
  );

  const techCols = [
    {
      num: 'أ',
      title: 'قواعد البيانات والاستضافة الآمنة',
      color: C_EMERALD_LIGHT,
      items:
        '• الاعتماد على قاعدة بيانات سحابية (PostgreSQL) مع نسخ احتياطي يومي مؤتمت.\n' +
        '• حفظ مستندات المعلمين والشهادات والواجبات في تخزين سحابي مشفّر.\n' +
        '• استضافة عالية الاعتمادية (99.9%) داخل المملكة أو أقرب مركز معتمد لسرعة الاستجابة.',
    },
    {
      num: 'ب',
      title: 'الأمان والتحقق الوطني (نفاذ)',
      color: C_WHITE,
      items:
        '• الربط الرسمي مع النفاذ الوطني الموحد (نفاذ) لتوثيق هوية المعلم وولي الأمر فعلياً.\n' +
        '• تطبيق نظام صلاحيات صارم (RBAC)، وجدار حماية للتطبيقات، وتشفير كامل للبيانات.\n' +
        '• إجراء فحص اختراق وأمان قبل الإطلاق العام لحماية بيانات الأسر والطلاب.',
    },
    {
      num: 'ج',
      title: 'بوابات الدفع والفوترة الإلكترونية',
      color: C_WHITE,
      items:
        '• الربط مع بوابة دفع مرخصة من البنك المركزي السعودي (Moyasar / HyperPay / Tap).\n' +
        '• دعم مدى وApple Pay وSTC Pay مع تحويل تلقائي لمستحقات المعلمين عبر (IBAN).\n' +
        '• إصدار فواتير إلكترونية متوافقة مع هيئة الزكاة والضريبة والجمارك (زاتكا).',
    },
    {
      num: 'د',
      title: 'الفصول الافتراضية والذكاء الاصطناعي',
      color: C_EMERALD_LIGHT,
      items:
        '• توليد روابط الحصص تلقائياً عبر واجهات Microsoft Teams أو Zoom.\n' +
        '• إشعارات SMS وWhatsApp (عبر مزود محلي مثل Unifonic) لتذكير الأطراف قبل الحصة.\n' +
        '• اشتراك تجاري مستقر لخدمة الذكاء الاصطناعي لضمان استجابة فورية وقت الذروة.',
    },
  ];

  techCols.forEach((tc, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const w = 5.88;
    const h = 2.62;
    const x = col === 0 ? 6.8 : 0.65;
    const y = row === 0 ? 1.38 : 4.22;
    addCard(pptx, s5, x, y, w, h, {
      fill: tc.color,
      border: tc.color === C_EMERALD_LIGHT ? C_EMERALD_BORDER : C_BORDER,
    });
    addBadge(pptx, s5, x + w - 0.66, y + 0.16, tc.num, C_EMERALD_DARK);

    s5.addText(tc.title, {
      x: x + 0.25,
      y: y + 0.18,
      w: w - 1.05,
      h: 0.4,
      fontFace: FONT_AR,
      fontSize: 14,
      bold: true,
      color: C_EMERALD_DARK,
      align: 'right',
      rtlMode: true,
    });
    s5.addText(tc.items, {
      x: x + 0.25,
      y: y + 0.68,
      w: w - 0.5,
      h: 1.78,
      fontFace: FONT_AR,
      fontSize: 11.5,
      color: C_SLATE_TEXT,
      align: 'right',
      valign: 'top',
      rtlMode: true,
      paraSpaceAfter: 7,
    });
  });

  // =========================================================
  // SLIDE 6: Regulatory Compliance & Founding Team
  // =========================================================
  const s6 = pptx.addSlide();
  addSlideHeader(
    pptx,
    s6,
    '05 · المتطلبات النظامية وفريق العمل',
    'الالتزام التنظيمي داخل المملكة وهيكل فريق التأسيس الأساسي',
    6
  );

  // Right: Legal & Regulatory
  addCard(pptx, s6, 6.8, 1.38, 5.88, 5.42, { fill: C_WHITE, border: C_BORDER });
  s6.addText('المتطلبات القانونية والتنظيمية (السعودية)', {
    x: 7.05,
    y: 1.58,
    w: 5.38,
    h: 0.42,
    fontFace: FONT_AR,
    fontSize: 14.5,
    bold: true,
    color: C_EMERALD_DARK,
    align: 'right',
    rtlMode: true,
  });
  s6.addText(
    '1. السجل التجاري والحساب البنكي:\n' +
      '   إصدار سجل تجاري لنشاط تقنية المعلومات أو منصة وساطة تعليمية عبر المركز السعودي للأعمال، وفتح حساب بنكي تجاري.\n\n' +
      '2. المواءمة مع الجهات التعليمية:\n' +
      '   الالتزام بضوابط المركز الوطني للتعليم الإلكتروني (NELC) واشتراط الرخصة المهنية للمعلم قبل اعتماد حسابه.\n\n' +
      '3. نظام حماية البيانات الشخصية (PDPL):\n' +
      '   صياغة سياسة خصوصية متوافقة مع ضوابط سدايا (SDAIA) وحفظ بيانات الطلاب وأولياء الأمور بأمان تام.\n\n' +
      '4. التنظيم المالي والضريبي (SAMA وZATCA):\n' +
      '   التعاقد مع بوابة دفع مرخّصة من البنك المركزي وتطبيق الفوترة الإلكترونية على عمولة المنصة فقط.',
    {
      x: 7.05,
      y: 2.12,
      w: 5.38,
      h: 4.5,
      fontFace: FONT_AR,
      fontSize: 11.5,
      color: C_SLATE_TEXT,
      align: 'right',
      valign: 'top',
      rtlMode: true,
      paraSpaceAfter: 4,
    }
  );

  // Left: Core Founding Team (NO "رشيق"!)
  addCard(pptx, s6, 0.65, 1.38, 5.88, 5.42, { fill: C_EMERALD_LIGHT, border: C_EMERALD_BORDER });
  s6.addText('فريق التأسيس الأساسي المطلوب للإطلاق', {
    x: 0.9,
    y: 1.58,
    w: 5.38,
    h: 0.42,
    fontFace: FONT_AR,
    fontSize: 14.5,
    bold: true,
    color: C_EMERALD_DARK,
    align: 'right',
    rtlMode: true,
  });
  s6.addText(
    '• قائد المشروع ومدير العمليات (دوام كامل):\n' +
      '   إدارة المنتج، بناء الشراكات التعليمية، واستقطاب الدفعة الأولى من المعلمين المتميزين.\n\n' +
      '• مطور برمجيات متكامل — Full-Stack (تعاقد أو دوام كامل):\n' +
      '   استكمال الربط مع قاعدة البيانات، النفاذ الوطني، بوابة الدفع، والفصول الافتراضية.\n\n' +
      '• مصمم تجربة مستخدم وواجهات (دوام جزئي):\n' +
      '   تحسين تجربة الجوال وسهولة التصفح والحجز لأولياء الأمور.\n\n' +
      '• مسؤول اعتماد وجودة ودعم عملاء (جزئي عند الإطلاق):\n' +
      '   مراجعة طلبات المعلمين والشهادات ومتابعة رضا الأسر وحل أي ملاحظات فوراً.\n\n' +
      '• مختص تسويق رقمي (تعاقد بالنتائج):\n' +
      '   تشغيل حملات الاستقطاب خلال مواسم الدراسة والاختبارات.',
    {
      x: 0.9,
      y: 2.12,
      w: 5.38,
      h: 4.5,
      fontFace: FONT_AR,
      fontSize: 11.5,
      color: C_SLATE_DARK,
      align: 'right',
      valign: 'top',
      rtlMode: true,
      paraSpaceAfter: 4,
    }
  );

  // =========================================================
  // SLIDE 7: Startup Costs (CAPEX) + Native Comparison Chart
  // =========================================================
  const s7 = pptx.addSlide();
  addSlideHeader(
    pptx,
    s7,
    '06 · الميزانية التأسيسية (CAPEX)',
    'مقارنة التكلفة: مسار التأسيس المبدئي (40 ألف ر.س) مقابل التوسعي (140 ألف ر.س)',
    7
  );

  const capexRows: PptxGenJS.TableRow[] = [
    [
      { text: 'التوسعي المتكامل', options: { bold: true, fill: { color: C_EMERALD_DARK }, color: C_WHITE, align: 'center' } },
      { text: 'التأسيسي المبدئي', options: { bold: true, fill: { color: C_EMERALD_DARK }, color: C_WHITE, align: 'center' } },
      { text: 'البند التأسيسي', options: { bold: true, fill: { color: C_EMERALD_DARK }, color: C_WHITE, align: 'right' } },
    ],
    [
      { text: '15,000 ر.س', options: { align: 'center' } },
      { text: '5,000 ر.س', options: { align: 'center' } },
      { text: 'التأسيس القانوني والتراخيص (سجل تجاري وعقود)', options: { bold: true, align: 'right' } },
    ],
    [
      { text: '55,000 ر.س', options: { align: 'center', fill: { color: 'F8FAFC' } } },
      { text: '15,000 ر.س', options: { align: 'center', fill: { color: 'F8FAFC' } } },
      { text: 'استكمال التطوير والربط البرمجي والأمني', options: { bold: true, align: 'right', fill: { color: 'F8FAFC' } } },
    ],
    [
      { text: '12,000 ر.س', options: { align: 'center' } },
      { text: '2,500 ر.س', options: { align: 'center' } },
      { text: 'النطاق الرسمي (.sa) وفحص الأمان', options: { bold: true, align: 'right' } },
    ],
    [
      { text: '8,000 ر.س', options: { align: 'center', fill: { color: 'F8FAFC' } } },
      { text: '2,500 ر.س', options: { align: 'center', fill: { color: 'F8FAFC' } } },
      { text: 'تهيئة بوابة الدفع والفوترة الإلكترونية', options: { bold: true, align: 'right', fill: { color: 'F8FAFC' } } },
    ],
    [
      { text: '35,000 ر.س', options: { align: 'center' } },
      { text: '10,000 ر.س', options: { align: 'center' } },
      { text: 'حملة الإطلاق الأولية (استقطاب المعلمين والطلاب)', options: { bold: true, align: 'right' } },
    ],
    [
      { text: '15,000 ر.س', options: { align: 'center', fill: { color: 'F8FAFC' } } },
      { text: '5,000 ر.س', options: { align: 'center', fill: { color: 'F8FAFC' } } },
      { text: 'احتياطي طوارئ (~12%)', options: { bold: true, align: 'right', fill: { color: 'F8FAFC' } } },
    ],
    [
      { text: '140,000 ر.س', options: { bold: true, fill: { color: C_EMERALD_LIGHT }, color: C_EMERALD_DARK, align: 'center' } },
      { text: '40,000 ر.س', options: { bold: true, fill: { color: C_EMERALD_LIGHT }, color: C_EMERALD_DARK, align: 'center' } },
      { text: 'الإجمالي التأسيسي بالريال السعودي', options: { bold: true, fill: { color: C_EMERALD_LIGHT }, color: C_EMERALD_DARK, align: 'right' } },
    ],
  ];

  // Right side: Table
  s7.addTable(capexRows, {
    x: 4.95,
    y: 1.38,
    w: 7.73,
    colW: [1.75, 1.75, 4.23],
    rowH: 0.56,
    fontFace: FONT_AR,
    fontSize: 10.5,
    color: C_SLATE_DARK,
    border: { pt: 0.75, color: C_BORDER },
    fill: { color: C_WHITE },
    valign: 'middle',
  });

  // Left side: Native Bar Chart + Recommendation Card
  addCard(pptx, s7, 0.65, 1.38, 4.05, 3.65, { fill: C_WHITE, border: C_BORDER });
  s7.addText('مقارنة الميزانية (ألف ر.س)', {
    x: 0.85,
    y: 1.5,
    w: 3.65,
    h: 0.35,
    fontFace: FONT_AR,
    fontSize: 12.5,
    bold: true,
    color: C_EMERALD_DARK,
    align: 'center',
    rtlMode: true,
  });
  s7.addChart(
    pptx.ChartType.bar,
    [
      {
        name: 'التأسيس المبدئي',
        labels: ['التطوير', 'التسويق', 'التأسيس والربط', 'الإجمالي'],
        values: [15, 10, 15, 40],
      },
      {
        name: 'التوسعي المتكامل',
        labels: ['التطوير', 'التسويق', 'التأسيس والربط', 'الإجمالي'],
        values: [55, 35, 50, 140],
      },
    ],
    {
      x: 0.8,
      y: 1.9,
      w: 3.75,
      h: 2.95,
      barDir: 'col',
      barGrouping: 'clustered',
      chartColors: [C_EMERALD, 'D97706'],
      showLegend: true,
      legendPos: 'b',
      legendFontSize: 9,
      catAxisLabelFontSize: 9,
      valAxisLabelFontSize: 9,
      showValue: true,
      dataLabelFontSize: 8.5,
      dataLabelColor: C_SLATE_DARK,
    }
  );

  addCard(pptx, s7, 0.65, 5.2, 4.05, 1.6, { fill: C_EMERALD_LIGHT, border: C_EMERALD_BORDER });
  s7.addText('التوصية التنفيذية للإدارة:', {
    x: 0.85,
    y: 5.32,
    w: 3.65,
    h: 0.35,
    fontFace: FONT_AR,
    fontSize: 12,
    bold: true,
    color: C_EMERALD_DARK,
    align: 'right',
    rtlMode: true,
  });
  s7.addText(
    'البدء بمسار التأسيس المبدئي (40,000 ر.س)؛ لأنه أقل مخاطرةً مالية، ويعتمد على جاهزية التطبيق الحالية لإثبات الإيراد سريعاً ثم التوسع من الأرباح.',
    {
      x: 0.85,
      y: 5.7,
      w: 3.65,
      h: 0.98,
      fontFace: FONT_AR,
      fontSize: 10.5,
      color: C_SLATE_DARK,
      align: 'right',
      valign: 'top',
      rtlMode: true,
    }
  );

  // Bottom Note under table
  addCard(pptx, s7, 4.95, 6.08, 7.73, 0.72, { fill: C_GOLD_LIGHT, border: C_GOLD_BORDER });
  s7.addText(
    'ميزة اقتصادية حقيقية: لو بدأ المشروع من الصفر دون نموذج جاهز، لتجاوزت كلفة التطوير وحدها 85,000 ر.س في السوق المحلي.',
    {
      x: 5.15,
      y: 6.22,
      w: 7.33,
      h: 0.45,
      fontFace: FONT_AR,
      fontSize: 11,
      bold: true,
      color: C_GOLD,
      align: 'right',
      rtlMode: true,
    }
  );

  // =========================================================
  // SLIDE 8: Monthly Operating Costs (OPEX) & Payment Fees
  // =========================================================
  const s8 = pptx.addSlide();
  addSlideHeader(
    pptx,
    s8,
    '07 · التكاليف التشغيلية الشهرية (OPEX)',
    'المصروفات الشهرية الثابتة والرسوم الفعلية لبوابات الدفع والضريبة',
    8
  );

  const opexRows: PptxGenJS.TableRow[] = [
    [
      { text: 'مرحلة التوسع (10,000+ مستخدم)', options: { bold: true, fill: { color: C_EMERALD_DARK }, color: C_WHITE, align: 'center' } },
      { text: 'المرحلة الأولى (حتى 1,000 مستخدم)', options: { bold: true, fill: { color: C_EMERALD_DARK }, color: C_WHITE, align: 'center' } },
      { text: 'البند التشغيلي الشهري', options: { bold: true, fill: { color: C_EMERALD_DARK }, color: C_WHITE, align: 'right' } },
    ],
    [
      { text: '4,000 – 8,000 ر.س', options: { align: 'center' } },
      { text: '600 – 1,200 ر.س', options: { align: 'center' } },
      { text: 'الاستضافة السحابية، قاعدة البيانات، والتخزين', options: { bold: true, align: 'right' } },
    ],
    [
      { text: '2,500 – 5,000 ر.س', options: { align: 'center', fill: { color: 'F8FAFC' } } },
      { text: '400 – 900 ر.س', options: { align: 'center', fill: { color: 'F8FAFC' } } },
      { text: 'خدمات الذكاء الاصطناعي وتنبيهات SMS / WhatsApp', options: { bold: true, align: 'right', fill: { color: 'F8FAFC' } } },
    ],
    [
      { text: '2,000 – 4,500 ر.س', options: { align: 'center' } },
      { text: '300 – 700 ر.س', options: { align: 'center' } },
      { text: 'تراخيص الفصول الافتراضية (Teams / Zoom API)', options: { bold: true, align: 'right' } },
    ],
    [
      { text: '30,000 – 55,000 ر.س', options: { align: 'center', fill: { color: 'F8FAFC' } } },
      { text: '6,000 – 12,000 ر.س', options: { align: 'center', fill: { color: 'F8FAFC' } } },
      { text: 'فريق التشغيل، الاعتماد، الدعم الفني، والتطوير', options: { bold: true, align: 'right', fill: { color: 'F8FAFC' } } },
    ],
    [
      { text: '20,000 – 40,000 ر.س', options: { align: 'center' } },
      { text: '4,000 – 8,000 ر.س', options: { align: 'center' } },
      { text: 'التسويق الرقمي الشهري واستقطاب الأسر', options: { bold: true, align: 'right' } },
    ],
    [
      { text: '3,500 – 6,000 ر.س', options: { align: 'center', fill: { color: 'F8FAFC' } } },
      { text: '1,000 – 1,500 ر.س', options: { align: 'center', fill: { color: 'F8FAFC' } } },
      { text: 'المحاسبة والمصاريف الإدارية', options: { bold: true, align: 'right', fill: { color: 'F8FAFC' } } },
    ],
    [
      { text: '62,000 – 118,500 ر.س / شهر', options: { bold: true, fill: { color: C_EMERALD_LIGHT }, color: C_EMERALD_DARK, align: 'center' } },
      { text: '12,300 – 24,300 ر.س / شهر', options: { bold: true, fill: { color: C_EMERALD_LIGHT }, color: C_EMERALD_DARK, align: 'center' } },
      { text: 'إجمالي المصروفات الشهرية الثابتة', options: { bold: true, fill: { color: C_EMERALD_LIGHT }, color: C_EMERALD_DARK, align: 'right' } },
    ],
  ];

  s8.addTable(opexRows, {
    x: 0.65,
    y: 1.38,
    w: 12.03,
    colW: [3.35, 3.35, 5.33],
    rowH: 0.48,
    fontFace: FONT_AR,
    fontSize: 11,
    color: C_SLATE_DARK,
    border: { pt: 0.75, color: C_BORDER },
    fill: { color: C_WHITE },
    valign: 'middle',
  });

  addCard(pptx, s8, 0.65, 5.5, 12.03, 1.3, { fill: C_GOLD_LIGHT, border: C_GOLD_BORDER });
  s8.addText('الرسوم الفعلية لبوابات الدفع وضريبة القيمة المضافة في السعودية:', {
    x: 0.9,
    y: 5.64,
    w: 11.5,
    h: 0.35,
    fontFace: FONT_AR,
    fontSize: 12.5,
    bold: true,
    color: C_GOLD,
    align: 'right',
    rtlMode: true,
  });
  s8.addText(
    '• بطاقات مدى (الأكثر استخداماً في المملكة): قرابة 1% + 1 ر.س لكل عملية · البطاقات الائتمانية وApple Pay: نحو 2.2% إلى 2.75% + 1 ر.س.\n' +
      '• ضريبة القيمة المضافة (15%): تُحتسب نظامياً على عمولة الوساطة الخاصة بالمنصة (10%) عند تجاوز حد التسجيل الضريبي، وتُسجّل آلياً في الفاتورة.',
    {
      x: 0.9,
      y: 6.02,
      w: 11.5,
      h: 0.68,
      fontFace: FONT_AR,
      fontSize: 11,
      color: '78350F',
      align: 'right',
      rtlMode: true,
      paraSpaceAfter: 4,
    }
  );

  // =========================================================
  // SLIDE 9: Break-Even Point & 3-Year Inspiring Growth Chart
  // =========================================================
  const s9 = pptx.addSlide();
  addSlideHeader(
    pptx,
    s9,
    '08 · الجدوى المالية ونقطة التعادل والنمو',
    'أرقام مشجّعة وواقعية: نقطة تعادل قريبة جداً وقابلية نمو متسارعة',
    9
  );

  // Right Side: Break-Even & 3-Year Highlights
  addCard(pptx, s9, 7.1, 1.38, 5.58, 2.5, { fill: C_EMERALD_DARK, border: C_EMERALD_DARK });
  s9.addText('نقطة التعادل في المرحلة الأولى', {
    x: 7.35,
    y: 1.54,
    w: 5.08,
    h: 0.38,
    fontFace: FONT_AR,
    fontSize: 15,
    bold: true,
    color: 'FCD34D',
    align: 'right',
    rtlMode: true,
  });
  s9.addText(
    '• متوسط التشغيل الشهري المستهدف: 16,000 ر.س\n' +
      '• حجم الحجوزات المطلوب لتغطيته (بعمولة 10%): 160,000 ر.س شهرياً\n' +
      '• ما يعادل: نحو 110 طلاب نشطين فقط (أو قرابة 38 حصةً يومياً على مستوى المملكة بالكامل)!',
    {
      x: 7.35,
      y: 2.02,
      w: 5.08,
      h: 1.72,
      fontFace: FONT_AR,
      fontSize: 12,
      color: C_WHITE,
      align: 'right',
      valign: 'top',
      rtlMode: true,
      paraSpaceAfter: 8,
    }
  );

  addCard(pptx, s9, 7.1, 4.08, 5.58, 2.72, { fill: C_WHITE, border: C_BORDER });
  s9.addText('أفق النمو الواقعي خلال 3 سنوات', {
    x: 7.35,
    y: 4.24,
    w: 5.08,
    h: 0.38,
    fontFace: FONT_AR,
    fontSize: 14,
    bold: true,
    color: C_EMERALD_DARK,
    align: 'right',
    rtlMode: true,
  });
  s9.addText(
    '• السنة الأولى (التشغيل المحلي): 1,000 معلم معتمد · إيراد عمولات مستهدف بين 450 و900 ألف ر.س.\n' +
      '• السنة الثانية (التوسع الخليجي): 10,000 معلم · توسّع الكلاسات الجماعية وباقات الجامعات (إيراد متوقع ~4.5 مليون ر.س).\n' +
      '• السنة الثالثة (الريادة الإقليمية): 50,000+ عميل نشط · متجر ملخصات رقمي وشهادات إلكترونية (إيراد متوقع ~15 مليون ر.س).',
    {
      x: 7.35,
      y: 4.7,
      w: 5.08,
      h: 1.98,
      fontFace: FONT_AR,
      fontSize: 11.2,
      color: C_SLATE_TEXT,
      align: 'right',
      valign: 'top',
      rtlMode: true,
      paraSpaceAfter: 7,
    }
  );

  // Left Side: Native Growth Chart
  addCard(pptx, s9, 0.65, 1.38, 6.2, 5.42, { fill: C_WHITE, border: C_BORDER });
  s9.addText('مسار نمو الإيرادات وحجم الحجوزات التقديري (مليون ر.س)', {
    x: 0.85,
    y: 1.56,
    w: 5.8,
    h: 0.4,
    fontFace: FONT_AR,
    fontSize: 13.5,
    bold: true,
    color: C_SLATE_DARK,
    align: 'center',
    rtlMode: true,
  });
  s9.addChart(
    pptx.ChartType.bar,
    [
      {
        name: 'حجم الحجوزات الكلي (GMV)',
        labels: ['السنة الأولى', 'السنة الثانية', 'السنة الثالثة'],
        values: [7.5, 45.0, 150.0],
      },
      {
        name: 'صافي إيراد المنصة (10%)',
        labels: ['السنة الأولى', 'السنة الثانية', 'السنة الثالثة'],
        values: [0.75, 4.5, 15.0],
      },
    ],
    {
      x: 0.9,
      y: 2.1,
      w: 5.7,
      h: 4.35,
      barDir: 'col',
      barGrouping: 'clustered',
      chartColors: [C_EMERALD_BRIGHT, C_EMERALD_DARK],
      showLegend: true,
      legendPos: 'b',
      legendFontSize: 10,
      catAxisLabelFontSize: 10.5,
      valAxisLabelFontSize: 9.5,
      showValue: true,
      dataLabelFontSize: 9.5,
      dataLabelColor: C_SLATE_DARK,
    }
  );

  // =========================================================
  // SLIDE 10: 12-14 Week Execution Plan, Risk Control & Call to Action
  // =========================================================
  const s10 = pptx.addSlide();
  addSlideHeader(
    pptx,
    s10,
    '09 · خطة التنفيذ والقرار القيادي',
    'جاهزون للانطلاق خلال 12–14 أسبوعاً مع ضبط كامل للمخاطر',
    10
  );

  const phases = [
    {
      step: 'المرحلة 1',
      weeks: 'أسبوع 1–2',
      title: 'التأسيس والتراخيص',
      desc: 'السجل التجاري، الحساب البنكي، التقديم لنفاذ وبوابة الدفع، واعتماد سياسة الخصوصية.',
    },
    {
      step: 'المرحلة 2',
      weeks: 'أسبوع 3–6',
      title: 'القاعدة والأمان',
      desc: 'ربط PostgreSQL، بناء المصادقة الصارمة (RBAC)، وتشفير مستندات المعلمين.',
    },
    {
      step: 'المرحلة 3',
      weeks: 'أسبوع 7–9',
      title: 'التكاملات والفحص',
      desc: 'تفعيل مدى/Apple Pay وزاتكا، ربط نفاذ وTeams، والتنبيهات، وفحص الأمان.',
    },
    {
      step: 'المرحلة 4',
      weeks: 'أسبوع 10–11',
      title: 'الإطلاق التجريبي',
      desc: 'تشغيل مغلق مع 30–50 معلماً و100 طالب لاختبار الجودة والمدفوعات والمساعد الذكي.',
    },
    {
      step: 'المرحلة 5',
      weeks: 'أسبوع 12–14',
      title: 'الإطلاق الرسمي',
      desc: 'فتح المنصة للجمهور، بدء الحملات التسويقية، ومتابعة جودة الحصص والاعتماد.',
    },
  ];

  phases.forEach((ph, idx) => {
    const cardW = 2.25;
    const gap = 0.195;
    const x = 12.68 - cardW * (idx + 1) - gap * idx;
    addCard(pptx, s10, x, 1.38, cardW, 2.75, {
      fill: idx === 4 ? C_EMERALD_LIGHT : C_WHITE,
      border: idx === 4 ? C_EMERALD : C_BORDER,
    });

    s10.addShape(pptx.ShapeType.rect, {
      x: x + 0.1,
      y: 1.5,
      w: cardW - 0.2,
      h: 0.4,
      fill: { color: idx === 4 ? C_EMERALD : C_EMERALD_DARK },
      line: { color: C_EMERALD_DARK, pt: 0 },
    });
    s10.addText(`${ph.step} · ${ph.weeks}`, {
      x: x + 0.1,
      y: 1.52,
      w: cardW - 0.2,
      h: 0.36,
      fontFace: FONT_AR,
      fontSize: 10,
      bold: true,
      color: C_WHITE,
      align: 'center',
      rtlMode: true,
    });

    s10.addText(ph.title, {
      x: x + 0.15,
      y: 2.02,
      w: cardW - 0.3,
      h: 0.4,
      fontFace: FONT_AR,
      fontSize: 13,
      bold: true,
      color: C_SLATE_DARK,
      align: 'right',
      rtlMode: true,
    });

    s10.addText(ph.desc, {
      x: x + 0.15,
      y: 2.48,
      w: cardW - 0.3,
      h: 1.52,
      fontFace: FONT_AR,
      fontSize: 10.5,
      color: C_SLATE_TEXT,
      align: 'right',
      valign: 'top',
      rtlMode: true,
      paraSpaceAfter: 4,
    });
  });

  // Risks Card
  addCard(pptx, s10, 0.65, 4.3, 12.03, 1.52, { fill: C_WHITE, border: C_BORDER });
  s10.addText('ضبط المخاطر الأساسية منذ اليوم الأول:', {
    x: 0.9,
    y: 4.42,
    w: 11.53,
    h: 0.32,
    fontFace: FONT_AR,
    fontSize: 13,
    bold: true,
    color: C_SLATE_DARK,
    align: 'right',
    rtlMode: true,
  });
  s10.addText(
    '• الالتفاف خارج المنصة: إخفاء بيانات التواصل قبل الحجز + تقديم مزايا يصعب الاستغناء عنها (ضمان مالي، كلاسات جماعية، وتقارير آلية).\n' +
      '• تعارض المواعيد أو جودة التدريس: منع التعارض آلياً عند الحجز + اشتراط الرخصة المهنية + تقييمات موثقة ولجنة بلاغات سريعة.',
    {
      x: 0.9,
      y: 4.8,
      w: 11.53,
      h: 0.92,
      fontFace: FONT_AR,
      fontSize: 11,
      color: C_SLATE_TEXT,
      align: 'right',
      valign: 'top',
      rtlMode: true,
      paraSpaceAfter: 5,
    }
  );

  // Inspiring Executive Call-To-Action Banner
  addCard(pptx, s10, 0.65, 5.98, 12.03, 0.88, { fill: C_EMERALD_DARK, border: C_EMERALD_DARK });
  s10.addText(
    'الخطوة التنفيذية المقترحة: اعتماد ميزانية مسار التأسيس المبدئي (40,000 ر.س) لبدء المرحلة الأولى فوراً، وتحويل «مُعتمَد» إلى منصة وطنية رائدة خلال 12–14 أسبوعاً.',
    {
      x: 0.9,
      y: 6.16,
      w: 11.53,
      h: 0.52,
      fontFace: FONT_AR,
      fontSize: 12.5,
      bold: true,
      color: 'FCD34D',
      align: 'center',
      rtlMode: true,
    }
  );

  const output = await pptx.write({ outputType: 'nodebuffer' });
  if (Buffer.isBuffer(output)) {
    return output;
  }
  return Buffer.from(output as Uint8Array);
}

import fs from 'node:fs'
import path from 'node:path'
import PptxGenJS from 'pptxgenjs'

const pptx = new PptxGenJS()
pptx.layout = 'LAYOUT_WIDE'
pptx.author = 'OpenAI Codex'
pptx.company = 'Newsagora'
pptx.subject = 'AI 新聞摘要到 LINE 回推流程'
pptx.title = 'AI 新聞摘要到 LINE 回推流程'
pptx.lang = 'zh-TW'
pptx.theme = {
  headFontFace: 'Aptos Display',
  bodyFontFace: 'Aptos',
  lang: 'zh-TW'
}

const colors = {
  bg: 'F7F1E6',
  paper: 'FFF9F0',
  ink: '1D2430',
  muted: '5F6877',
  brand: 'BF5B3D',
  brandDeep: '8D3F2A',
  sea: '1D5F73',
  gold: 'BE8B2D',
  line: 'D9D1C4',
  paleBrand: 'F5E1D7',
  paleSea: 'DCECEF',
  paleGold: 'F3E8CD'
}

const slide = pptx.addSlide()
slide.background = { color: colors.bg }

slide.addShape(pptx.ShapeType.rect, {
  x: 0.2,
  y: 0.2,
  w: 12.93,
  h: 7.1,
  rectRadius: 0.12,
  fill: { color: colors.paper, transparency: 10 },
  line: { color: 'FFFFFF', transparency: 50 }
})

slide.addText('流程視覺化', {
  x: 0.6,
  y: 0.45,
  w: 2.5,
  h: 0.25,
  fontFace: 'Aptos',
  fontSize: 11,
  bold: true,
  color: colors.brandDeep,
  charSpace: 1.2
})

slide.addText('AI 摘要到 LINE 回推的意見徵集流程', {
  x: 0.6,
  y: 0.75,
  w: 7.8,
  h: 0.45,
  fontFace: 'Aptos Display',
  fontSize: 24,
  bold: true,
  color: colors.ink
})

slide.addText('沿用目前提案簡報風格，將新聞整理、審核、polis、sensemaker 與 LINE Bot 串成一條可說明的營運流程。', {
  x: 0.6,
  y: 1.25,
  w: 8.6,
  h: 0.42,
  fontFace: 'Aptos',
  fontSize: 11,
  color: colors.muted
})

slide.addText('Newsagora / Single Flow Slide', {
  x: 9.2,
  y: 0.48,
  w: 3,
  h: 0.25,
  align: 'right',
  fontFace: 'Aptos',
  fontSize: 10,
  bold: true,
  color: colors.sea
})

slide.addShape(pptx.ShapeType.roundRect, {
  x: 0.75,
  y: 1.95,
  w: 11.55,
  h: 3.1,
  rectRadius: 0.08,
  fill: { color: 'FFFFFF', transparency: 10 },
  line: { color: colors.line }
})

const steps = [
  {
    x: 0.95,
    y: 2.15,
    w: 1.6,
    h: 2.2,
    num: '01',
    title: 'AI 摘要',
    body: '利用 AI 產生新聞摘要，整理重點與可討論題目。',
    accent: colors.brand,
    fill: colors.paleBrand
  },
  {
    x: 2.8,
    y: 2.15,
    w: 1.6,
    h: 2.2,
    num: '02',
    title: '管理員 Review',
    body: '透過介面提交管理員 review，確認內容是否適合公開徵集。',
    accent: colors.sea,
    fill: colors.paleSea
  },
  {
    x: 4.65,
    y: 2.15,
    w: 1.6,
    h: 2.2,
    num: '03',
    title: '建立 Polis',
    body: '管理員確認後，利用 polis 產生意見徵集連結。',
    accent: colors.gold,
    fill: colors.paleGold
  },
  {
    x: 6.5,
    y: 2.15,
    w: 1.6,
    h: 2.2,
    num: '04',
    title: 'LINE 推播',
    body: '將 polis 的意見徵集透過 LINE Bot 推播給用戶。',
    accent: colors.brand,
    fill: colors.paleBrand
  },
  {
    x: 8.35,
    y: 2.15,
    w: 1.6,
    h: 2.2,
    num: '05',
    title: 'Sensemaker',
    body: '徵集結束後，進入 sensemaker 進行整理與摘要。',
    accent: colors.sea,
    fill: colors.paleSea
  },
  {
    x: 10.2,
    y: 2.15,
    w: 1.6,
    h: 2.2,
    num: '06',
    title: '意見回推',
    body: '摘要後利用 LINE Bot 將整理後的意見推送給用戶。',
    accent: colors.gold,
    fill: colors.paleGold
  }
]

for (const step of steps) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: step.x,
    y: step.y,
    w: step.w,
    h: step.h,
    rectRadius: 0.06,
    fill: { color: step.fill },
    line: { color: step.accent, pt: 1.3 }
  })
  slide.addShape(pptx.ShapeType.rect, {
    x: step.x,
    y: step.y,
    w: step.w,
    h: 0.08,
    fill: { color: step.accent },
    line: { color: step.accent }
  })
  slide.addText(step.num, {
    x: step.x + 0.14,
    y: step.y + 0.14,
    w: 0.5,
    h: 0.22,
    fontFace: 'Aptos',
    fontSize: 10,
    bold: true,
    color: step.accent,
    charSpace: 1.1
  })
  slide.addText(step.title, {
    x: step.x + 0.14,
    y: step.y + 0.4,
    w: step.w - 0.28,
    h: 0.42,
    fontFace: 'Aptos Display',
    fontSize: 13,
    bold: true,
    color: colors.ink,
    align: 'center'
  })
  slide.addText(step.body, {
    x: step.x + 0.12,
    y: step.y + 0.9,
    w: step.w - 0.24,
    h: 1.1,
    fontFace: 'Aptos',
    fontSize: 9.4,
    color: colors.muted,
    fit: 'shrink',
    align: 'left',
    valign: 'top'
  })
}

for (let i = 0; i < steps.length - 1; i += 1) {
  const current = steps[i]
  slide.addShape(pptx.ShapeType.chevron, {
    x: current.x + current.w + 0.1,
    y: 3.0,
    w: 0.35,
    h: 0.34,
    fill: { color: i % 2 === 0 ? colors.brand : colors.sea },
    line: { color: i % 2 === 0 ? colors.brand : colors.sea }
  })
}

slide.addText('流程重點', {
  x: 0.78,
  y: 5.45,
  w: 1.8,
  h: 0.25,
  fontFace: 'Aptos',
  fontSize: 10,
  bold: true,
  color: colors.brandDeep,
  charSpace: 1
})

slide.addShape(pptx.ShapeType.roundRect, {
  x: 0.78,
  y: 5.75,
  w: 5.65,
  h: 1.0,
  rectRadius: 0.05,
  fill: { color: 'FFFFFF', transparency: 8 },
  line: { color: colors.line }
})

slide.addText([
  { text: '前半段：', options: { bold: true, color: colors.ink } },
  { text: 'AI 先整理內容，管理員再把關，避免不成熟題目直接對外。', options: { color: colors.muted } },
  { text: '\n後半段：', options: { bold: true, color: colors.ink } },
  { text: 'Polis 蒐集意見、Sensemaker 整理洞察，再透過 LINE Bot 把結果回到使用者端。', options: { color: colors.muted } }
], {
  x: 0.98,
  y: 5.95,
  w: 5.2,
  h: 0.58,
  fontFace: 'Aptos',
  fontSize: 10.5,
  breakLine: true,
  fit: 'shrink'
})

slide.addShape(pptx.ShapeType.roundRect, {
  x: 6.75,
  y: 5.75,
  w: 5.15,
  h: 1.0,
  rectRadius: 0.05,
  fill: { color: 'FFFFFF', transparency: 8 },
  line: { color: colors.line }
})

slide.addText([
  { text: '交付訊息：', options: { bold: true, color: colors.ink } },
  { text: '這不是一次性投票，而是一個「摘要 → 審核 → 徵集 → 整理 → 回饋」的閉環。', options: { color: colors.muted } }
], {
  x: 6.95,
  y: 6.0,
  w: 4.7,
  h: 0.42,
  fontFace: 'Aptos',
  fontSize: 10.5,
  breakLine: true,
  fit: 'shrink'
})

const outDir = path.join(process.cwd(), 'output')
fs.mkdirSync(outDir, { recursive: true })
const outPath = path.join(outDir, 'AI_to_LINE_Flow_Single_Slide.pptx')

await pptx.writeFile({ fileName: outPath })
console.log(outPath)

#!/usr/bin/env bash
# 生成 / 重新生成封面渲染用的 Maple Mono CN 子集字体（regular 400 + bold 700）。
# 约束来源：AGENTS.md R-7（禁止 strokeText 伪加粗，因此必须有真 700 字重）与 R-15。
#
# 用法：  bash scripts/fetch-fonts.sh
# 产物：  public/fonts/maple-mono-cn-regular.woff2
#        public/fonts/maple-mono-cn-bold.woff2
#
# 前置：  python 3 + fontTools（含 brotli）；本机已验证 Python 3.12 / fontTools 4.63 可用
# 说明：  源字体包约 200MB+，国内网络直连 GitHub Releases 可能超时，脚本用 `curl -C -` 断点续传。
set -euo pipefail

VERSION="v7.9"
URL="https://github.com/subframe7536/maple-font/releases/download/${VERSION}/MapleMono-CN.zip"
# better-admin 里已有的 regular 产物，作为「字形覆盖基准」直接复用，避免两份字体覆盖不一致
REGULAR_SRC="E:/personal-project/better-admin/apps/next/public/fonts/maple-mono-cn-regular.woff2"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD="${ROOT}/.font-build"
OUT="${ROOT}/public/fonts"
mkdir -p "${BUILD}" "${OUT}"

cd "${BUILD}"

# ---------- 1. regular ----------
if [ ! -f maple-mono-cn-regular.woff2 ]; then
  cp "${REGULAR_SRC}" maple-mono-cn-regular.woff2
fi

# ---------- 2. 源字体包（可断点续传） ----------
if ! python -c "import zipfile,sys; sys.exit(0 if zipfile.is_zipfile('MapleMono-CN.zip') else 1)" 2>/dev/null; then
  echo "==> 下载 ${URL}"
  curl -L -C - --retry 5 --retry-delay 5 -o MapleMono-CN.zip "${URL}"
  python -c "import zipfile,sys; sys.exit(0 if zipfile.is_zipfile('MapleMono-CN.zip') else 1)" \
    || { echo "!! 压缩包仍不完整，重跑本脚本会继续断点续传"; exit 1; }
fi

# ---------- 3. 取出 Bold 源 ttf ----------
if [ ! -f MapleMono-CN-Bold.ttf ]; then
  python - <<'PY'
import zipfile
with zipfile.ZipFile('MapleMono-CN.zip') as z:
    name = next(n for n in z.namelist() if n.endswith('MapleMono-CN-Bold.ttf'))
    z.extract(name, '.')
    import shutil, os
    shutil.move(os.path.join('.', name), 'MapleMono-CN-Bold.ttf')
    print('extracted:', name)
PY
fi

# ---------- 4. 从 regular 读出实际覆盖码位，作为 Bold 的子集输入 ----------
# 关键：不能按「GB2312 规格」重算，否则会出现常规体有字、粗体缺字的断裂。
python - <<'PY'
from fontTools.ttLib import TTFont
f = TTFont('maple-mono-cn-regular.woff2')
cps = sorted(f.getBestCmap().keys())
# Windows 命令行上限 32767，6893 条码位约 48KB，因此必须走文件而非 --unicodes=
with open('codes.txt', 'w') as fh:
    fh.write(','.join('U+%04X' % c for c in cps))
print('codepoints:', len(cps))
PY

# ---------- 5. 子集化 Bold ----------
# 不加 --layout-features=''：先与现有 regular 保持一致，产出后并排肉眼校对。
pyftsubset MapleMono-CN-Bold.ttf \
  --unicodes-file=codes.txt \
  --flavor=woff2 \
  --no-hinting \
  --desubroutinize \
  --output-file=maple-mono-cn-bold.woff2

# ---------- 6. 校验两者字形覆盖一致 ----------
python - <<'PY'
from fontTools.ttLib import TTFont
a = set(TTFont('maple-mono-cn-regular.woff2').getBestCmap())
b = set(TTFont('maple-mono-cn-bold.woff2').getBestCmap())
print(f'regular glyphs: {len(a)}  bold glyphs: {len(b)}')
print(f'regular-only: {len(a - b)}  bold-only: {len(b - a)}')
assert not (a - b), 'Bold 缺少 regular 已有的字形，必须修正'
PY

# ---------- 7. 落到 public/fonts ----------
cp maple-mono-cn-regular.woff2 maple-mono-cn-bold.woff2 "${OUT}/"
ls -la "${OUT}"
echo "==> 完成。app/globals.css 里为同一族名写 400 / 700 两条 @font-face，unicode-range 照抄 better-admin 那份。"

export function detectFrameSlots(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const W = img.naturalWidth;
      const H = img.naturalHeight;
      const tmp = document.createElement("canvas");
      tmp.width = W;
      tmp.height = H;
      const ctx = tmp.getContext("2d");
      ctx.drawImage(img, 0, 0);

      let data;
      try {
        data = ctx.getImageData(0, 0, W, H).data;
      } catch {
        resolve(null);
        return;
      }

      const isTransp = (idx) => data[idx * 4 + 3] < 50;

      // Flood-fill from image border to mark outer background transparency
      const bgMark = new Uint8Array(W * H);
      const stack = [];

      const visit = (x, y) => {
        const idx = y * W + x;
        if (bgMark[idx] || !isTransp(idx)) return;
        bgMark[idx] = 1;
        stack.push(x, y);
      };

      for (let x = 0; x < W; x++) { visit(x, 0); visit(x, H - 1); }
      for (let y = 1; y < H - 1; y++) { visit(0, y); visit(W - 1, y); }

      while (stack.length > 0) {
        const y = stack.pop();
        const x = stack.pop();
        if (x > 0) visit(x - 1, y);
        if (x < W - 1) visit(x + 1, y);
        if (y > 0) visit(x, y - 1);
        if (y < H - 1) visit(x, y + 1);
      }

      // Pass 1: column counts to find vertical divider (divX)
      const colCounts = new Int32Array(W);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const idx = y * W + x;
          if (isTransp(idx) && !bgMark[idx]) colCounts[x]++;
        }
      }

      let minCol = Infinity, divX = Math.floor(W / 2);
      for (let x = Math.floor(W * 0.2); x < Math.floor(W * 0.8); x++) {
        if (colCounts[x] < minCol) { minCol = colCounts[x]; divX = x; }
      }

      // Pass 2: row counts split by left/right to find separate horizontal dividers per column
      const rowCountsL = new Int32Array(H);
      const rowCountsR = new Int32Array(H);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const idx = y * W + x;
          if (isTransp(idx) && !bgMark[idx]) {
            if (x < divX) rowCountsL[y]++;
            else rowCountsR[y]++;
          }
        }
      }

      let minRowL = Infinity, divYL = Math.floor(H / 2);
      for (let y = Math.floor(H * 0.2); y < Math.floor(H * 0.8); y++) {
        if (rowCountsL[y] < minRowL) { minRowL = rowCountsL[y]; divYL = y; }
      }

      let minRowR = Infinity, divYR = Math.floor(H / 2);
      for (let y = Math.floor(H * 0.2); y < Math.floor(H * 0.8); y++) {
        if (rowCountsR[y] < minRowR) { minRowR = rowCountsR[y]; divYR = y; }
      }

      // Find bounding box of inner transparent pixels in each of the 4 regions
      // Left column uses divYL, right column uses divYR
      const quadrants = [
        [0, divX, 0, divYL],
        [divX, W, 0, divYR],
        [0, divX, divYL, H],
        [divX, W, divYR, H],
      ];

      const slots = quadrants.map(([x1, x2, y1, y2]) => {
        let minX = x2, maxX = x1, minY = y2, maxY = y1;
        let found = false;

        for (let y = y1; y < y2; y += 2) {
          for (let x = x1; x < x2; x += 2) {
            const idx = y * W + x;
            if (isTransp(idx) && !bgMark[idx]) {
              found = true;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (!found) {
          return {
            left: (x1 / W) * 100,
            top: (y1 / H) * 100,
            width: ((x2 - x1) / W) * 100,
            height: ((y2 - y1) / H) * 100,
          };
        }

        const pad = 4;
        const sx = Math.max(0, minX - pad);
        const sy = Math.max(0, minY - pad);
        const ex = Math.min(W, maxX + pad + 2);
        const ey = Math.min(H, maxY + pad + 2);
        return {
          left: (sx / W) * 100,
          top: (sy / H) * 100,
          width: ((ex - sx) / W) * 100,
          height: ((ey - sy) / H) * 100,
        };
      });

      resolve(slots);
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Global patch to intercept and replace unsupported CSS color functions (like oklch)
// with standard rgb/rgba. This is crucial for html2canvas and other legacy PDF/canvas generators
// that crash when parsing modern CSS colors used by Tailwind CSS v4.

// Helper function to convert a single oklch color string to standard rgb/rgba
export function convertOklchToRgb(oklchStr: string): string {
  try {
    // Clean string: oklch(L C H / A) or oklch(L, C, H, A)
    const clean = oklchStr.trim().replace(/^oklch\(/i, "").replace(/\)$/, "").trim();
    const normalized = clean.replace(/[\/,]/g, " ");
    const tokens = normalized.split(/\s+/).filter(Boolean);
    
    if (tokens.length < 3) {
      return "rgb(0, 0, 0)";
    }

    const L_val = tokens[0];
    const C_val = tokens[1];
    const H_val = tokens[2];
    const A_val = tokens[3];

    let L = parseFloat(L_val);
    if (isNaN(L)) L = 0;
    if (L_val.endsWith("%")) L = L / 100;

    let C = parseFloat(C_val);
    if (isNaN(C)) C = 0;

    let H = parseFloat(H_val);
    if (isNaN(H)) H = 0;

    let alpha = 1;
    if (A_val) {
      alpha = parseFloat(A_val);
      if (isNaN(alpha)) alpha = 1;
      if (A_val.endsWith("%")) alpha = alpha / 100;
    }

    // Mathematical conversion from OKLCH to Linear RGB
    const hRad = (H * Math.PI) / 180;
    const a = C * Math.cos(hRad);
    const b = C * Math.sin(hRad);

    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

    const l_lin = l_ * l_ * l_;
    const m_lin = m_ * m_ * m_;
    const s_lin = s_ * s_ * s_;

    const r_lin = +4.0767416621 * l_lin - 3.3077115913 * m_lin + 0.2309699292 * s_lin;
    const g_lin = -1.2684380046 * l_lin + 2.6097574011 * m_lin - 0.3413193965 * s_lin;
    const b_lin = -0.0041960863 * l_lin - 0.7034186145 * m_lin + 1.7076147010 * s_lin;

    const transformChannel = (c: number) => {
      if (c <= 0.0031308) return 12.92 * c;
      return 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    };

    const r = Math.round(Math.max(0, Math.min(1, transformChannel(r_lin))) * 255);
    const g = Math.round(Math.max(0, Math.min(1, transformChannel(g_lin))) * 255);
    const b_col = Math.round(Math.max(0, Math.min(1, transformChannel(b_lin))) * 255);

    if (alpha === 1) {
      return `rgb(${r}, ${g}, ${b_col})`;
    } else {
      return `rgba(${r}, ${g}, ${b_col}, ${alpha})`;
    }
  } catch (err) {
    console.warn("oklch conversion error:", err);
    return "rgb(255, 255, 255)";
  }
}

// Safely parses and replaces all unsupported colors within complex properties (e.g. background-image linear-gradient, box-shadow)
export function replaceUnsupportedColors(str: string): string {
  if (!str || typeof str !== "string") {
    return str;
  }
  let newStr = str;
  if (newStr.includes("oklch")) {
    newStr = newStr.replace(/oklch\([^)]+\)/g, (match) => {
      return convertOklchToRgb(match);
    });
  }
  if (newStr.includes("oklab")) {
    newStr = newStr.replace(/oklab\([^)]+\)/g, (match) => {
      const lMatch = match.match(/oklab\(\s*([+-]?\d*(?:\.\d+)?%?)/);
      if (lMatch) {
         let L = parseFloat(lMatch[1]);
         if (lMatch[1].endsWith("%")) L = L / 100;
         const v = Math.round(L * 255);
         return `rgb(${v}, ${v}, ${v})`;
      }
      return "rgb(200, 200, 200)";
    });
  }
  if (newStr.includes("color-mix")) {
     newStr = newStr.replace(/color-mix\([^)]+\)/g, "rgb(128, 128, 128)");
  }
  if (newStr.includes("color(")) {
    newStr = newStr.replace(/color\([^)]+\)/g, "rgb(128, 128, 128)");
  }
  return newStr;
}

export function createFastComputedStyleProxy(styles: CSSStyleDeclaration): CSSStyleDeclaration {
  return new Proxy(styles, {
    get(target, prop) {
      if (prop === "getPropertyValue") {
        return (propertyName: string) => {
          const val = target.getPropertyValue(propertyName);
          if (typeof val === "string" && (val.includes("oklch") || val.includes("oklab") || val.includes("color-mix") || val.includes("color("))) {
            return replaceUnsupportedColors(val);
          }
          return val;
        };
      }
      const value = target[prop as any];
      if (typeof value === "function") {
        return (value as any).bind(target);
      }
      if (typeof value === "string" && (value.includes("oklch") || value.includes("oklab") || value.includes("color-mix") || value.includes("color("))) {
        return replaceUnsupportedColors(value);
      }
      return value;
    },
  });
}

// Automatically apply the patch globally if in browser environment
if (typeof window !== "undefined") {
  const originalGetComputedStyle = window.getComputedStyle;
  if (originalGetComputedStyle) {
    window.getComputedStyle = function (elt, pseudoElt) {
      const styles = originalGetComputedStyle.call(this, elt, pseudoElt);
      return createFastComputedStyleProxy(styles);
    };
  }
  
  if (typeof document !== "undefined" && document.defaultView) {
    const originalDefaultViewGetComputedStyle = document.defaultView.getComputedStyle;
    if (originalDefaultViewGetComputedStyle && originalDefaultViewGetComputedStyle !== originalGetComputedStyle) {
      document.defaultView.getComputedStyle = function (elt, pseudoElt) {
        const styles = originalDefaultViewGetComputedStyle.call(this, elt, pseudoElt);
        return createFastComputedStyleProxy(styles);
      };
    }
  }
}

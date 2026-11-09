// Battle, navigation and DOM hit targets share a 1280 × 720 coordinate system.
globalThis.GameFrame = (() => {
  const logicalWidth = 1280, logicalHeight = 720;
  let scale = 1;
  function resize() {
    const viewport = document.documentElement;
    const width = viewport.clientWidth, height = viewport.clientHeight;
    scale = Math.min(width / logicalWidth, height / logicalHeight) || 1;
    viewport.style.setProperty("--game-scale", String(scale));
    viewport.style.setProperty("--game-left", Math.round((width - logicalWidth * scale) / 2) + "px");
    viewport.style.setProperty("--game-top", Math.round((height - logicalHeight * scale) / 2) + "px");
  }
  function placeTooltip(node, anchor) {
    const panel = node.closest("dialog") || document.querySelector("#game-stage");
    const frame = panel.getBoundingClientRect(), target = anchor.getBoundingClientRect();
    const left = (target.left - frame.left) / scale - panel.clientLeft;
    const right = (target.right - frame.left) / scale - panel.clientLeft;
    const top = (target.top - frame.top) / scale - panel.clientTop;
    const x = right + 8 + node.offsetWidth <= panel.clientWidth ? right + 8 : left - node.offsetWidth - 8;
    node.style.left = Math.max(4, Math.min(x, panel.clientWidth - node.offsetWidth - 4)) + "px";
    node.style.top = Math.max(4, Math.min(top, panel.clientHeight - node.offsetHeight - 4)) + "px";
  }
  resize();
  window.addEventListener("resize", resize);
  return { placeTooltip };
})();

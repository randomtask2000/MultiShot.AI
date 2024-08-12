<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let isDownloading: boolean = false;

  let svg: SVGSVGElement;
  let animationFrame: number;
  let nodes: { x: number; y: number; vx: number; vy: number }[] = [];
  let connections: { source: number; target: number }[] = [];

  const nodeCount = 20;
  const connectionCount = 30;

  function initializeNodes() {
    nodes = Array(nodeCount).fill(null).map(() => ({
      x: Math.random() * 200,
      y: Math.random() * 200,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2
    }));
  }

  function initializeConnections() {
    connections = Array(connectionCount).fill(null).map(() => ({
      source: Math.floor(Math.random() * nodeCount),
      target: Math.floor(Math.random() * nodeCount)
    }));
  }

  function updatePositions() {
    nodes = nodes.map(node => {
      let x = node.x + node.vx;
      let y = node.y + node.vy;
      let vx = node.vx;
      let vy = node.vy;

      if (x < 0 || x > 200) vx *= -1;
      if (y < 0 || y > 200) vy *= -1;

      return { x, y, vx, vy };
    });
  }

  function animate() {
    if (!isDownloading) return;

    updatePositions();
    animationFrame = requestAnimationFrame(animate);
  }

  onMount(() => {
    initializeNodes();
    initializeConnections();
  });

  $: if (isDownloading) {
    animate();
  } else if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }

  onDestroy(() => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  });
</script>

<svg bind:this={svg} width="400" height="200" viewBox="0 0 400 200">
  {#each connections as conn}
    <line
      x1={nodes[conn.source].x}
      y1={nodes[conn.source].y}
      x2={nodes[conn.target].x}
      y2={nodes[conn.target].y}
      class="connection"
    />
  {/each}
  {#each nodes as node, index}
    <circle
      cx={node.x}
      cy={node.y}
      r="5"
      class="node node-{index}"
    />
  {/each}
</svg>

<style>
  svg {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 10px;
  }

  .node {
    fill: #4299e1;
    transition: fill 0.3s ease;
  }

  .node:nth-child(3n) {
    animation: pulse 1.5s infinite alternate;
  }

  .connection {
    stroke: #4299e1;
    stroke-width: 1;
    opacity: 0.5;
  }

  @keyframes pulse {
    0% {
      fill: #4299e1;
      r: 5;
    }
    100% {
      fill: #f6e05e;
      r: 7;
    }
  }
</style>
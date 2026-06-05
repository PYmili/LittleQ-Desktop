<script setup lang="ts">
/**
 * AI 等待回复时的打字指示器组件。
 *
 * @remarks
 * 三点呼吸脉冲动画，使用青色调柔光效果。
 * 在助手消息流式输出但尚未收到任何内容时显示，
 * 收到首个字符后立即消失。
 */
</script>

<template>
  <div class="typing-indicator">
    <span class="dot" />
    <span class="dot" />
    <span class="dot" />
  </div>
</template>

<style scoped>
.typing-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--lq-accent-gradient);
  opacity: 0.35;
  animation: pulse 1.4s ease-in-out infinite;
}

.dot:nth-child(1) {
  animation-delay: 0s;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse {
  0%,
  60%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
  30% {
    opacity: 0.9;
    transform: scale(1.2);
  }
}
</style>

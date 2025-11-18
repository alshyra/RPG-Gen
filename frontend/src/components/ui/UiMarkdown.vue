<template>
  <div
    class="markdown-content"
    v-html="renderedMarkdown"
  />
</template>

<script setup>
import { marked } from 'marked';
import { computed } from 'vue';

const props = defineProps({
  text: {
    type: String,
    required: true
  }
});

// Configure marked to allow HTML
marked.setOptions({
  async: false,
  breaks: false,
  extensions: null,
  gfm: true,
  hooks: null,
  pedantic: false,
  silent: false,
  tokenizer: null,
  walkTokens: null
});

const renderedMarkdown = computed(() => {
  return marked(props.text);
});
</script>

<style scoped>
.markdown-content {
  color: #f1f5f9;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3 {
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-weight: 600;
  color: #e0e7ff;
}

.markdown-content p {
  margin-bottom: 0.5em;
  line-height: 1.5;
}

.markdown-content code {
  background-color: #1e293b;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: monospace;
  color: #94a3b8;
}

.markdown-content pre {
  background-color: #0f172a;
  padding: 1em;
  border-radius: 5px;
  overflow-x: auto;
  border: 1px solid #334155;
}

.markdown-content pre code {
  background-color: transparent;
  padding: 0;
  color: #cbd5e1;
}

.markdown-content img {
  max-width: 100%;
  height: auto;
  margin: 0.5em 0;
  border-radius: 4px;
  border: 1px solid #334155;
}

.markdown-content ul,
.markdown-content ol {
  margin-left: 1.5em;
  margin-bottom: 0.5em;
}

.markdown-content li {
  margin-bottom: 0.25em;
}

.markdown-content blockquote {
  border-left: 4px solid #64748b;
  padding-left: 1em;
  margin-left: 0;
  margin-bottom: 0.5em;
  color: #94a3b8;
}

.markdown-content a {
  color: #60a5fa;
  text-decoration: none;
}

.markdown-content a:hover {
  text-decoration: underline;
  color: #93c5fd;
}

.markdown-content table {
  border-collapse: collapse;
  margin-bottom: 0.5em;
  width: 100%;
}

.markdown-content th,
.markdown-content td {
  border: 1px solid #334155;
  padding: 0.5em;
  text-align: left;
}

.markdown-content th {
  background-color: #1e293b;
  font-weight: bold;
  color: #e0e7ff;
}

.markdown-content td {
  background-color: rgba(15, 23, 42, 0.5);
}

.markdown-content strong {
  color: #f1f5f9;
  font-weight: 600;
}

.markdown-content em {
  color: #cbd5e1;
}
</style>

<template>
  <div class="markdown-content" v-html="renderedMarkdown"></div>
</template>

<script>
import { marked } from 'marked';

export default {
  name: 'Markdown',
  props: {
    text: {
      type: String,
      required: true
    }
  },
  computed: {
    renderedMarkdown() {
      return marked(this.text);
    }
  }
};
</script>

<style scoped>
.markdown-content h1,
.markdown-content h2,
.markdown-content h3 {
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.markdown-content p {
  margin-bottom: 0.5em;
}

.markdown-content code {
  background-color: #f4f4f4;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: monospace;
}

.markdown-content pre {
  background-color: #f4f4f4;
  padding: 1em;
  border-radius: 5px;
  overflow-x: auto;
}
</style>